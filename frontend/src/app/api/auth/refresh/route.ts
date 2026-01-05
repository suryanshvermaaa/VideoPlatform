import { NextResponse } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/cookies';

function backendUrl(path: string) {
  const base = process.env.BACKEND_URL ?? 'http://localhost:4000';
  return `${base}${path}`;
}

function parseRefreshCookie(setCookieHeader: string | null) {
  if (!setCookieHeader) return null;
  const first = setCookieHeader.split(';')[0];
  const [name, ...rest] = first.split('=');
  if (name !== REFRESH_COOKIE) return null;
  return rest.join('=');
}

export async function POST(req: Request) {
  const refresh = req.headers.get('cookie')?.match(new RegExp(`${REFRESH_COOKIE}=([^;]+)`))?.[1];
  if (!refresh) return NextResponse.json({ message: 'Missing refresh token' }, { status: 401 });

  const res = await fetch(backendUrl('/auth/refresh'), {
    method: 'POST',
    headers: { cookie: `${REFRESH_COOKIE}=${refresh}` },
    cache: 'no-store'
  });

  const text = await res.text();
  const out = new NextResponse(text, { status: res.status, headers: res.headers });

  if (res.ok) {
    const parsed = JSON.parse(text) as { accessToken: string; user: unknown };
    const newRefresh = parseRefreshCookie(res.headers.get('set-cookie'));
    if (newRefresh) {
      out.cookies.set({ name: REFRESH_COOKIE, value: newRefresh, httpOnly: true, sameSite: 'lax', secure: false, path: '/' });
    }
    out.cookies.set({ name: ACCESS_COOKIE, value: parsed.accessToken, httpOnly: true, sameSite: 'lax', secure: false, path: '/' });
  }

  return out;
}
