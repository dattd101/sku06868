import { crawl } from "../lib/crawlers";
import { checkpointDatabase, saveKeno, saveLottery, saveVietlott } from "../lib/database";
import type { CrawlJob, KenoResult, LotteryResult, VietlottResult } from "../lib/types";

const validJobs: CrawlJob[] = ["xsmb", "xsmn", "mega645", "power655", "keno"];
const job = process.argv[2] as CrawlJob;

if (!validJobs.includes(job)) {
  console.error(`Crawler không hợp lệ. Dùng: ${validJobs.join(", ")}`);
  process.exit(1);
}

async function run() {
  const result = await crawl(job);
  let changed: number;
  if (job === "xsmb" || job === "xsmn") {
    changed = await saveLottery(job, result as LotteryResult[]);
  } else if (job === "keno") {
    changed = await saveKeno(result as KenoResult[]);
  } else {
    changed = await saveVietlott(job, result as VietlottResult);
  }
  // Git chỉ commit databases.db, nên phải dồn toàn bộ WAL vào file chính trước khi push.
  await checkpointDatabase();
  console.log(`${job}: đã lưu/cập nhật ${changed} bản ghi.`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
