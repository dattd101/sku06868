import { load, type CheerioAPI } from "cheerio";
import type { CrawlJob, KenoResult, LotteryResult, VietlottResult } from "./types";

const BASE_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; Next15LotteryCrawler/1.0)",
  Accept: "text/html,application/xhtml+xml",
};

async function getPage(url: string) {
  const response = await fetch(url, {
    headers: BASE_HEADERS,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Nguồn dữ liệu trả về HTTP ${response.status}`);
  return load(await response.text());
}

function getDrawDate($: CheerioAPI) {
  const dayMonth = $("div.ngaykqxs span.daymonth").first().text().trim();
  const year = $("div.ngaykqxs span.year").first().text().trim();
  if (!dayMonth || !year) throw new Error("Không đọc được ngày quay");
  return `${dayMonth}/${year}`;
}

export async function crawlXsmb(): Promise<LotteryResult[]> {
  const $ = await getPage("https://www.minhchinh.com/ket-qua-xo-so-mien-bac.html");
  const box = $("div.box_kqxs table.kqxsmienbac").first();
  if (!box.length) throw new Error("Không tìm thấy bảng kết quả XSMB");
  const getNumbers = (selector: string) => box.find(selector).first().children("div")
    .map((_, element) => $(element).text().trim()).get().filter(Boolean).join(", ");

  const result: LotteryResult = {
    ngay_quay: getDrawDate($),
    tinh: box.find("td.tentinh span.phathanh a").first().text().trim() || "Miền Bắc",
    giai_db: getNumbers("td.giai_dac_biet"),
    giai_nhat: getNumbers("td.giai_nhat"),
    giai_nhi: getNumbers("td.giai_nhi"),
    giai_ba: getNumbers("td.giai_ba"),
    giai_tu: getNumbers("td.giai_tu"),
    giai_nam: getNumbers("td.giai_nam"),
    giai_sau: getNumbers("td.giai_sau"),
    giai_bay: getNumbers("td.giai_bay"),
  };
  const expectedCounts: Array<[keyof LotteryResult, number]> = [
    ["giai_db", 1], ["giai_nhat", 1], ["giai_nhi", 2], ["giai_ba", 6],
    ["giai_tu", 4], ["giai_nam", 6], ["giai_sau", 3], ["giai_bay", 4],
  ];
  const complete = expectedCounts.every(([field, count]) =>
    String(result[field] ?? "").split(",").filter((value) => value.trim()).length === count,
  );
  if (!complete) throw new Error("Kết quả XSMB chưa đầy đủ, sẽ thử lại theo lịch");
  return [result];
}

export async function crawlXsmn(): Promise<LotteryResult[]> {
  const $ = await getPage("https://www.minhchinh.com/ket-qua-xo-so-mien-nam.html");
  const box = $("div.box_kqxs table.kqxsmiennam.miennam4cot").first();
  if (!box.length) throw new Error("Không tìm thấy bảng kết quả XSMN");

  const provinces = box.find("thead tr:nth-of-type(3) td.tentinh a").map((_, element) => $(element).text().trim()).get().filter(Boolean);
  if (!provinces.length) throw new Error("Không đọc được danh sách tỉnh XSMN");
  const empty = (tinh: string): LotteryResult => ({
    ngay_quay: getDrawDate($), tinh, giai_db: "", giai_nhat: "", giai_nhi: "",
    giai_ba: "", giai_tu: "", giai_nam: "", giai_sau: "", giai_bay: "", giai_tam: "",
  });
  const results = provinces.map(empty);
  const mapping: Record<string, keyof LotteryResult> = {
    ten_giai_dac_biet: "giai_db", ten_giai_nhat: "giai_nhat", ten_giai_nhi: "giai_nhi",
    ten_giai_ba: "giai_ba", ten_giai_tu: "giai_tu", ten_giai_nam: "giai_nam",
    ten_giai_sau: "giai_sau", ten_giai_bay: "giai_bay", ten_giai_tam: "giai_tam",
  };

  box.find("tbody tr").each((_, row) => {
    const cells = $(row).find("td");
    const field = mapping[cells.first().attr("class")?.split(/\s+/)[0] ?? ""];
    if (!field) return;
    provinces.forEach((__, index) => {
      const value = cells.eq(index + 1).find("div").map((___, item) => $(item).text().trim()).get().filter(Boolean).join(", ");
      results[index][field] = value;
    });
  });
  const expectedCounts: Array<[keyof LotteryResult, number]> = [
    ["giai_db", 1], ["giai_nhat", 1], ["giai_nhi", 1], ["giai_ba", 2],
    ["giai_tu", 7], ["giai_nam", 1], ["giai_sau", 3], ["giai_bay", 1], ["giai_tam", 1],
  ];
  const complete = results.every((result) => expectedCounts.every(([field, count]) =>
    String(result[field] ?? "").split(",").filter((value) => value.trim()).length === count,
  ));
  if (!complete) throw new Error("Kết quả XSMN chưa đầy đủ, sẽ thử lại theo lịch");
  return results;
}

async function crawlVietlott(kind: "mega645" | "power655"): Promise<VietlottResult> {
  const isMega = kind === "mega645";
  const url = isMega
    ? "https://www.minhchinh.com/truc-tiep-xo-so-tu-chon-mega-645.html"
    : "https://www.minhchinh.com/truc-tiep-xo-so-tu-chon-power-655.html";
  const $ = await getPage(url);
  const box = $(isMega ? "div.boxketqua_vl.box_tructiep_vietlott_1" : "div.boxketqua_vl.box_tructiep_vietlott_3").first();
  if (!box.length) throw new Error(`Không tìm thấy kết quả ${isMega ? "Mega 6/45" : "Power 6/55"}`);

  const links = box.find("div.ngay a");
  const drawLink = box.find(`div.ngay a[href*='${isMega ? "xs-mega-645" : "xs-power-655"}']`).first();
  const values = box.find(isMega ? "div.box_ketqua span.ball_mega" : "div.box_ketqua span.ball_power, div.box_ketqua span.ball_power2")
    .map((_, element) => $(element).text().trim()).get().filter(Boolean);
  const expected = isMega ? 6 : 7;
  const result = {
    so_ky_quay: drawLink.text().trim().replace("#", ""),
    thoi_gian: links.last().text().trim(),
    so_trung: values.join(", "),
  };
  if (!result.so_ky_quay || !result.thoi_gian || values.length !== expected) {
    throw new Error(`Dữ liệu không hợp lệ: cần ${expected} số nhưng nhận được ${values.length}`);
  }
  return result;
}

export async function crawlKeno(): Promise<KenoResult[]> {
  const $ = await getPage("https://vietlott.vn/vi/trung-thuong/ket-qua-trung-thuong/winning-number-keno");
  const results: KenoResult[] = [];

  $("tr").each((_, row) => {
    const links = $(row).find("a");
    if (links.length < 2) return;

    const drawDateTime = links.eq(0).text().replace(/\s+/g, " ").trim();
    const drawNo = links.eq(1).text().replace("#", "").trim();
    if (!/^\d+$/.test(drawNo)) return;

    const values = $(row).find("span").map((__, span) => $(span).text().trim()).get()
      .filter((value) => /^\d+$/.test(value));
    if (values.length !== 20) return;

    const match = drawDateTime.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}:\d{2})(?::\d{2})?)?$/);
    if (!match) return;
    const numericValues = values.map(Number);
    const soChan = numericValues.filter((number) => number % 2 === 0).length;
    const soLon = numericValues.filter((number) => number > 40).length;

    results.push({
      drawDate: `${match[3]}-${match[2]}-${match[1]}`,
      drawTime: match[4] ? `${match[4]}:00` : "",
      drawNo,
      numbers: values,
      soChan,
      soLe: 20 - soChan,
      soLon,
      soNho: 20 - soLon,
    });
  });

  if (!results.length) throw new Error("Không tìm thấy kỳ Keno hợp lệ");
  return results.sort((a, b) => Number(a.drawNo) - Number(b.drawNo));
}

export function crawl(job: CrawlJob) {
  if (job === "xsmb") return crawlXsmb();
  if (job === "xsmn") return crawlXsmn();
  if (job === "keno") return crawlKeno();
  return crawlVietlott(job);
}
