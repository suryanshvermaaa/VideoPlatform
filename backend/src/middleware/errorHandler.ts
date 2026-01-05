import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../utils/errors.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: unknown) {
  if (err instanceof ZodError) {
    return res.status(400).json({ message: 'Validation error', issues: err.issues });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, code: err.code });
  }

  console.error(err);
  return res.status(500).json({ message: 'Internal server error' });
}
