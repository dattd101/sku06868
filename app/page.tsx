'use client';

import { useCallback, useEffect, useState } from 'react';

type ColumnInfo = {
  name: string;
  type: string;
  notNull: boolean;
  primaryKey: boolean;
};

type ApiData = {
  ok: boolean;
  databaseSizeBytes: number;
  tables: string[];
  selectedTable: string | null;
  columns: ColumnInfo[];
  rows: Record<string, string | number | null>[];
  totalRows: number;
  limit: number;
  offset: number;
  error?: string;
  detail?: string;
};

const PAGE_SIZE = 50;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function Home() {
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async (table?: string, offset = 0) => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });
      if (table) params.set('table', table);

      const response = await fetch(`/api/data?${params.toString()}`, {
        cache: 'no-store',
      });

      const body = (await response.json()) as ApiData;
      if (!response.ok || !body.ok) {
        throw new Error([body.error, body.detail].filter(Boolean).join(' — ') || 'Không đọc được database.');
      }

      setData(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đọc được database.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Tự động kết nối + đọc SQLite ngay khi mở trang.
  useEffect(() => {
    void loadData();
  }, [loadData]);

  const currentPage = data ? Math.floor(data.offset / data.limit) + 1 : 1;
  const totalPages = data ? Math.max(1, Math.ceil(data.totalRows / data.limit)) : 1;

  return (
    <main className="shell">
      <section className="card">
        <div className="hero-row">
          <div>
            <p className="eyebrow">sku06868.vercel.app</p>
            <h1>SQLite Data Viewer</h1>
            <p className="description">
              Mở trang là hệ thống tự gọi <code>/api/data</code>, Vercel ký HMAC tới WordPress,
              tải <code>crawl_lucky.db</code> và đọc bằng <code>node:sqlite</code> trên server.
            </p>
          </div>
          <button className="refresh" onClick={() => void loadData(data?.selectedTable ?? undefined, data?.offset ?? 0)} disabled={loading}>
            {loading ? 'Đang đọc…' : 'Đọc lại'}
          </button>
        </div>

        {loading && !data && <div className="status loading">Đang tự động kết nối WordPress và đọc SQLite…</div>}
        {error && <div className="status error">{error}</div>}

        {data && (
          <>
            <div className="stats">
              <div><span>Kết nối</span><strong>Thành công</strong></div>
              <div><span>Dung lượng DB</span><strong>{formatBytes(data.databaseSizeBytes)}</strong></div>
              <div><span>Số bảng</span><strong>{data.tables.length}</strong></div>
              <div><span>Bảng hiện tại</span><strong>{data.selectedTable ?? 'Không có'}</strong></div>
            </div>

            {data.tables.length > 0 ? (
              <>
                <div className="toolbar">
                  <label>
                    Bảng dữ liệu
                    <select
                      value={data.selectedTable ?? ''}
                      onChange={(event) => void loadData(event.target.value, 0)}
                      disabled={loading}
                    >
                      {data.tables.map((table) => (
                        <option key={table} value={table}>{table}</option>
                      ))}
                    </select>
                  </label>

                  <div className="table-meta">
                    {data.totalRows.toLocaleString('vi-VN')} dòng · trang {currentPage}/{totalPages}
                  </div>
                </div>

                <div className="schema">
                  {data.columns.map((column) => (
                    <span key={column.name}>
                      <b>{column.name}</b>{column.type ? ` · ${column.type}` : ''}{column.primaryKey ? ' · PK' : ''}
                    </span>
                  ))}
                </div>

                <div className="table-wrap" aria-busy={loading}>
                  <table>
                    <thead>
                      <tr>
                        {data.columns.map((column) => <th key={column.name}>{column.name}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((row, rowIndex) => (
                        <tr key={`${data.offset}-${rowIndex}`}>
                          {data.columns.map((column) => (
                            <td key={column.name}>{row[column.name] === null ? <em>NULL</em> : String(row[column.name] ?? '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {data.rows.length === 0 && <div className="empty">Bảng này chưa có dữ liệu.</div>}
                </div>

                <div className="pagination">
                  <button
                    className="secondary-btn"
                    disabled={loading || data.offset === 0}
                    onClick={() => void loadData(data.selectedTable ?? undefined, Math.max(0, data.offset - data.limit))}
                  >
                    ← Trước
                  </button>
                  <button
                    className="secondary-btn"
                    disabled={loading || data.offset + data.limit >= data.totalRows}
                    onClick={() => void loadData(data.selectedTable ?? undefined, data.offset + data.limit)}
                  >
                    Sau →
                  </button>
                  <a className="download" href="/api/db">Tải crawl_lucky.db</a>
                </div>
              </>
            ) : (
              <div className="status">Kết nối được SQLite nhưng database chưa có bảng dữ liệu.</div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
