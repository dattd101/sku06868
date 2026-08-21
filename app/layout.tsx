import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SQLite Bridge',
  description: 'Next.js 15 bridge to WordPress SQLite API',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
