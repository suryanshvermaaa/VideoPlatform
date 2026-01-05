import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../utils/errors.js';

export type AuthUser = {
  id: string;
  role: 'ADMIN' | 'USER';
  planStatus: 'ACTIVE' | 'INACTIVE';
  planActiveUntil: Date | null;
};

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new HttpError(401, 'Missing access token'));
  }

  const token = authHeader.slice('Bearer '.length);
  (async () => {
    try {
      const payload = verifyAccessToken(token);

      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, role: true, planStatus: true, planActiveUntil: true }
      });

      if (!user) return next(new HttpError(401, 'Unauthorized'));

      req.user = {
        id: user.id,
        role: user.role,
        planStatus: user.planStatus,
        planActiveUntil: user.planActiveUntil
      };
      return next();
    } catch {
      return next(new HttpError(401, 'Invalid or expired access token'));
    }
  })().catch((err) => next(err));
}

export function requireRole(...roles: Array<AuthUser['role']>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new HttpError(401, 'Unauthorized'));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, 'Forbidden'));
    return next();
  };
}
