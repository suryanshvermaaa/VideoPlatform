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
    const assignments = await prisma.courseAssignment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
        course: { select: { id: true, title: true } }
      }
    });
    res.json({ assignments });
  })
);

router.post(
  '/',
  validateBody(
    z.object({
      userId: z.string().min(1),
      courseId: z.string().min(1)
    })
  ),
  asyncHandler(async (req, res) => {
    const body = req.body as { userId: string; courseId: string };

    const user = await prisma.user.findUnique({ where: { id: body.userId } });
    if (!user) throw new HttpError(404, 'User not found');

    const course = await prisma.course.findUnique({ where: { id: body.courseId } });
    if (!course) throw new HttpError(404, 'Course not found');

    const assignment = await prisma.courseAssignment.create({
      data: { userId: body.userId, courseId: body.courseId },
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
        course: { select: { id: true, title: true } }
      }
    });

    res.status(201).json({ assignment });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.courseAssignment.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, 'Assignment not found');

    await prisma.courseAssignment.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

export default router;
