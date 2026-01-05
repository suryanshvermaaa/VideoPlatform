import type { CookieOptions, Response } from 'express';
import { env, isProd } from '../config/env.js';

export const REFRESH_COOKIE_NAME = 'vp_refresh';

export function getRefreshCookieOptions(): CookieOptions {
  const secure = env.COOKIE_SECURE || isProd;
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    path: '/auth',
    domain: env.COOKIE_DOMAIN || undefined
  };
}

export function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...getRefreshCookieOptions(),
    maxAge: env.REFRESH_TOKEN_TTL_SECONDS * 1000
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...getRefreshCookieOptions(),
    maxAge: 0
  });
}
