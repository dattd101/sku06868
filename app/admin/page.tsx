import { getXmlCrawlerStats } from "@/lib/xml-store";
import { getNextScheduledRun } from "@/lib/schedule";
import CountdownButton from "./countdown-button";

export const dynamic = "force-dynamic";

const jobs = [
  { value: "xsmb", title: "Xổ số miền Bắc", note: "19:00 hằng ngày" },
  { value: "xsmn", title: "Xổ số miền Nam", note: "16:15 hằng ngày" },
  { value: "mega645", title: "Mega 6/45", note: "18:00 thứ 4, thứ 6, Chủ nhật" },
  { value: "power655", title: "Power 6/55", note: "18:00 thứ 3, thứ 5, thứ 7" },
  { value: "keno", title: "Keno", note: "Mỗi 6 phút trong khung 06:00–22:10" },
] as const;

function formatVietnamTime(value: string | null) {
  if (!value) return "Chưa có dữ liệu";
  const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}+07:00`;
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(normalized));
}

export default async function AdminPage() {
  const stats = await getXmlCrawlerStats();
  const currentDateTime = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
  return (
    <section>
      <div className="page-heading">
        <h1>Quản trị crawler</h1>
        <p>{currentDateTime}</p>
      </div>

      <div className="admin-grid">
        {jobs.map((job) => {
          const status = stats[job.value];
          const nextRun = getNextScheduledRun(job.value).toISOString();
          return (
            <article className="admin-card" key={job.value}>
              <div className="admin-title"><h2>{job.title}</h2><span className={status.total > 0 ? "status-dot" : "status-dot waiting-dot"} /></div>
              <p>{job.note}</p>
              <CountdownButton nextRun={nextRun} running={false} />
              <div className="job-status">
                <span>Dữ liệu cập nhật gần nhất: {formatVietnamTime(status.lastUpdate)}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
