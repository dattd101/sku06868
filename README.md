# Next.js 15 crawler + SQLite

Ứng dụng chuyển đổi 5 crawler trong `debugs/` sang Next.js/TypeScript, gồm XSMB, XSMN, Mega 6/45, Power 6/55 và Keno:

- `/admin`: theo dõi scheduler tự động và thời gian đếm ngược tới lần crawl tiếp theo.
- `/home`: đọc SQLite và hiển thị các kết quả đã lưu.
- `/api`: tài liệu và danh sách link REST API public.

## Chạy dự án

```bash
npm install
npm run dev
```

Chế độ development dùng cache `.next-dev`, còn production build dùng `.next`. Hai thư mục được tách riêng để tránh lỗi thiếu webpack chunk khi chạy `npm run build` trong lúc dev server đang mở.

Mở `http://localhost:3000/admin` để theo dõi trạng thái và thời gian crawl tiếp theo. File `databases.db` được tự tạo tại thư mục gốc dự án; crawler tự chạy lần đầu khi server khởi động.

Khi chạy local/VPS, scheduler chạy cùng tiến trình Next.js. Khi chạy trên Vercel, GitHub Actions tại `.github/workflows/crawler.yml` gọi các API cron theo lịch vì Vercel Functions không giữ vòng lặp nền.

## Triển khai Vercel

1. Tạo database Turso/libSQL và thêm vào Vercel Environment Variables:

```text
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
CRON_SECRET=mot-chuoi-bi-mat
```

2. Trong GitHub repository, tạo Actions variable:

```text
VERCEL_APP_URL=https://ten-du-an.vercel.app
```

3. Tạo GitHub Actions secret `CRON_SECRET` với cùng giá trị đã đặt trên Vercel.

Nếu chưa có biến Turso, ứng dụng trên Vercel vẫn mở bằng database `/tmp`, nhưng dữ liệu có thể mất sau mỗi lần Function được tạo lại. Không dùng chế độ `/tmp` cho production.

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

API chỉ đọc, trả JSON, bật CORS `*` và giới hạn tối đa 100 bản ghi cho mỗi nguồn trong một request.

## Lưu ý triển khai

`better-sqlite3` cần môi trường Node.js có ổ đĩa ghi lâu dài. Không nên triển khai kiểu serverless có filesystem tạm; hãy dùng VPS, Docker có volume hoặc máy chủ Node.js thông thường.
