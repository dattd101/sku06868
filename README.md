# Next.js 15 crawler + XML trên GitHub

Ứng dụng crawl XSMB, XSMN, Mega 6/45, Power 6/55 và Keno.

- `/home`: hiển thị dữ liệu từ `data/results.xml`.
- `/admin`: theo dõi lịch và thời gian dữ liệu được cập nhật.
- `/api`: REST API public, chỉ đọc.
- GitHub lưu dữ liệu trong file `data/results.xml`.
- Vercel chỉ đọc XML để render giao diện và API.

## Chạy local

```bash
npm install
npm run dev
```

Chạy crawler thủ công:

```bash
npm run crawl -- xsmb
npm run crawl -- xsmn
npm run crawl -- mega645
npm run crawl -- power655
npm run crawl -- keno
```

## GitHub Actions và Vercel

Workflow `.github/workflows/crawler.yml` sẽ:

1. Chạy crawler theo lịch.
2. Upsert kết quả vào `data/results.xml`.
3. Commit và push XML về GitHub nếu có dữ liệu mới.
4. Vercel tự deploy commit mới và đọc XML ở chế độ chỉ đọc.

Trong GitHub repository, bật quyền push cho workflow tại:

```text
Settings → Actions → General → Workflow permissions
→ Read and write permissions → Save
```

Không cần database hoặc biến môi trường trên Vercel.

## REST API

```text
GET /api
GET /api/results/xsmb?limit=20&offset=0
GET /api/results/xsmn?limit=20&offset=0
GET /api/results/mega645?limit=20&offset=0
GET /api/results/power655?limit=20&offset=0
GET /api/results/keno?limit=20&offset=0
```

Lưu ý: mỗi lần XML thay đổi sẽ tạo một commit GitHub và có thể kích hoạt một deployment Vercel mới.
