'use client';

import { useState } from 'react';

type State =
  | { type: 'idle'; message: string }
  | { type: 'loading'; message: string }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string };

export default function Home() {
  const [state, setState] = useState<State>({
    type: 'idle',
    message: 'Chưa kiểm tra kết nối.',
  });

  async function testConnection() {
    setState({ type: 'loading', message: 'Đang kết nối WordPress và tải SQLite...' });

    try {
      const response = await fetch('/api/db', { cache: 'no-store' });

      if (!response.ok) {
        const contentType = response.headers.get('content-type') || '';
        const detail = contentType.includes('application/json')
          ? JSON.stringify(await response.json())
          : await response.text();

        throw new Error(`${response.status} ${detail}`);
      }

      const blob = await response.blob();
      const sizeMb = (blob.size / 1024 / 1024).toFixed(2);

      setState({
        type: 'success',
        message: `Kết nối thành công. Nhận được crawl_lucky.db (${sizeMb} MB).`,
      });
    } catch (error) {
      setState({
        type: 'error',
        message: error instanceof Error ? error.message : 'Kết nối thất bại.',
      });
    }
  }

  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">sku06868.vercel.app</p>
        <h1>Next.js 15 → WordPress → SQLite</h1>
        <p className="description">
          Frontend chỉ gọi <code>/api/db</code>. Secret HMAC nằm ở Vercel Environment Variables,
          không nằm trong browser hoặc GitHub.
        </p>

        <div className={`status ${state.type}`}>{state.message}</div>

        <div className="actions">
          <button onClick={testConnection} disabled={state.type === 'loading'}>
            {state.type === 'loading' ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
          </button>
          <a className="secondary" href="/api/db">
            Tải crawl_lucky.db
          </a>
        </div>

        <div className="note">
          Cần 2 biến môi trường trên Vercel: <code>SQLITE_HMAC_SECRET</code> và{' '}
          <code>WORDPRESS_DB_ENDPOINT</code>.
        </div>
      </section>
    </main>
  );
}
