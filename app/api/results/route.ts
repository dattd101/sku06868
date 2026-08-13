import { apiJson, apiOptions, apiSources, getPublicResults, readPagination } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    const { limit, offset } = readPagination(request);
    const data = Object.fromEntries(apiSources.map((source) => [
      source,
      getPublicResults(source, limit, offset),
    ]));

    return apiJson({
      success: true,
      source: "all",
      limit,
      offset,
      updated_at: new Date().toISOString(),
      data,
    });
  } catch (error) {
    console.error("[api:results]", error);
    return apiJson({ success: false, error: "Không thể đọc dữ liệu." }, 500);
  }
}

export const OPTIONS = apiOptions;
