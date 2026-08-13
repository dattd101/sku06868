import "server-only";

import { createClient, type InStatement } from "@libsql/client";
import path from "node:path";
import type { KenoResult, LotteryResult, VietlottResult } from "./types";

const isVercel = Boolean(process.env.VERCEL);
const remoteUrl = process.env.TURSO_DATABASE_URL;
const databaseUrl = remoteUrl
  ?? (isVercel ? "file:/tmp/databases.db" : `file:${path.join(process.cwd(), "databases.db")}`);

const db = createClient({
  url: databaseUrl,
  authToken: remoteUrl ? process.env.TURSO_AUTH_TOKEN : undefined,
});

const schema: InStatement[] = [
  `CREATE TABLE IF NOT EXISTS xsmb (
    id INTEGER PRIMARY KEY AUTOINCREMENT, ngay_quay TEXT NOT NULL, tinh TEXT NOT NULL,
    giai_db TEXT, giai_nhat TEXT, giai_nhi TEXT, giai_ba TEXT, giai_tu TEXT,
    giai_nam TEXT, giai_sau TEXT, giai_bay TEXT, created_vn TEXT NOT NULL,
    UNIQUE(ngay_quay, tinh)
  )`,
  `CREATE TABLE IF NOT EXISTS xsmn (
    id INTEGER PRIMARY KEY AUTOINCREMENT, ngay_quay TEXT NOT NULL, tinh TEXT NOT NULL,
    giai_db TEXT, giai_nhat TEXT, giai_nhi TEXT, giai_ba TEXT, giai_tu TEXT,
    giai_nam TEXT, giai_sau TEXT, giai_bay TEXT, giai_tam TEXT, created_vn TEXT NOT NULL,
    UNIQUE(ngay_quay, tinh)
  )`,
  `CREATE TABLE IF NOT EXISTS mega645 (
    id INTEGER PRIMARY KEY AUTOINCREMENT, thoi_gian TEXT NOT NULL,
    so_ky_quay TEXT NOT NULL UNIQUE, so_trung TEXT NOT NULL, created_vn TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS power655 (
    id INTEGER PRIMARY KEY AUTOINCREMENT, thoi_gian TEXT NOT NULL,
    so_ky_quay TEXT NOT NULL UNIQUE, so_trung TEXT NOT NULL, created_vn TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS keno (
    id INTEGER PRIMARY KEY AUTOINCREMENT, draw_date TEXT NOT NULL, draw_time TEXT NOT NULL,
    draw_no TEXT NOT NULL UNIQUE, numbers TEXT NOT NULL, so_chan INTEGER NOT NULL,
    so_le INTEGER NOT NULL, so_lon INTEGER NOT NULL, so_nho INTEGER NOT NULL,
    created_vn TEXT NOT NULL
  )`,
];

let initialization: Promise<unknown> | undefined;
function initDatabase() {
  initialization ??= db.batch(schema, "write");
  return initialization;
}

function nowInVietnam() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(new Date());
}

export function getDatabaseMode() {
  return remoteUrl
    ? { persistent: true, label: "Turso cloud (dữ liệu lâu dài)" }
    : isVercel
      ? { persistent: false, label: "Vercel /tmp (dữ liệu tạm thời)" }
      : { persistent: true, label: "SQLite databases.db cục bộ" };
}

export async function saveLottery(table: "xsmb" | "xsmn", rows: LotteryResult[]) {
  await initDatabase();
  const hasEighthPrize = table === "xsmn";
  const columns = hasEighthPrize
    ? "ngay_quay, tinh, giai_db, giai_nhat, giai_nhi, giai_ba, giai_tu, giai_nam, giai_sau, giai_bay, giai_tam, created_vn"
    : "ngay_quay, tinh, giai_db, giai_nhat, giai_nhi, giai_ba, giai_tu, giai_nam, giai_sau, giai_bay, created_vn";
  const updateColumns = hasEighthPrize
    ? "giai_db, giai_nhat, giai_nhi, giai_ba, giai_tu, giai_nam, giai_sau, giai_bay, giai_tam, created_vn"
    : "giai_db, giai_nhat, giai_nhi, giai_ba, giai_tu, giai_nam, giai_sau, giai_bay, created_vn";
  const placeholders = columns.split(", ").map(() => "?").join(", ");
  const updates = updateColumns.split(", ").map((column) => `${column} = excluded.${column}`).join(", ");

  const statements = rows.map((row): InStatement => {
    const args = [row.ngay_quay, row.tinh, row.giai_db, row.giai_nhat, row.giai_nhi,
      row.giai_ba, row.giai_tu, row.giai_nam, row.giai_sau, row.giai_bay];
    if (hasEighthPrize) args.push(row.giai_tam ?? "");
    args.push(nowInVietnam());
    return {
      sql: `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) ON CONFLICT(ngay_quay, tinh) DO UPDATE SET ${updates}`,
      args,
    };
  });
  const results = await db.batch(statements, "write");
  return results.reduce((total, result) => total + result.rowsAffected, 0);
}

export async function saveVietlott(table: "mega645" | "power655", row: VietlottResult) {
  await initDatabase();
  const result = await db.execute({
    sql: `INSERT OR IGNORE INTO ${table} (thoi_gian, so_ky_quay, so_trung, created_vn) VALUES (?, ?, ?, ?)`,
    args: [row.thoi_gian, row.so_ky_quay, row.so_trung, nowInVietnam()],
  });
  return result.rowsAffected;
}

export async function getLotteryResults(table: "xsmb" | "xsmn", limit = 30, offset = 0) {
  await initDatabase();
  const result = await db.execute({ sql: `SELECT * FROM ${table} ORDER BY id DESC LIMIT ? OFFSET ?`, args: [limit, offset] });
  return result.rows as unknown as Array<LotteryResult & { id: number; created_vn: string }>;
}

export async function getVietlottResults(table: "mega645" | "power655", limit = 30, offset = 0) {
  await initDatabase();
  const result = await db.execute({ sql: `SELECT * FROM ${table} ORDER BY id DESC LIMIT ? OFFSET ?`, args: [limit, offset] });
  return result.rows as unknown as Array<VietlottResult & { id: number; created_vn: string }>;
}

export async function saveKeno(rows: KenoResult[]) {
  await initDatabase();
  const statements = rows.map((row): InStatement => ({
    sql: `INSERT OR IGNORE INTO keno (draw_date, draw_time, draw_no, numbers, so_chan, so_le, so_lon, so_nho, created_vn) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [row.drawDate, row.drawTime, row.drawNo, row.numbers.join(","), row.soChan,
      row.soLe, row.soLon, row.soNho, nowInVietnam()],
  }));
  const results = await db.batch(statements, "write");
  return results.reduce((total, result) => total + result.rowsAffected, 0);
}

export async function getKenoResults(limit = 30, offset = 0) {
  await initDatabase();
  const result = await db.execute({
    sql: "SELECT * FROM keno ORDER BY CAST(draw_no AS INTEGER) DESC LIMIT ? OFFSET ?",
    args: [limit, offset],
  });
  return result.rows as unknown as Array<{
    id: number; draw_date: string; draw_time: string; draw_no: string; numbers: string;
    so_chan: number; so_le: number; so_lon: number; so_nho: number; created_vn: string;
  }>;
}
