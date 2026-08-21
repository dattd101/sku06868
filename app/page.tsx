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
  tables: string[];
  selectedTable: string | null;
  columns: ColumnInfo[];
  rows: Record<string, string | number | null>[];
  totalRows: number;
  error?: string;
  detail?: string;
};

const ROW_LIMIT = 10;

export default function Home() {
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async (table?: string) => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        limit: String(ROW_LIMIT),
        offset: '0',
      });

      if (table) params.set('table', table);

      const response = await fetch(`/api/data?${params.toString()}`, {
        cache: 'no-store',
      });
      const body = (await response.json()) as ApiData;

      if (!response.ok || !body.ok) {
        throw new Error(
          [body.error, body.detail].filter(Boolean).join(' — ') ||
            'Không đọc được database.',
        );
      }

      setData(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đọc được database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return (
    <main className="app-shell">
      <section className="viewer">
        <header className="viewer-header">
          <div>
            <h1>SQLite Tables</h1>
            <p>Chọn một bảng để xem 10 dòng dữ liệu đầu tiên.</p>
          </div>

          <button
            className="refresh-button"
            type="button"
            onClick={() => void loadData(data?.selectedTable ?? undefined)}
            disabled={loading}
          >
            {loading ? 'Đang tải…' : 'Làm mới'}
          </button>
        </header>

        {error && <div className="message error-message">{error}</div>}

        {loading && !data ? (
          <div className="message loading-message">Đang tải dữ liệu…</div>
        ) : data?.tables.length ? (
          <>
            <nav className="table-tabs" aria-label="Danh sách bảng">
              {data.tables.map((table) => {
                const active = table === data.selectedTable;

                return (
                  <button
                    key={table}
                    type="button"
                    className={`table-tab${active ? ' active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                    disabled={loading}
                    onClick={() => void loadData(table)}
                  >
                    {table}
                  </button>
                );
              })}
            </nav>

            <div className="table-heading">
              <div>
                <span className="table-label">Bảng đang xem</span>
                <h2>{data.selectedTable}</h2>
              </div>
              <span className="row-count">
                Hiển thị {Math.min(data.rows.length, ROW_LIMIT)}/{data.totalRows.toLocaleString('vi-VN')} dòng
              </span>
            </div>

            <div className={`data-table-wrap${loading ? ' is-loading' : ''}`} aria-busy={loading}>
              <table className="data-table">
                <thead>
                  <tr>
                    {data.columns.map((column) => (
                      <th key={column.name}>{column.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, rowIndex) => (
                    <tr key={`${data.selectedTable}-${rowIndex}`}>
                      {data.columns.map((column) => (
                        <td key={column.name}>
                          {row[column.name] === null ? (
                            <span className="null-value">NULL</span>
                          ) : (
                            String(row[column.name] ?? '')
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {data.rows.length === 0 && (
                <div className="empty-state">Bảng này chưa có dữ liệu.</div>
              )}
            </div>
          </>
        ) : data ? (
          <div className="message">Database chưa có bảng dữ liệu.</div>
        ) : null}
      </section>
    </main>
  );
}
