import crypto from 'node:crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const AUDIENCE = 'https://sku06868.vercel.app';
const SIGNED_ROUTE = '/local-sqlite/v1/db';

function createSignature(secret: string, timestamp: string, nonce: string) {
  const message = ['GET', SIGNED_ROUTE, timestamp, nonce, AUDIENCE].join('\n');

  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

export async function GET(request: Request) {
  const origin = request.headers.get('origin');

  // Lớp kiểm tra phụ. HMAC server-to-server mới là xác thực chính tới WordPress.
  if (origin && origin !== AUDIENCE && !origin.startsWith('http://localhost:')) {
    return Response.json({ error: 'Origin not allowed' }, { status: 403 });
  }

  const secret = process.env.SQLITE_HMAC_SECRET;
  const endpoint = process.env.WORDPRESS_DB_ENDPOINT;

  if (!secret || !endpoint) {
    return Response.json(
      { error: 'Missing SQLITE_HMAC_SECRET or WORDPRESS_DB_ENDPOINT' },
      { status: 500 },
    );
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const signature = createSignature(secret, timestamp, nonce);

  try {
    const upstream = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'X-LSDB-Timestamp': timestamp,
        'X-LSDB-Nonce': nonce,
        'X-LSDB-Audience': AUDIENCE,
        'X-LSDB-Signature': signature,
      },
      cache: 'no-store',
    });

    if (!upstream.ok) {
      const detail = (await upstream.text()).slice(0, 500);
      return Response.json(
        { error: 'WordPress SQLite API failed', detail },
        { status: upstream.status },
      );
    }

    return new Response(await upstream.arrayBuffer(), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.sqlite3',
        'Content-Disposition': 'attachment; filename="crawl_lucky.db"',
        'Cache-Control': 'private, no-store, max-age=0',
      },
    });
  } catch {
    return Response.json(
      { error: 'Cannot reach WordPress SQLite API' },
      { status: 502 },
    );
  }
}
