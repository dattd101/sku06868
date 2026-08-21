# sku06868 Next.js 15 SQLite Bridge

Project tối giản cho kiến trúc trong file đính kèm:

Browser -> `https://sku06868.vercel.app/api/db` -> HMAC -> WordPress REST API -> `crawl_lucky.db`

## 1. Yêu cầu

- Next.js 15.5.23
- Node.js 24.x trên Vercel
- Local Node.js >= 20.9

## 2. Chạy local

```bash
npm install
cp .env.example .env.local
```

Sửa `.env.local`:

```env
SQLITE_HMAC_SECRET=secret_cua_ban
WORDPRESS_DB_ENDPOINT=https://YOUR-WP-DOMAIN/wp-json/local-sqlite/v1/db
```

Sau đó:

```bash
npm run dev
```

Mở http://localhost:3000.

## 3. Push GitHub

```bash
git init
git add .
git commit -m "Next.js 15 SQLite bridge"
git branch -M main
git remote add origin https://github.com/YOUR-USER/YOUR-REPO.git
git push -u origin main
```

## 4. Vercel

Import repo GitHub vào Vercel, rồi thêm Environment Variables:

- `SQLITE_HMAC_SECRET`
- `WORDPRESS_DB_ENDPOINT`

Redeploy project. Domain production dùng trong HMAC là:

`https://sku06868.vercel.app`

## Lưu ý bảo mật

Không commit `.env.local` hoặc secret lên GitHub.

HMAC xác thực Vercel với WordPress. Route `/api/db` của Vercel vẫn là URL public nếu bạn không thêm đăng nhập/auth riêng. Nếu database có dữ liệu nhạy cảm, cần bảo vệ route này thêm.
