import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../utils/errors.js';

const router = Router();

router.get(
  '/lectures/:lectureId',
  asyncHandler(async (req, res) => {
    const lecture = await prisma.lecture.findUnique({
      where: { id: req.params.lectureId },
      select: {
        id: true,
        courseId: true,
        title: true,
        description: true,
        notesMd: true,
        notesAttachmentId: true,
        orderIndex: true,
        videoKey: true,
        storageProviderId: true,
        notesAttachment: { select: { id: true, title: true, mimeType: true, sizeBytes: true, createdAt: true } }
      }
    });

    if (!lecture) throw new HttpError(404, 'Lecture not found');
    res.json({ lecture });
  })
);

// Create lecture for a course
router.post(
  '/courses/:courseId/lectures',
  validateBody(
    z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      orderIndex: z.coerce.number().int().nonnegative(),
      videoKey: z.string().min(1),
      storageProviderId: z.string().min(1).optional().nullable()
    })
  ),
  asyncHandler(async (req, res) => {
    const course = await prisma.course.findUnique({ where: { id: req.params.courseId } });
    if (!course) throw new HttpError(404, 'Course not found');

    const body = req.body as { title: string; description: string; orderIndex: number; videoKey: string; storageProviderId?: string | null };

    const lecture = await prisma.lecture.create({
      data: {
        courseId: req.params.courseId,
        title: body.title,
        description: body.description,
        orderIndex: body.orderIndex,
        videoKey: body.videoKey,
        storageProviderId: body.storageProviderId ?? null
      },
      select: { id: true, courseId: true, title: true, description: true, orderIndex: true }
    });

    res.status(201).json({ lecture });
  })
);

router.patch(
  '/lectures/:lectureId',
  validateBody(
    z
      .object({
        title: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        notesMd: z.string().optional().nullable(),
        notesAttachmentId: z.string().min(1).optional().nullable(),
        orderIndex: z.coerce.number().int().nonnegative().optional(),
        videoKey: z.string().min(1).optional(),
        storageProviderId: z.string().min(1).optional().nullable()
      })
      .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' })
  ),
  asyncHandler(async (req, res) => {
    const existing = await prisma.lecture.findUnique({ where: { id: req.params.lectureId } });
    if (!existing) throw new HttpError(404, 'Lecture not found');

    const body = req.body as {
      title?: string;
      description?: string;
      notesMd?: string | null;
      notesAttachmentId?: string | null;
      orderIndex?: number;
      videoKey?: string;
      storageProviderId?: string | null;
    };

    const lecture = await prisma.lecture.update({
      where: { id: req.params.lectureId },
      data: {
        title: body.title,
        description: body.description,
        notesMd: body.notesMd === undefined ? undefined : body.notesMd,
        notesAttachmentId: body.notesAttachmentId === undefined ? undefined : body.notesAttachmentId,
        orderIndex: body.orderIndex,
        videoKey: body.videoKey,
        storageProviderId: body.storageProviderId
      },
      select: { id: true, courseId: true, title: true, description: true, notesMd: true, notesAttachmentId: true, orderIndex: true }
    });

    res.json({ lecture });
  })
);

router.delete(
  '/lectures/:lectureId',
  asyncHandler(async (req, res) => {
    const existing = await prisma.lecture.findUnique({ where: { id: req.params.lectureId } });
    if (!existing) throw new HttpError(404, 'Lecture not found');

    await prisma.lecture.delete({ where: { id: req.params.lectureId } });
    res.json({ ok: true });
  })
);

export default router;
