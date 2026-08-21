import { AUDIENCE, fetchSQLiteDatabase, UpstreamError } from '@/lib/wordpress-sqlite';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const origin = request.headers.get('origin');

  // Chỉ là lớp phụ. HMAC server-to-server mới là xác thực chính tới WordPress.
  if (origin && origin !== AUDIENCE && !origin.startsWith('http://localhost:')) {
    return Response.json({ error: 'Origin not allowed' }, { status: 403 });
  }

  try {
    const db = await fetchSQLiteDatabase();

    return new Response(Buffer.from(db), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.sqlite3',
        'Content-Disposition': 'attachment; filename="crawl_lucky.db"',
        'Cache-Control': 'private, no-store, max-age=0',
      },
    });
  } catch (error) {
    if (error instanceof UpstreamError) {
      return Response.json(
        { error: error.message, detail: error.detail || undefined },
        { status: error.status },
      );
    }

    return Response.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
