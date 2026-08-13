# Next.js 15 crawler + SQLite trên GitHub

Ứng dụng crawl XSMB, XSMN, Mega 6/45, Power 6/55 và Keno.

- `/home`: hiển thị dữ liệu xổ số.
- `/admin`: theo dõi lịch crawler.
- `/api`: REST API public, chỉ đọc.
- `databases.db`: SQLite được lưu trực tiếp trong GitHub repository.

## Chạy local

```bash
npm install
npm run dev
```

Chạy crawler thủ công từ terminal:

```bash
npm run crawl -- xsmb
npm run crawl -- xsmn
npm run crawl -- mega645
npm run crawl -- power655
npm run crawl -- keno
```

## GitHub Actions và Vercel

Workflow `.github/workflows/crawler.yml` thực hiện:

1. Checkout repository.
2. Chạy crawler theo lịch.
3. Ghi và checkpoint dữ liệu vào `databases.db`.
4. Commit rồi push file SQLite về repository nếu dữ liệu thay đổi.
5. Vercel tự redeploy commit mới và đọc snapshot `databases.db` ở chế độ chỉ đọc.

Trong GitHub repository, vào **Settings → Actions → General → Workflow permissions** và chọn **Read and write permissions** để workflow được push `databases.db`.

Không cần cấu hình `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `CRON_SECRET` hay database trên Vercel.

Chế độ development dùng `.next-dev`, production dùng `.next` để hai cache không ghi đè nhau.

## REST API

```text
GET /api
GET /api/results?limit=20&offset=0
GET /api/results/xsmb?limit=20&offset=0
GET /api/results/xsmn?limit=20&offset=0
GET /api/results/mega645?limit=20&offset=0
GET /api/results/power655?limit=20&offset=0
GET /api/results/keno?limit=20&offset=0
```

API trả JSON, bật CORS `*` và giới hạn tối đa 100 bản ghi cho mỗi nguồn trong một request.

## Lưu ý

GitHub không phải database server. Mỗi lần crawler có dữ liệu mới sẽ tạo commit mới; Keno chạy mỗi 6 phút có thể tạo nhiều commit và Vercel deployment. Đây là đánh đổi khi chọn lưu SQLite trực tiếp trong GitHub thay vì dùng database bên ngoài.
