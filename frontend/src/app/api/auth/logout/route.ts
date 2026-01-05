import { NextResponse } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/cookies';

function backendUrl(path: string) {
  const base = process.env.BACKEND_URL ?? 'http://localhost:4000';
  return `${base}${path}`;
}

export async function POST(req: Request) {
  const refresh = req.headers.get('cookie')?.match(new RegExp(`${REFRESH_COOKIE}=([^;]+)`))?.[1];
  if (refresh) {
    await fetch(backendUrl('/auth/logout'), {
      method: 'POST',
      headers: { cookie: `${REFRESH_COOKIE}=${refresh}` },
      cache: 'no-store'
    }).catch(() => null);
  }

  const out = NextResponse.json({ ok: true });
  out.cookies.set({ name: ACCESS_COOKIE, value: '', httpOnly: true, sameSite: 'lax', secure: false, path: '/', maxAge: 0 });
  out.cookies.set({ name: REFRESH_COOKIE, value: '', httpOnly: true, sameSite: 'lax', secure: false, path: '/', maxAge: 0 });
  return out;
}
