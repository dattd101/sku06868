import { getSchedulerStatuses } from "@/lib/scheduler";
import CountdownButton from "./countdown-button";

export const dynamic = "force-dynamic";

const jobs = [
  { value: "xsmb", title: "Xổ số miền Bắc", note: "19:00 hằng ngày · lỗi retry sau 30 phút" },
  { value: "xsmn", title: "Xổ số miền Nam", note: "16:15 hằng ngày · lỗi retry sau 15 phút" },
  { value: "mega645", title: "Mega 6/45", note: "18:00 thứ 4, thứ 6, Chủ nhật · retry 5 phút" },
  { value: "power655", title: "Power 6/55", note: "18:00 thứ 3, thứ 5, thứ 7 · retry 5 phút" },
  { value: "keno", title: "Keno", note: "Mỗi 6 phút trong khung 06:00–22:10" },
] as const;

function formatVietnamTime(value: string | null) {
  if (!value) return "Chưa chạy";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value));
}

export default function AdminPage() {
  const statuses = getSchedulerStatuses();
  return (
    <section>
      <div className="page-heading">
        <p className="eyebrow">BACKEND</p>
        <h1>Quản trị crawler</h1>
        <p>Crawler tự động chạy nền theo lịch và lưu kết quả vào <code>databases.db</code>.</p>
      </div>

      <div className="admin-grid">
        {jobs.map((job) => {
          const status = statuses.find((item) => item.job === job.value)!;
          return (
            <article className="admin-card" key={job.value}>
              <div className="admin-title"><h2>{job.title}</h2><span className={status.lastSuccess === false ? "status-dot error-dot" : "status-dot"} /></div>
              <p>{job.note}</p>
              <CountdownButton nextRun={status.nextRun} running={status.running} />
              <div className="job-status">
                <span>Lần chạy gần nhất: {formatVietnamTime(status.lastRun)}</span>
                <span>{status.lastMessage}</span>
              </div>
            </article>
          );
        })}
      </div>
      <p className="hint">Scheduler hoạt động khi tiến trình Next.js đang chạy. Khởi động lại server sẽ tự crawl dữ liệu hiện tại và thiết lập lại lịch.</p>
    </section>
  );
}
