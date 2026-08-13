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

Scheduler chạy cùng tiến trình Next.js và tự khởi động lại khi server khởi động. Vì vậy cần chạy ứng dụng bằng một tiến trình Node.js lâu dài (VPS, PM2 hoặc Docker), không phù hợp với serverless có thể tắt tiến trình sau request.

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
