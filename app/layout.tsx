import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kết quả xổ số",
  description: "Next.js 15 crawler lưu dữ liệu bằng SQLite",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body suppressHydrationWarning>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
