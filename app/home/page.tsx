import { getKenoResults, getLotteryResults, getVietlottResults } from "@/lib/database";
import ResultsTabs from "./results-tabs";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const currentDateTime = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "full",
    timeStyle: "medium",
  }).format(new Date());
  const [xsmb, xsmn, mega645, power655, keno] = await Promise.all([
    getLotteryResults("xsmb", 10),
    getLotteryResults("xsmn", 10),
    getVietlottResults("mega645", 10),
    getVietlottResults("power655", 10),
    getKenoResults(10),
  ]);

  return (
    <section>
      <div className="page-heading hero">
        <p className="eyebrow">DỮ LIỆU MỚI NHẤT · {currentDateTime}</p>
        <h1>Kết quả xổ số</h1>
        <p>Dữ liệu được cập nhật liên tục theo thời gian thực.</p>
      </div>

      <ResultsTabs
        keno={keno}
        mega645={mega645}
        power655={power655}
        xsmb={xsmb}
        xsmn={xsmn}
      />
    </section>
  );
}
