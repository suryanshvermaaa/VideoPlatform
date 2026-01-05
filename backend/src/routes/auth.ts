import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { clearRefreshCookie, REFRESH_COOKIE_NAME, setRefreshCookie } from '../utils/cookies.js';
import { HttpError } from '../utils/errors.js';
import { loginWithEmailPassword, registerWithEmailPassword, revokeRefreshToken, rotateRefreshToken } from '../services/authService.js';

const router = Router();

router.post(
  '/login',
  validateBody(
    z.object({
      email: z.string().email(),
      password: z.string().min(8)
    })
  ),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    const result = await loginWithEmailPassword(email.toLowerCase(), password);
    setRefreshCookie(res, result.refreshToken);
    res.json({ accessToken: result.accessToken, user: result.user });
  })
);

router.post(
  '/signup',
  validateBody(
    z.object({
      name: z.string().min(1).optional(),
      email: z.string().email(),
      password: z.string().min(8)
    })
  ),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body as { name?: string; email: string; password: string };
    const result = await registerWithEmailPassword(email, password, name);
    setRefreshCookie(res, result.refreshToken);
    res.status(201).json({ accessToken: result.accessToken, user: result.user });
  })
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const current = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!current) throw new HttpError(401, 'Missing refresh token');

    const result = await rotateRefreshToken(String(current));
    setRefreshCookie(res, result.refreshToken);
    res.json({ accessToken: result.accessToken, user: result.user });
  })
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (token) {
      await revokeRefreshToken(String(token));
    }
    clearRefreshCookie(res);
    res.json({ ok: true });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, planStatus: true, planActiveUntil: true }
    });
    if (!user) throw new HttpError(401, 'Unauthorized');
    res.json({ user });
  })
);

export default router;
