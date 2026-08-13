import { apiJson, apiOptions, apiSources, getPublicResults, readPagination, type ApiSource } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ source: string }> }) {
  const { source } = await context.params;
  if (!apiSources.includes(source as ApiSource)) {
    return apiJson({
      success: false,
      error: `Nguồn '${source}' không hợp lệ.`,
      allowed_sources: apiSources,
    }, 404);
  }

  try {
    const { limit, offset } = readPagination(request);
    const data = await getPublicResults(source as ApiSource, limit, offset);
    return apiJson({
      success: true,
      source,
      count: data.length,
      limit,
      offset,
      updated_at: new Date().toISOString(),
      data,
    });
  } catch (error) {
    console.error(`[api:${source}]`, error);
    return apiJson({ success: false, error: "Không thể đọc dữ liệu." }, 500);
  }
}

export const OPTIONS = apiOptions;
