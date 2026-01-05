import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/cookies';

function backendUrl(path: string) {
  const base = process.env.BACKEND_URL ?? 'http://localhost:4000';
  return `${base}${path}`;
}

function parseCookieValue(setCookieHeader: string | null, cookieName: string) {
  if (!setCookieHeader) return null;
  // Might contain multiple Set-Cookie headers joined by comma. Our backend only sets one.
  const parts = setCookieHeader.split(/,(?=[^;]+=[^;]+)/g);
  for (const part of parts) {
    const first = part.trim().split(';')[0];
    const [name, ...rest] = first.split('=');
    if (name === cookieName) return rest.join('=');
  }
  return null;
}

async function refreshTokens(refreshToken: string) {
  const res = await fetch(backendUrl('/auth/refresh'), {
    method: 'POST',
    headers: {
      cookie: `${REFRESH_COOKIE}=${refreshToken}`
    },
    cache: 'no-store'
  });

  if (!res.ok) return null;

  const data = (await res.json()) as { accessToken: string; user: unknown };
  const setCookie = res.headers.get('set-cookie');
  const newRefresh = parseCookieValue(setCookie, REFRESH_COOKIE) ?? refreshToken;

  return { accessToken: data.accessToken, refreshToken: newRefresh };
}

export async function proxyToBackend(req: Request, path: string, init?: RequestInit) {
  const cookieStore = await cookies();
  const access = cookieStore.get(ACCESS_COOKIE)?.value;
  const refresh = cookieStore.get(REFRESH_COOKIE)?.value;

  const method = (init?.method ?? req.method).toUpperCase();

  // Forward incoming headers by default (e.g. content-type), allow init to override.
  const headers = new Headers(req.headers);
  for (const [k, v] of new Headers(init?.headers).entries()) {
    headers.set(k, v);
  }

  // Buffer the body once so we can retry after token refresh.
  let forwardBody: BodyInit | undefined = init?.body as any;
  if (forwardBody === undefined && method !== 'GET' && method !== 'HEAD') {
    const buf = await req.arrayBuffer();
    if (buf.byteLength > 0) forwardBody = buf;
  }
  if (access) headers.set('authorization', `Bearer ${access}`);
  if (refresh) headers.set('cookie', `${REFRESH_COOKIE}=${refresh}`);

  // These headers should not be forwarded as-is.
  headers.delete('host');
  headers.delete('content-length');

  const doFetch = (token?: string) => {
    const h = new Headers(headers);
    if (token) h.set('authorization', `Bearer ${token}`);
    return fetch(backendUrl(path), {
      method,
      headers: h,
      body: forwardBody,
      cache: 'no-store'
    });
  };

  let backendRes = await doFetch();

  // Auto-refresh once for authenticated routes
  if (backendRes.status === 401 && refresh) {
    const rotated = await refreshTokens(refresh);
    if (rotated) {
      backendRes = await doFetch(rotated.accessToken);
      const body = await backendRes.text();
      const out = new NextResponse(body, {
        status: backendRes.status,
        headers: backendRes.headers
      });
      out.cookies.set({ name: ACCESS_COOKIE, value: rotated.accessToken, httpOnly: true, sameSite: 'lax', secure: false, path: '/' });
      out.cookies.set({ name: REFRESH_COOKIE, value: rotated.refreshToken, httpOnly: true, sameSite: 'lax', secure: false, path: '/' });
      return out;
    }
  }

  const body = await backendRes.text();
  return new NextResponse(body, {
    status: backendRes.status,
    headers: backendRes.headers
  });
}
