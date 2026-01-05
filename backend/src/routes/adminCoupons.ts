import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../utils/errors.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: { course: { select: { id: true, title: true } } }
    });
    res.json({ coupons });
  })
);

router.post(
  '/',
  validateBody(
    z
      .object({
        code: z.string().min(3).max(32).regex(/^[A-Z0-9_-]+$/i),
        courseId: z.string().min(1).optional().nullable(),
        percentOff: z.coerce.number().int().min(1).max(100).optional().nullable(),
        amountOffPaise: z.coerce.number().int().min(1).optional().nullable(),
        active: z.boolean().optional(),
        expiresAt: z.coerce.date().optional().nullable(),
        maxRedemptions: z.coerce.number().int().min(1).optional().nullable()
      })
      .refine((v) => (v.percentOff ? !v.amountOffPaise : true), { message: 'Use either percentOff or amountOffPaise' })
      .refine((v) => (v.amountOffPaise ? !v.percentOff : true), { message: 'Use either percentOff or amountOffPaise' })
      .refine((v) => v.percentOff || v.amountOffPaise, { message: 'Discount missing' })
  ),
  asyncHandler(async (req, res) => {
    const body = req.body as {
      code: string;
      courseId?: string | null;
      percentOff?: number | null;
      amountOffPaise?: number | null;
      active?: boolean;
      expiresAt?: Date | null;
      maxRedemptions?: number | null;
    };

    const coupon = await prisma.coupon.create({
      data: {
        code: body.code.toUpperCase(),
        courseId: body.courseId ?? null,
        percentOff: body.percentOff ?? null,
        amountOffPaise: body.amountOffPaise ?? null,
        active: body.active ?? true,
        expiresAt: body.expiresAt ?? null,
        maxRedemptions: body.maxRedemptions ?? null
      },
      include: { course: { select: { id: true, title: true } } }
    });

    res.status(201).json({ coupon });
  })
);

router.patch(
  '/:id',
  validateBody(
    z
      .object({
        active: z.boolean().optional(),
        expiresAt: z.coerce.date().optional().nullable(),
        maxRedemptions: z.coerce.number().int().min(1).optional().nullable()
      })
      .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' })
  ),
  asyncHandler(async (req, res) => {
    const existing = await prisma.coupon.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, 'Coupon not found');

    const body = req.body as { active?: boolean; expiresAt?: Date | null; maxRedemptions?: number | null };

    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data: {
        active: body.active,
        ...(body.expiresAt !== undefined ? { expiresAt: body.expiresAt } : {}),
        ...(body.maxRedemptions !== undefined ? { maxRedemptions: body.maxRedemptions } : {})
      },
      include: { course: { select: { id: true, title: true } } }
    });

    res.json({ coupon });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.coupon.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, 'Coupon not found');

    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

export default router;
