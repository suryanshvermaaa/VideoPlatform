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
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, description: true, thumbnailKey: true, priceInrPaise: true, createdAt: true }
    });
    res.json({ courses });
  })
);

router.post(
  '/',
  validateBody(
    z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      thumbnailKey: z.string().min(1).optional(),
      priceInrPaise: z.coerce.number().int().min(0).optional()
    })
  ),
  asyncHandler(async (req, res) => {
    const body = req.body as { title: string; description: string; thumbnailKey?: string; priceInrPaise?: number };

    const course = await prisma.course.create({
      data: {
        title: body.title,
        description: body.description,
        thumbnailKey: body.thumbnailKey,
        priceInrPaise: body.priceInrPaise ?? 0
      },
      select: { id: true, title: true, description: true, thumbnailKey: true, priceInrPaise: true, createdAt: true }
    });

    res.status(201).json({ course });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: {
        lectures: { orderBy: { orderIndex: 'asc' }, select: { id: true, title: true, description: true, orderIndex: true } }
      }
    });

    if (!course) throw new HttpError(404, 'Course not found');
    res.json({ course });
  })
);

router.patch(
  '/:id',
  validateBody(
    z
      .object({
        title: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        thumbnailKey: z.string().min(1).nullable().optional(),
        priceInrPaise: z.coerce.number().int().min(0).optional()
      })
      .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' })
  ),
  asyncHandler(async (req, res) => {
    const existing = await prisma.course.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, 'Course not found');

    const body = req.body as { title?: string; description?: string; thumbnailKey?: string | null; priceInrPaise?: number };

    const course = await prisma.course.update({
      where: { id: req.params.id },
      data: {
        title: body.title,
        description: body.description,
        thumbnailKey: body.thumbnailKey === undefined ? undefined : body.thumbnailKey,
        priceInrPaise: body.priceInrPaise
      },
      select: { id: true, title: true, description: true, thumbnailKey: true, priceInrPaise: true, createdAt: true }
    });

    res.json({ course });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.course.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, 'Course not found');

    await prisma.course.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

export default router;
