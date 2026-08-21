'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

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

const HIDDEN_COLUMNS = new Set(['id', 'created_at', 'created_vn']);

const COLUMN_LABELS: Record<string, string> = {
  drawdate: 'Thời gian',
  drawno: 'Kỳ quay',
  numbers: 'Số kỳ quay',
  so_chan: 'Số chẵn',
  so_le: 'Số lẻ',
  so_lon: 'Số lớn',
  so_nho: 'Số nhỏ',
  thoi_gian: 'Thời gian',
  so_ky_quay: 'Số kỳ quay',
  so_trung: 'Số trúng',
  ngay_quay: 'Ngày quay',
  tinh: 'Tỉnh',
  giai_db: 'Giải đặc biệt',
  giai_nhat: 'Giải nhất',
  giai_nhi: 'Giải nhì',
  giai_ba: 'Giải ba',
  giai_tu: 'Giải tư',
  giai_nam: 'Giải năm',
  giai_sau: 'Giải sáu',
  giai_bay: 'Giải bảy',
};

const TABLE_LABELS: Record<string, string> = {
  db_keno: 'KQ Keno',
  db_power655: 'KQ Power 6/55',
  db_power_655: 'KQ Power 6/55',
  db_power_6_55: 'KQ Power 6/55',
  db_mega645: 'KQ Mega 6/45',
  db_mega_645: 'KQ Mega 6/45',
  db_mega_6_45: 'KQ Mega 6/45',
  db_max3d: 'KQ Max 3D',
  db_max_3d: 'KQ Max 3D',
  db_max3dpro: 'KQ Max 3D Pro',
  db_max_3d_pro: 'KQ Max 3D Pro',
  db_xsmb: 'KQ Xổ số miền Bắc',
  db_xsmt: 'KQ Xổ số miền Trung',
  db_xsmn: 'KQ Xổ số miền Nam',
  db_dientoan123: 'KQ Điện toán 123',
  db_dien_toan_123: 'KQ Điện toán 123',
  db_thantai: 'KQ Thần Tài',
  db_than_tai: 'KQ Thần Tài',
  db_bingo18: 'KQ Bingo18',
  db_bingo_18: 'KQ Bingo18',
};

function titleCase(value: string) {
  return value
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => {
      if (/^\d+$/.test(part)) return part;
      if (part.toLowerCase() === 'xs') return 'XS';
      return `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`;
    })
    .join(' ');
}

function getTableLabel(table: string) {
  const normalized = table.toLowerCase();
  if (TABLE_LABELS[normalized]) return TABLE_LABELS[normalized];

  if (/^db_/i.test(table)) {
    return `KQ ${titleCase(table.replace(/^db_/i, ''))}`;
  }

  return titleCase(table);
}

function getColumnLabel(column: string) {
  const normalized = column.toLowerCase();
  return COLUMN_LABELS[normalized] ?? titleCase(column);
}

function formatCurrentTime(date: Date) {
  const value = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(date);

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function Home() {
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState('');

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

  useEffect(() => {
    const updateTime = () => setCurrentTime(formatCurrentTime(new Date()));
    updateTime();
    const timer = window.setInterval(updateTime, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const visibleColumns = useMemo(
    () =>
      (data?.columns ?? []).filter(
        (column) => !HIDDEN_COLUMNS.has(column.name.toLowerCase()),
      ),
    [data?.columns],
  );

  return (
    <main className="app-shell">
      <section className="viewer">
        <header className="viewer-header">
          <div className="viewer-title">
            <h1>Kết quả xổ số</h1>
            <p className="current-time" aria-live="polite">
              {currentTime || 'Đang cập nhật thời gian…'}
            </p>
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
            <nav className="table-tabs" aria-label="Danh sách kết quả xổ số">
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
                    {getTableLabel(table)}
                  </button>
                );
              })}
            </nav>

            <div className="table-heading">
              <div>
                <span className="table-label">Kết quả đang xem</span>
                <h2>{data.selectedTable ? getTableLabel(data.selectedTable) : ''}</h2>
              </div>
              <span className="row-count">
                {data.rows.length} kỳ mới nhất · {data.totalRows.toLocaleString('vi-VN')} bản ghi
              </span>
            </div>

            <div
              className={`data-table-wrap${loading ? ' is-loading' : ''}`}
              aria-busy={loading}
            >
              <table className="data-table">
                <thead>
                  <tr>
                    {visibleColumns.map((column) => (
                      <th key={column.name}>{getColumnLabel(column.name)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, rowIndex) => {
                    const rowId = row.id ?? row.ID ?? rowIndex;

                    return (
                      <tr key={`${data.selectedTable}-${String(rowId)}-${rowIndex}`}>
                        {visibleColumns.map((column) => {
                          const label = getColumnLabel(column.name);

                          return (
                            <td key={column.name} data-label={label}>
                              {row[column.name] === null ? (
                                <span className="null-value">NULL</span>
                              ) : (
                                String(row[column.name] ?? '')
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
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
