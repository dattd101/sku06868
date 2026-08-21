import { writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { fetchSQLiteDatabase, UpstreamError } from '@/lib/wordpress-sqlite';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_LIMIT = 100;

type JsonValue = string | number | null;
type SQLiteRow = Record<string, unknown>;

function quoteIdentifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function normalizeValue(value: unknown): JsonValue {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return value.toString();

  if (typeof value === 'string') {
    return value.length > 2000 ? `${value.slice(0, 2000)}…` : value;
  }

  if (value instanceof Uint8Array) {
    return `[BLOB ${value.byteLength} bytes]`;
  }

  return String(value);
}

function normalizeRow(row: SQLiteRow): Record<string, JsonValue> {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, normalizeValue(value)]),
  );
}

function clampInteger(raw: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(raw ?? '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedTable = url.searchParams.get('table');
  const limit = clampInteger(url.searchParams.get('limit'), 10, 1, MAX_LIMIT);
  const offset = clampInteger(url.searchParams.get('offset'), 0, 0, Number.MAX_SAFE_INTEGER);

  let tempDir = '';
  let db: DatabaseSync | null = null;

  try {
    // Tải file SQLite từ WordPress bằng HMAC.
    const bytes = await fetchSQLiteDatabase();

    // Vercel cho phép ghi tạm vào /tmp. Dùng SQLite tích hợp sẵn trong Node.js,
    // không cần sql.js / wasm / native npm package.
    tempDir = await mkdtemp(join(tmpdir(), 'sku06868-'));
    const dbPath = join(tempDir, 'crawl_lucky.db');
    await writeFile(dbPath, bytes);

    db = new DatabaseSync(dbPath, {
      readOnly: true,
      timeout: 5000,
    });

    const tableRows = db
      .prepare(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name NOT LIKE 'sqlite_%'
        ORDER BY name COLLATE NOCASE
      `)
      .all() as SQLiteRow[];

    const tableNames = tableRows.map((row) => String(row.name));
    const selectedTable =
      requestedTable && tableNames.includes(requestedTable)
        ? requestedTable
        : tableNames[0] ?? null;

    if (!selectedTable) {
      return Response.json(
        {
          ok: true,
          databaseSizeBytes: bytes.byteLength,
          tables: [],
          selectedTable: null,
          columns: [],
          rows: [],
          totalRows: 0,
          limit,
          offset,
        },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const tableSql = quoteIdentifier(selectedTable);

    const columnRows = db
      .prepare(`PRAGMA table_info(${tableSql})`)
      .all() as SQLiteRow[];

    const columns = columnRows.map((row) => ({
      name: String(row.name),
      type: String(row.type ?? ''),
      notNull: Number(row.notnull ?? 0) === 1,
      primaryKey: Number(row.pk ?? 0) > 0,
    }));

    const countRow = db
      .prepare(`SELECT COUNT(*) AS total FROM ${tableSql}`)
      .get() as SQLiteRow | undefined;

    const totalValue = countRow?.total;
    const totalRows =
      typeof totalValue === 'bigint'
        ? Number(totalValue)
        : Number(totalValue ?? 0);

    const rawRows = db
      .prepare(`SELECT * FROM ${tableSql} LIMIT ? OFFSET ?`)
      .all(limit, offset) as SQLiteRow[];

    const rows = rawRows.map(normalizeRow);

    return Response.json(
      {
        ok: true,
        databaseSizeBytes: bytes.byteLength,
        tables: tableNames,
        selectedTable,
        columns,
        rows,
        totalRows,
        limit,
        offset,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    if (error instanceof UpstreamError) {
      return Response.json(
        { ok: false, error: error.message, detail: error.detail || undefined },
        { status: error.status },
      );
    }

    const message = error instanceof Error ? error.message : 'Unexpected server error';
    return Response.json({ ok: false, error: message }, { status: 500 });
  } finally {
    try {
      db?.close();
    } catch {
      // Ignore cleanup errors.
    }

    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}
