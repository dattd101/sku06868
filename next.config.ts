import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Không dùng chung output giữa `next dev` và `next build`.
  // Nếu hai lệnh ghi vào cùng `.next`, webpack runtime có thể tham chiếu
  // tới chunk đã bị lệnh còn lại thay thế (Cannot find module './xxx.js').
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  outputFileTracingIncludes: {
    "/**": ["./databases.db"],
  },
};

export default nextConfig;
