import { crawl } from "../lib/crawlers";
import { saveCrawlToXml } from "../lib/xml-store";
import type { CrawlJob } from "../lib/types";

const validJobs: CrawlJob[] = ["xsmb", "xsmn", "mega645", "power655", "keno"];
const job = process.argv[2] as CrawlJob;

if (!validJobs.includes(job)) {
  console.error(`Crawler không hợp lệ. Dùng: ${validJobs.join(", ")}`);
  process.exit(1);
}

async function run() {
  const result = await crawl(job);
  const changed = saveCrawlToXml(job, result);
  console.log(`${job}: đã lưu/cập nhật ${changed} bản ghi.`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
