"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function formatRemaining(milliseconds: number) {
  if (milliseconds <= 0) return "Đang chạy crawl...";
  const totalSeconds = Math.floor(milliseconds / 1_000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  const clock = [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
  return days > 0 ? `Còn ${days} ngày ${clock}` : `Còn ${clock}`;
}

export default function CountdownButton({ nextRun, running }: { nextRun: string; running: boolean }) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(() => new Date(nextRun).getTime() - Date.now());

  useEffect(() => {
    setRemaining(new Date(nextRun).getTime() - Date.now());
    const timer = window.setInterval(() => {
      const value = new Date(nextRun).getTime() - Date.now();
      setRemaining(value);
      if (value <= -2_000) router.refresh();
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [nextRun, router]);

  return <div className="countdown-button" aria-live="polite">{running ? "Đang chạy crawl..." : formatRemaining(remaining)}</div>;
}
