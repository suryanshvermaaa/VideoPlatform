import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/errors.js';

export function requireActivePlan(req: Request, _res: Response, next: NextFunction) {
  const user = req.user;
  if (!user) return next(new HttpError(401, 'Unauthorized'));

  // Admin access is never blocked by plan status.
  if (user.role === 'ADMIN') return next();

  if (user.planStatus !== 'ACTIVE') {
    return next(new HttpError(403, 'Plan inactive', 'PLAN_INACTIVE'));
  }

  if (user.planActiveUntil && user.planActiveUntil.getTime() < Date.now()) {
    return next(new HttpError(403, 'Plan expired', 'PLAN_EXPIRED'));
  }

  return next();
}
