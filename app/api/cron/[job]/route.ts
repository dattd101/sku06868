import { apiJson } from "@/lib/api";
import { runScheduledJob } from "@/lib/scheduler";
import type { CrawlJob } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const validJobs: CrawlJob[] = ["xsmb", "xsmn", "mega645", "power655", "keno"];

export async function GET(request: Request, context: { params: Promise<{ job: string }> }) {
  const secret = process.env.CRON_SECRET;
  if (process.env.VERCEL && !secret) {
    return apiJson({ success: false, error: "Server chưa cấu hình CRON_SECRET." }, 503);
  }
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return apiJson({ success: false, error: "Không có quyền chạy cron." }, 401);
  }

  const { job } = await context.params;
  if (!validJobs.includes(job as CrawlJob)) {
    return apiJson({ success: false, error: "Crawler không hợp lệ." }, 404);
  }

  const status = await runScheduledJob(job as CrawlJob);
  return apiJson({ success: status.lastSuccess, job, message: status.lastMessage, ran_at: status.lastRun }, status.lastSuccess ? 200 : 500);
}
