import "server-only";

import { crawl } from "./crawlers";
import { saveKeno, saveLottery, saveVietlott } from "./database";
import { getNextScheduledRun, isKenoActive, isVietlottDrawWindow } from "./schedule";
import type { CrawlJob, KenoResult, LotteryResult, VietlottResult } from "./types";

export interface JobStatus {
  job: CrawlJob;
  running: boolean;
  nextRun: string;
  lastRun: string | null;
  lastMessage: string;
  lastSuccess: boolean | null;
}

interface SchedulerStore {
  started: boolean;
  statuses: Record<CrawlJob, JobStatus>;
  timers: Partial<Record<CrawlJob, ReturnType<typeof setTimeout>>>;
}

const jobs: CrawlJob[] = ["xsmb", "xsmn", "mega645", "power655", "keno"];
const globalScheduler = globalThis as typeof globalThis & { __lotteryScheduler?: SchedulerStore };

function createStore(): SchedulerStore {
  const now = new Date();
  return {
    started: false,
    timers: {},
    statuses: Object.fromEntries(jobs.map((job) => [job, {
      job,
      running: false,
      nextRun: getNextScheduledRun(job, now).toISOString(),
      lastRun: null,
      lastMessage: "Đang chờ lần chạy đầu tiên",
      lastSuccess: null,
    }])) as Record<CrawlJob, JobStatus>,
  };
}

const store = globalScheduler.__lotteryScheduler ??= createStore();

function saveResult(job: CrawlJob, result: Awaited<ReturnType<typeof crawl>>) {
  if (job === "xsmb" || job === "xsmn") return saveLottery(job, result as LotteryResult[]);
  if (job === "keno") return saveKeno(result as KenoResult[]);
  return saveVietlott(job, result as VietlottResult);
}

function retryTime(job: CrawlJob, now: Date) {
  if (job === "xsmn") return new Date(now.getTime() + 15 * 60_000);
  if (job === "xsmb") return new Date(now.getTime() + 30 * 60_000);
  if (job === "keno") return new Date(now.getTime() + 10_000);
  if (isVietlottDrawWindow(job, now)) return new Date(now.getTime() + 5 * 60_000);
  return getNextScheduledRun(job, now);
}

function setNextTimer(job: CrawlJob, target: Date) {
  const status = store.statuses[job];
  status.nextRun = target.toISOString();
  if (store.timers[job]) clearTimeout(store.timers[job]);
  const delay = Math.max(250, target.getTime() - Date.now());
  store.timers[job] = setTimeout(() => void executeJob(job), delay);
}

async function executeJob(job: CrawlJob) {
  const status = store.statuses[job];
  if (status.running) return;
  status.running = true;
  status.lastRun = new Date().toISOString();

  try {
    const result = await crawl(job);
    const changed = saveResult(job, result);
    const now = new Date();
    status.lastSuccess = true;
    status.lastMessage = changed > 0
      ? `Đã lưu/cập nhật ${changed} bản ghi`
      : "Chưa có kỳ mới, dữ liệu không thay đổi";

    const shouldRetryVietlott = (job === "mega645" || job === "power655")
      && changed === 0 && isVietlottDrawWindow(job, now);
    setNextTimer(job, shouldRetryVietlott ? retryTime(job, now) : getNextScheduledRun(job, now));
  } catch (error) {
    const now = new Date();
    status.lastSuccess = false;
    status.lastMessage = error instanceof Error ? error.message : "Lỗi crawl không xác định";
    setNextTimer(job, retryTime(job, now));
    console.error(`[scheduler:${job}]`, error);
  } finally {
    status.running = false;
  }
}

export function startScheduler() {
  if (store.started || process.env.NEXT_PHASE === "phase-production-build") return;
  store.started = true;
  const now = new Date();

  jobs.forEach((job, index) => {
    const runImmediately = job !== "keno" || isKenoActive(now);
    setNextTimer(job, runImmediately
      ? new Date(Date.now() + 1_000 + index * 750)
      : getNextScheduledRun(job, now));
  });
  console.log("[scheduler] Đã khởi động 5 crawler tự động");
}

export function getSchedulerStatuses() {
  startScheduler();
  return jobs.map((job) => ({ ...store.statuses[job] }));
}
