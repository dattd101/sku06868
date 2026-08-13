import type { CrawlJob } from "./types";

const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

function vietnamParts(date: Date) {
  const local = new Date(date.getTime() + VIETNAM_OFFSET_MS);
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth(),
    day: local.getUTCDate(),
    weekday: local.getUTCDay(),
    hour: local.getUTCHours(),
    minute: local.getUTCMinutes(),
    second: local.getUTCSeconds(),
  };
}

function vietnamDate(year: number, month: number, day: number, hour: number, minute: number) {
  return new Date(Date.UTC(year, month, day, hour - 7, minute, 0));
}

function nextDaily(now: Date, hour: number, minute: number) {
  const parts = vietnamParts(now);
  const today = vietnamDate(parts.year, parts.month, parts.day, hour, minute);
  if (now.getTime() < today.getTime()) return today;
  return vietnamDate(parts.year, parts.month, parts.day + 1, hour, minute);
}

function nextWeekly(now: Date, weekdays: number[]) {
  const parts = vietnamParts(now);
  for (let daysAhead = 0; daysAhead <= 7; daysAhead += 1) {
    const weekday = (parts.weekday + daysAhead) % 7;
    if (!weekdays.includes(weekday)) continue;
    const target = vietnamDate(parts.year, parts.month, parts.day + daysAhead, 18, 0);
    if (target.getTime() > now.getTime()) return target;
  }
  throw new Error("Không tính được lịch Vietlott tiếp theo");
}

function nextKeno(now: Date) {
  const parts = vietnamParts(now);
  const start = vietnamDate(parts.year, parts.month, parts.day, 6, 0);
  const end = vietnamDate(parts.year, parts.month, parts.day, 22, 10);
  if (now.getTime() < start.getTime()) return start;
  if (now.getTime() >= end.getTime()) {
    return vietnamDate(parts.year, parts.month, parts.day + 1, 6, 0);
  }

  const nextMinute = (Math.floor(parts.minute / 6) + 1) * 6;
  const target = vietnamDate(
    parts.year,
    parts.month,
    parts.day,
    parts.hour + Math.floor(nextMinute / 60),
    nextMinute % 60,
  );
  return target.getTime() <= end.getTime()
    ? target
    : vietnamDate(parts.year, parts.month, parts.day + 1, 6, 0);
}

export function getNextScheduledRun(job: CrawlJob, now = new Date()) {
  if (job === "xsmn") return nextDaily(now, 16, 15);
  if (job === "xsmb") return nextDaily(now, 19, 0);
  if (job === "mega645") return nextWeekly(now, [0, 3, 5]); // Chủ nhật, thứ 4, thứ 6
  if (job === "power655") return nextWeekly(now, [2, 4, 6]); // Thứ 3, thứ 5, thứ 7
  return nextKeno(now);
}

export function isVietlottDrawWindow(job: "mega645" | "power655", now = new Date()) {
  const parts = vietnamParts(now);
  const weekdays = job === "mega645" ? [0, 3, 5] : [2, 4, 6];
  const minutes = parts.hour * 60 + parts.minute;
  return weekdays.includes(parts.weekday) && minutes >= 18 * 60 && minutes <= 18 * 60 + 30;
}

export function isKenoActive(now = new Date()) {
  const parts = vietnamParts(now);
  const minutes = parts.hour * 60 + parts.minute;
  return minutes >= 6 * 60 && minutes <= 22 * 60 + 10;
}
