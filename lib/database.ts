import "server-only";

import Database from "better-sqlite3";
import path from "node:path";
import type { KenoResult, LotteryResult, VietlottResult } from "./types";

const dbPath = path.join(process.cwd(), "databases.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS xsmb (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ngay_quay TEXT NOT NULL,
    tinh TEXT NOT NULL,
    giai_db TEXT, giai_nhat TEXT, giai_nhi TEXT, giai_ba TEXT,
    giai_tu TEXT, giai_nam TEXT, giai_sau TEXT, giai_bay TEXT,
    created_vn TEXT NOT NULL,
    UNIQUE(ngay_quay, tinh)
  );
  CREATE TABLE IF NOT EXISTS xsmn (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ngay_quay TEXT NOT NULL,
    tinh TEXT NOT NULL,
    giai_db TEXT, giai_nhat TEXT, giai_nhi TEXT, giai_ba TEXT,
    giai_tu TEXT, giai_nam TEXT, giai_sau TEXT, giai_bay TEXT, giai_tam TEXT,
    created_vn TEXT NOT NULL,
    UNIQUE(ngay_quay, tinh)
  );
  CREATE TABLE IF NOT EXISTS mega645 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thoi_gian TEXT NOT NULL,
    so_ky_quay TEXT NOT NULL UNIQUE,
    so_trung TEXT NOT NULL,
    created_vn TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS power655 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thoi_gian TEXT NOT NULL,
    so_ky_quay TEXT NOT NULL UNIQUE,
    so_trung TEXT NOT NULL,
    created_vn TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS keno (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    draw_date TEXT NOT NULL,
    draw_time TEXT NOT NULL,
    draw_no TEXT NOT NULL UNIQUE,
    numbers TEXT NOT NULL,
    so_chan INTEGER NOT NULL,
    so_le INTEGER NOT NULL,
    so_lon INTEGER NOT NULL,
    so_nho INTEGER NOT NULL,
    created_vn TEXT NOT NULL
  );
`);

function nowInVietnam() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
}

export function saveLottery(table: "xsmb" | "xsmn", rows: LotteryResult[]) {
  const hasEighthPrize = table === "xsmn";
  const columns = hasEighthPrize
    ? "ngay_quay, tinh, giai_db, giai_nhat, giai_nhi, giai_ba, giai_tu, giai_nam, giai_sau, giai_bay, giai_tam, created_vn"
    : "ngay_quay, tinh, giai_db, giai_nhat, giai_nhi, giai_ba, giai_tu, giai_nam, giai_sau, giai_bay, created_vn";
  const placeholders = hasEighthPrize ? "?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?" : "?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?";
  const updateColumns = hasEighthPrize
    ? "giai_db, giai_nhat, giai_nhi, giai_ba, giai_tu, giai_nam, giai_sau, giai_bay, giai_tam, created_vn"
    : "giai_db, giai_nhat, giai_nhi, giai_ba, giai_tu, giai_nam, giai_sau, giai_bay, created_vn";
  const updates = updateColumns.split(", ").map((column) => `${column} = excluded.${column}`).join(", ");
  const statement = db.prepare(`
    INSERT INTO ${table} (${columns}) VALUES (${placeholders})
    ON CONFLICT(ngay_quay, tinh) DO UPDATE SET ${updates}
  `);

  return db.transaction((items: LotteryResult[]) => {
    let inserted = 0;
    for (const row of items) {
      const values = [row.ngay_quay, row.tinh, row.giai_db, row.giai_nhat, row.giai_nhi,
        row.giai_ba, row.giai_tu, row.giai_nam, row.giai_sau, row.giai_bay];
      if (hasEighthPrize) values.push(row.giai_tam ?? "");
      values.push(nowInVietnam());
      inserted += statement.run(...values).changes;
    }
    return inserted;
  })(rows);
}

export function saveVietlott(table: "mega645" | "power655", row: VietlottResult) {
  return db.prepare(`
    INSERT OR IGNORE INTO ${table} (thoi_gian, so_ky_quay, so_trung, created_vn)
    VALUES (?, ?, ?, ?)
  `).run(row.thoi_gian, row.so_ky_quay, row.so_trung, nowInVietnam()).changes;
}

export function getLotteryResults(table: "xsmb" | "xsmn", limit = 30, offset = 0) {
  return db.prepare(`SELECT * FROM ${table} ORDER BY id DESC LIMIT ? OFFSET ?`).all(limit, offset) as Array<LotteryResult & { id: number; created_vn: string }>;
}

export function getVietlottResults(table: "mega645" | "power655", limit = 30, offset = 0) {
  return db.prepare(`SELECT * FROM ${table} ORDER BY id DESC LIMIT ? OFFSET ?`).all(limit, offset) as Array<VietlottResult & { id: number; created_vn: string }>;
}

export function saveKeno(rows: KenoResult[]) {
  const statement = db.prepare(`
    INSERT OR IGNORE INTO keno (
      draw_date, draw_time, draw_no, numbers,
      so_chan, so_le, so_lon, so_nho, created_vn
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  return db.transaction((items: KenoResult[]) => {
    let inserted = 0;
    for (const row of items) {
      inserted += statement.run(
        row.drawDate, row.drawTime, row.drawNo, row.numbers.join(","),
        row.soChan, row.soLe, row.soLon, row.soNho, nowInVietnam(),
      ).changes;
    }
    return inserted;
  })(rows);
}

export function getKenoResults(limit = 30, offset = 0) {
  return db.prepare("SELECT * FROM keno ORDER BY CAST(draw_no AS INTEGER) DESC LIMIT ? OFFSET ?").all(limit, offset) as Array<{
    id: number;
    draw_date: string;
    draw_time: string;
    draw_no: string;
    numbers: string;
    so_chan: number;
    so_le: number;
    so_lon: number;
    so_nho: number;
    created_vn: string;
  }>;
}
