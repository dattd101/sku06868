export type LotteryRegion = "xsmb" | "xsmn";
export type VietlottKind = "mega645" | "power655" | "keno";
export type CrawlJob = LotteryRegion | VietlottKind;

export interface LotteryResult {
  ngay_quay: string;
  tinh: string;
  giai_db: string;
  giai_nhat: string;
  giai_nhi: string;
  giai_ba: string;
  giai_tu: string;
  giai_nam: string;
  giai_sau: string;
  giai_bay: string;
  giai_tam?: string;
}

export interface VietlottResult {
  thoi_gian: string;
  so_ky_quay: string;
  so_trung: string;
}

export interface KenoResult {
  drawDate: string;
  drawTime: string;
  drawNo: string;
  numbers: string[];
  soChan: number;
  soLe: number;
  soLon: number;
  soNho: number;
}
