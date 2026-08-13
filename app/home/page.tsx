import { getKenoResults, getLotteryResults, getVietlottResults } from "@/lib/database";

export const dynamic = "force-dynamic";

const prizeLabels: Array<[string, string]> = [
  ["giai_db", "Đặc biệt"], ["giai_nhat", "Giải nhất"], ["giai_nhi", "Giải nhì"],
  ["giai_ba", "Giải ba"], ["giai_tu", "Giải tư"], ["giai_nam", "Giải năm"],
  ["giai_sau", "Giải sáu"], ["giai_bay", "Giải bảy"], ["giai_tam", "Giải tám"],
];

function splitNumbers(value: string) {
  return value ? value.split(",").map((number) => number.trim()).filter(Boolean) : [];
}

export default function HomePage() {
  const currentDateTime = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "full",
    timeStyle: "medium",
  }).format(new Date());
  const xsmb = getLotteryResults("xsmb", 10);
  const xsmn = getLotteryResults("xsmn", 20);
  const mega = getVietlottResults("mega645", 10);
  const power = getVietlottResults("power655", 10);
  const keno = getKenoResults(20);
  const empty = xsmb.length + xsmn.length + mega.length + power.length + keno.length === 0;

  return (
    <section>
      <div className="page-heading hero">
        <p className="eyebrow">DỮ LIỆU MỚI NHẤT · {currentDateTime}</p>
        <h1>Kết quả xổ số</h1>
        <p>Dữ liệu được cập nhật liên tục theo thời gian thực.</p>
      </div>

      {empty && <div className="empty">Chưa có dữ liệu. Hãy vào trang Quản trị crawl để chạy lần đầu.</div>}

      {keno.length > 0 && (
        <div className="section-block">
          <h2>Keno</h2>
          <div className="keno-list">
            {keno.map((row) => (
              <article className="keno-row" key={row.id}>
                <div className="keno-meta">
                  <strong>Kỳ #{row.draw_no}</strong>
                  <small>{row.draw_date}{row.draw_time && ` · ${row.draw_time}`}</small>
                </div>
                <div className="keno-balls">
                  {splitNumbers(row.numbers).map((number, index) => <span key={`${row.id}-${index}`}>{number}</span>)}
                </div>
                <div className="keno-stats">
                  <span>Chẵn <b>{row.so_chan}</b></span>
                  <span>Lẻ <b>{row.so_le}</b></span>
                  <span>Lớn <b>{row.so_lon}</b></span>
                  <span>Nhỏ <b>{row.so_nho}</b></span>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {(mega.length > 0 || power.length > 0) && (
        <div className="section-block">
          <h2>Vietlott</h2>
          <div className="vietlott-grid">
            {[["Mega 6/45", mega], ["Power 6/55", power]].map(([name, rows]) => (
              <div className="result-list" key={name as string}>
                <h3>{name as string}</h3>
                {(rows as typeof mega).map((row) => (
                  <article className="vietlott-row" key={row.id}>
                    <div><strong>Kỳ #{row.so_ky_quay}</strong><small>{row.thoi_gian}</small></div>
                    <div className="balls">{splitNumbers(row.so_trung).map((number, index) => <span className={index === 6 ? "power" : ""} key={`${row.id}-${index}`}>{number}</span>)}</div>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {[["Xổ số miền Bắc", xsmb], ["Xổ số miền Nam", xsmn]].map(([name, rows]) => (
        (rows as typeof xsmb).length > 0 && <div className="section-block" key={name as string}>
          <h2>{name as string}</h2>
          <div className="lottery-grid">
            {(rows as typeof xsmb).map((row) => (
              <article className="lottery-card" key={row.id}>
                <header><div><h3>{row.tinh}</h3><span>{row.ngay_quay}</span></div><small>Lưu lúc {row.created_vn}</small></header>
                <div className="prizes">
                  {prizeLabels.map(([field, label]) => {
                    const value = row[field as keyof typeof row];
                    if (typeof value !== "string" || !value) return null;
                    return <div className={field === "giai_db" ? "prize jackpot" : "prize"} key={field}><span>{label}</span><strong>{value}</strong></div>;
                  })}
                </div>
              </article>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
