import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import type { CrawlJob, KenoResult, LotteryResult, VietlottResult } from "./types";

export interface XmlLotteryRow extends LotteryResult { id: number; created_vn: string }
export interface XmlVietlottRow extends VietlottResult { id: number; created_vn: string }
export interface XmlKenoRow {
  id: number; draw_date: string; draw_time: string; draw_no: string; numbers: string;
  so_chan: number; so_le: number; so_lon: number; so_nho: number; created_vn: string;
}

export interface XmlStore {
  xsmb: XmlLotteryRow[];
  xsmn: XmlLotteryRow[];
  mega645: XmlVietlottRow[];
  power655: XmlVietlottRow[];
  keno: XmlKenoRow[];
}

const xmlPath = path.join(process.cwd(), "data", "results.xml");
const emptyStore = (): XmlStore => ({ xsmb: [], xsmn: [], mega645: [], power655: [], keno: [] });
const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false,
  trimValues: true,
  isArray: (_, jPath) => typeof jPath === "string" && jPath.endsWith(".item"),
});
const builder = new XMLBuilder({ ignoreAttributes: false, format: true, indentBy: "  ", suppressEmptyNode: false });

function items(value: unknown): Array<Record<string, string>> {
  if (!value || typeof value !== "object") return [];
  const item = (value as { item?: unknown }).item;
  return Array.isArray(item) ? item as Array<Record<string, string>> : [];
}

function number(value: unknown) { return Number(value ?? 0); }
function string(value: unknown) { return value == null ? "" : String(value); }

export function readXmlStore(): XmlStore {
  if (!existsSync(xmlPath)) return emptyStore();
  const root = parser.parse(readFileSync(xmlPath, "utf8"))?.lotteryData ?? {};
  const lottery = (source: "xsmb" | "xsmn"): XmlLotteryRow[] => items(root[source]).map((row) => ({
    id: number(row.id), ngay_quay: string(row.ngay_quay), tinh: string(row.tinh),
    giai_db: string(row.giai_db), giai_nhat: string(row.giai_nhat), giai_nhi: string(row.giai_nhi),
    giai_ba: string(row.giai_ba), giai_tu: string(row.giai_tu), giai_nam: string(row.giai_nam),
    giai_sau: string(row.giai_sau), giai_bay: string(row.giai_bay),
    ...(source === "xsmn" ? { giai_tam: string(row.giai_tam) } : {}),
    created_vn: string(row.created_vn),
  }));
  const vietlott = (source: "mega645" | "power655"): XmlVietlottRow[] => items(root[source]).map((row) => ({
    id: number(row.id), thoi_gian: string(row.thoi_gian), so_ky_quay: string(row.so_ky_quay),
    so_trung: string(row.so_trung), created_vn: string(row.created_vn),
  }));
  const keno: XmlKenoRow[] = items(root.keno).map((row) => ({
    id: number(row.id), draw_date: string(row.draw_date), draw_time: string(row.draw_time),
    draw_no: string(row.draw_no), numbers: string(row.numbers), so_chan: number(row.so_chan),
    so_le: number(row.so_le), so_lon: number(row.so_lon), so_nho: number(row.so_nho),
    created_vn: string(row.created_vn),
  }));
  return { xsmb: lottery("xsmb"), xsmn: lottery("xsmn"), mega645: vietlott("mega645"), power655: vietlott("power655"), keno };
}

export function writeXmlStore(store: XmlStore) {
  if (process.env.VERCEL) throw new Error("Vercel chỉ đọc XML; GitHub Actions chịu trách nhiệm ghi dữ liệu.");
  const document = {
    lotteryData: {
      updated_at: nowInVietnam(),
      xsmb: { item: store.xsmb }, xsmn: { item: store.xsmn },
      mega645: { item: store.mega645 }, power655: { item: store.power655 }, keno: { item: store.keno },
    },
  };
  mkdirSync(path.dirname(xmlPath), { recursive: true });
  const temporaryPath = `${xmlPath}.tmp`;
  writeFileSync(temporaryPath, `<?xml version="1.0" encoding="UTF-8"?>\n${builder.build(document)}`, "utf8");
  renameSync(temporaryPath, xmlPath);
}

function nowInVietnam() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(new Date());
}

function nextId(rows: Array<{ id: number }>) { return Math.max(0, ...rows.map((row) => row.id)) + 1; }
function sameValues(left: object, right: object, fields: string[]) {
  return fields.every((field) => String((left as Record<string, unknown>)[field] ?? "") === String((right as Record<string, unknown>)[field] ?? ""));
}

export function saveCrawlToXml(job: CrawlJob, result: LotteryResult[] | VietlottResult | KenoResult[]) {
  const store = readXmlStore();
  let changed = 0;
  const created_vn = nowInVietnam();

  if (job === "xsmb" || job === "xsmn") {
    const fields = ["giai_db", "giai_nhat", "giai_nhi", "giai_ba", "giai_tu", "giai_nam", "giai_sau", "giai_bay", ...(job === "xsmn" ? ["giai_tam"] : [])];
    for (const incoming of result as LotteryResult[]) {
      const index = store[job].findIndex((row) => row.ngay_quay === incoming.ngay_quay && row.tinh === incoming.tinh);
      if (index >= 0 && sameValues(store[job][index], incoming, fields)) continue;
      const row: XmlLotteryRow = { ...(index >= 0 ? store[job][index] : { id: nextId(store[job]) }), ...incoming, created_vn };
      if (index >= 0) store[job][index] = row; else store[job].push(row);
      changed += 1;
    }
    store[job].sort((a, b) => b.id - a.id);
  } else if (job === "keno") {
    for (const incoming of result as KenoResult[]) {
      if (store.keno.some((row) => row.draw_no === incoming.drawNo)) continue;
      store.keno.push({
        id: nextId(store.keno), draw_date: incoming.drawDate, draw_time: incoming.drawTime,
        draw_no: incoming.drawNo, numbers: incoming.numbers.join(","), so_chan: incoming.soChan,
        so_le: incoming.soLe, so_lon: incoming.soLon, so_nho: incoming.soNho, created_vn,
      });
      changed += 1;
    }
    store.keno.sort((a, b) => Number(b.draw_no) - Number(a.draw_no));
  } else {
    const incoming = result as VietlottResult;
    if (!store[job].some((row) => row.so_ky_quay === incoming.so_ky_quay)) {
      store[job].push({ id: nextId(store[job]), ...incoming, created_vn });
      store[job].sort((a, b) => b.id - a.id);
      changed = 1;
    }
  }

  if (changed > 0) writeXmlStore(store);
  return changed;
}

export async function getXmlLotteryResults(source: "xsmb" | "xsmn", limit = 30, offset = 0) {
  return readXmlStore()[source].slice(offset, offset + limit);
}
export async function getXmlVietlottResults(source: "mega645" | "power655", limit = 30, offset = 0) {
  return readXmlStore()[source].slice(offset, offset + limit);
}
export async function getXmlKenoResults(limit = 30, offset = 0) {
  return readXmlStore().keno.slice(offset, offset + limit);
}
export async function getXmlCrawlerStats() {
  const store = readXmlStore();
  return Object.fromEntries((Object.keys(store) as Array<keyof XmlStore>).map((source) => [source, {
    total: store[source].length,
    lastUpdate: store[source][0]?.created_vn ?? null,
  }])) as Record<keyof XmlStore, { total: number; lastUpdate: string | null }>;
}
