import { NextResponse } from 'next/server';
import { z } from 'zod';
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
  const body = await req.json().catch(() => null);
  const input = z.object({ email: z.string().email(), password: z.string().min(8) }).safeParse(body);
  if (!input.success) {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
  }

  const res = await fetch(backendUrl('/auth/login'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: input.data.email, password: input.data.password }),
    cache: 'no-store'
  });

  const dataText = await res.text();
  const out = new NextResponse(dataText, { status: res.status, headers: res.headers });

  if (res.ok) {
    const parsed = JSON.parse(dataText) as { accessToken: string; user: unknown };
    const refresh = parseRefreshCookie(res.headers.get('set-cookie'));
    if (refresh) {
      out.cookies.set({ name: REFRESH_COOKIE, value: refresh, httpOnly: true, sameSite: 'lax', secure: false, path: '/' });
    }
    out.cookies.set({ name: ACCESS_COOKIE, value: parsed.accessToken, httpOnly: true, sameSite: 'lax', secure: false, path: '/' });
  }

  return out;
}
