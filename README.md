# sku06868 — Next.js 15 + WordPress SQLite reader

Bản này tự đọc dữ liệu ngay khi mở trang.

Luồng:

```text
Browser -> /api/data -> Next.js/Vercel -> HMAC -> WordPress -> crawl_lucky.db
                                      -> node:sqlite -> JSON -> bảng dữ liệu
```

## Vì sao bản này không còn lỗi `sql.js/dist/sql-asm.js`

Bản cũ dùng package `sql.js`. Bản này bỏ hoàn toàn `sql.js` và dùng module SQLite tích hợp sẵn trong Node.js (`node:sqlite`). File DB tải từ WordPress được ghi tạm vào thư mục `/tmp`, mở ở chế độ read-only, đọc xong rồi xóa ngay.

Không cần WASM và không cần cài package SQLite riêng.

## Yêu cầu

- Node.js 24.x cho local/production để khớp Vercel.
- Next.js 15.

## Cài đặt sạch

```bash
rm -rf node_modules .next package-lock.json
npm install
cp .env.example .env.local
npm run dev
```

Nếu đã có `.env.local`, không cần ghi đè file đó.

## Environment Variables

```env
SQLITE_HMAC_SECRET=YOUR_SECRET
WORDPRESS_DB_ENDPOINT=https://YOUR-WORDPRESS-DOMAIN/wp-json/local-sqlite/v1/db
```

Trên Vercel thêm hai biến trên trong Project -> Settings -> Environment Variables rồi Redeploy.

## API

Tự chọn table đầu tiên:

```text
GET /api/data
```

Chọn table và phân trang:

```text
GET /api/data?table=products&limit=50&offset=0
```

Tải file gốc:

```text
GET /api/db
```

## Production domain

```text
https://sku06868.vercel.app/
```
