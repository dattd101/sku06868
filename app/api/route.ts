import { apiJson, apiOptions, apiSources } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  return apiJson({
    success: true,
    name: "Lottery Results API",
    version: "1.0.0",
    description: "API công khai, chỉ đọc dữ liệu xổ số từ SQLite.",
    endpoints: {
      all: `${origin}/api/results?limit=20&offset=0`,
      ...Object.fromEntries(apiSources.map((source) => [source, `${origin}/api/results/${source}?limit=20&offset=0`])),
    },
    pagination: {
      limit: "Số bản ghi mỗi nguồn, từ 1 đến 100. Mặc định 20.",
      offset: "Số bản ghi bỏ qua. Mặc định 0.",
    },
  });
}

export const OPTIONS = apiOptions;
