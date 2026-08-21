import crypto from 'node:crypto';

export const AUDIENCE = 'https://sku06868.vercel.app';
const SIGNED_ROUTE = '/local-sqlite/v1/db';

export class UpstreamError extends Error {
  status: number;
  detail: string;

  constructor(message: string, status: number, detail = '') {
    super(message);
    this.name = 'UpstreamError';
    this.status = status;
    this.detail = detail;
  }
}

function createSignature(secret: string, timestamp: string, nonce: string) {
  const message = ['GET', SIGNED_ROUTE, timestamp, nonce, AUDIENCE].join('\n');
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

export async function fetchSQLiteDatabase(): Promise<Uint8Array> {
  const secret = process.env.SQLITE_HMAC_SECRET;
  const endpoint = process.env.WORDPRESS_DB_ENDPOINT;

  if (!secret || !endpoint) {
    throw new UpstreamError(
      'Missing SQLITE_HMAC_SECRET or WORDPRESS_DB_ENDPOINT',
      500,
    );
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const signature = createSignature(secret, timestamp, nonce);

  let upstream: Response;

  try {
    upstream = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'X-LSDB-Timestamp': timestamp,
        'X-LSDB-Nonce': nonce,
        'X-LSDB-Audience': AUDIENCE,
        'X-LSDB-Signature': signature,
      },
      cache: 'no-store',
    });
  } catch {
    throw new UpstreamError('Cannot reach WordPress SQLite API', 502);
  }

  if (!upstream.ok) {
    const detail = (await upstream.text()).slice(0, 500);
    throw new UpstreamError('WordPress SQLite API failed', upstream.status, detail);
  }

  return new Uint8Array(await upstream.arrayBuffer());
}
