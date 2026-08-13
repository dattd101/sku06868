import { apiJson, apiOptions, apiSources, getPublicResults, readPagination } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { limit, offset } = readPagination(request);
    const results = await Promise.all(apiSources.map((source) => getPublicResults(source, limit, offset)));
    const data = Object.fromEntries(apiSources.map((source, index) => [source, results[index]]));

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
