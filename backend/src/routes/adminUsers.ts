import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../utils/errors.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, name: true, role: true, planStatus: true, planActiveUntil: true, createdAt: true }
    });
    res.json({ users });
  })
);

router.post(
  '/',
  validateBody(
    z.object({
      email: z.string().email(),
      name: z.string().min(1).optional(),
      password: z.string().min(8),
      role: z.enum(['ADMIN', 'USER']).optional(),
      planStatus: z.enum(['ACTIVE', 'INACTIVE']).optional(),
      planActiveUntil: z.coerce.date().optional().nullable()
    })
  ),
  asyncHandler(async (req, res) => {
    const body = req.body as {
      email: string;
      name?: string;
      password: string;
      role?: 'ADMIN' | 'USER';
      planStatus?: 'ACTIVE' | 'INACTIVE';
      planActiveUntil?: Date | null;
    };

    const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (existing) throw new HttpError(409, 'Email already exists');

    const passwordHash = await bcrypt.hash(body.password, 12);

    const user = await prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        name: body.name,
        passwordHash,
        role: body.role ?? 'USER',
        planStatus: body.planStatus ?? 'ACTIVE',
        planActiveUntil: body.planActiveUntil ?? null
      },
      select: { id: true, email: true, name: true, role: true, planStatus: true, planActiveUntil: true, createdAt: true }
    });

    res.status(201).json({ user });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, email: true, name: true, role: true, planStatus: true, planActiveUntil: true, createdAt: true }
    });
    if (!user) throw new HttpError(404, 'User not found');
    res.json({ user });
  })
);

router.patch(
  '/:id',
  validateBody(
    z
      .object({
        name: z.string().min(1).optional(),
        role: z.enum(['ADMIN', 'USER']).optional(),
        password: z.string().min(8).optional(),
        planStatus: z.enum(['ACTIVE', 'INACTIVE']).optional(),
        planActiveUntil: z.coerce.date().optional().nullable()
      })
      .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' })
  ),
  asyncHandler(async (req, res) => {
    const body = req.body as {
      name?: string;
      role?: 'ADMIN' | 'USER';
      password?: string;
      planStatus?: 'ACTIVE' | 'INACTIVE';
      planActiveUntil?: Date | null;
    };

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, 'User not found');

    const passwordHash = body.password ? await bcrypt.hash(body.password, 12) : undefined;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        name: body.name,
        role: body.role,
        planStatus: body.planStatus,
        ...(body.planActiveUntil !== undefined ? { planActiveUntil: body.planActiveUntil } : {}),
        ...(passwordHash ? { passwordHash } : {})
      },
      select: { id: true, email: true, name: true, role: true, planStatus: true, planActiveUntil: true, createdAt: true }
    });

    res.json({ user });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, 'User not found');

    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

export default router;
