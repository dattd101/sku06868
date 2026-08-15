import "server-only";

import { NextResponse } from "next/server";
import { getXmlKenoResults, getXmlLotteryResults, getXmlVietlottResults } from "./xml-store";

export const apiSources = ["xsmb", "xsmn", "mega645", "power655", "keno"] as const;
export type ApiSource = (typeof apiSources)[number];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Cache-Control": "no-store, max-age=0",
};

export function apiJson(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}

export function apiOptions() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export function readPagination(request: Request) {
  const params = new URL(request.url).searchParams;
  const rawLimit = Number(params.get("limit") ?? 20);
  const rawOffset = Number(params.get("offset") ?? 0);
  return {
    limit: Number.isInteger(rawLimit) ? Math.min(100, Math.max(1, rawLimit)) : 20,
    offset: Number.isInteger(rawOffset) ? Math.max(0, rawOffset) : 0,
  };
}

function splitNumbers(value: string) {
  return value.split(",").map((number) => number.trim()).filter(Boolean);
}

export async function getPublicResults(source: ApiSource, limit: number, offset: number) {
  if (source === "xsmb" || source === "xsmn") {
    const rows = await getXmlLotteryResults(source, limit, offset);
    return rows.map((row) => ({
      ...row,
      giai_db: splitNumbers(row.giai_db),
      giai_nhat: splitNumbers(row.giai_nhat),
      giai_nhi: splitNumbers(row.giai_nhi),
      giai_ba: splitNumbers(row.giai_ba),
      giai_tu: splitNumbers(row.giai_tu),
      giai_nam: splitNumbers(row.giai_nam),
      giai_sau: splitNumbers(row.giai_sau),
      giai_bay: splitNumbers(row.giai_bay),
      ...(source === "xsmn" ? { giai_tam: splitNumbers(row.giai_tam ?? "") } : {}),
    }));
  }

  if (source === "keno") {
    const rows = await getXmlKenoResults(limit, offset);
    return rows.map((row) => ({ ...row, numbers: splitNumbers(row.numbers) }));
  }

  const rows = await getXmlVietlottResults(source, limit, offset);
  return rows.map((row) => ({
    ...row,
    so_trung: splitNumbers(row.so_trung),
  }));
}
