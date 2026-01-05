import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { prisma } from '../lib/prisma.js';
import { signStreamUrl } from '../lib/r2.js';
import { HttpError } from '../utils/errors.js';

const router = Router();

router.get(
  '/courses/:courseId',
  asyncHandler(async (req, res) => {
    const course = await prisma.course.findUnique({ where: { id: req.params.courseId } });
    if (!course) throw new HttpError(404, 'Course not found');

    const attachments = await prisma.attachment.findMany({
      where: { courseId: req.params.courseId, lectureId: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, fileKey: true, mimeType: true, sizeBytes: true, lectureId: true, createdAt: true }
    });

    res.json({ attachments });
  })
);

router.post(
  '/courses/:courseId',
  validateBody(
    z.object({
      title: z.string().min(1),
      fileKey: z.string().min(1),
      mimeType: z.string().min(1),
      sizeBytes: z.coerce.number().int().positive().optional().nullable(),
      storageProviderId: z.string().min(1).optional().nullable()
    })
  ),
  asyncHandler(async (req, res) => {
    const course = await prisma.course.findUnique({ where: { id: req.params.courseId } });
    if (!course) throw new HttpError(404, 'Course not found');

    const body = req.body as {
      title: string;
      fileKey: string;
      mimeType: string;
      sizeBytes?: number | null;
      storageProviderId?: string | null;
    };

    const attachment = await prisma.attachment.create({
      data: {
        courseId: req.params.courseId,
        lectureId: null,
        title: body.title,
        fileKey: body.fileKey,
        mimeType: body.mimeType,
        sizeBytes: body.sizeBytes ?? null,
        storageProviderId: body.storageProviderId ?? null
      },
      select: { id: true, title: true, fileKey: true, mimeType: true, sizeBytes: true, lectureId: true, createdAt: true }
    });

    res.status(201).json({ attachment });
  })
);

router.get(
  '/lectures/:lectureId',
  asyncHandler(async (req, res) => {
    const lecture = await prisma.lecture.findUnique({ where: { id: req.params.lectureId } });
    if (!lecture) throw new HttpError(404, 'Lecture not found');

    const attachments = await prisma.attachment.findMany({
      where: { lectureId: req.params.lectureId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, fileKey: true, mimeType: true, sizeBytes: true, lectureId: true, createdAt: true }
    });

    res.json({ attachments });
  })
);

router.post(
  '/lectures/:lectureId',
  validateBody(
    z.object({
      title: z.string().min(1),
      fileKey: z.string().min(1),
      mimeType: z.string().min(1),
      sizeBytes: z.coerce.number().int().positive().optional().nullable(),
      storageProviderId: z.string().min(1).optional().nullable()
    })
  ),
  asyncHandler(async (req, res) => {
    const lecture = await prisma.lecture.findUnique({ where: { id: req.params.lectureId } });
    if (!lecture) throw new HttpError(404, 'Lecture not found');

    const body = req.body as {
      title: string;
      fileKey: string;
      mimeType: string;
      sizeBytes?: number | null;
      storageProviderId?: string | null;
    };

    const attachment = await prisma.attachment.create({
      data: {
        courseId: lecture.courseId,
        lectureId: lecture.id,
        title: body.title,
        fileKey: body.fileKey,
        mimeType: body.mimeType,
        sizeBytes: body.sizeBytes ?? null,
        storageProviderId: body.storageProviderId ?? null
      },
      select: { id: true, title: true, fileKey: true, mimeType: true, sizeBytes: true, lectureId: true, createdAt: true }
    });

    res.status(201).json({ attachment });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.attachment.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, 'Attachment not found');

    await prisma.attachment.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

router.get(
  '/:id/download-url',
  asyncHandler(async (req, res) => {
    const attachment = await prisma.attachment.findUnique({
      where: { id: req.params.id },
      select: { id: true, fileKey: true, storageProviderId: true }
    });

    if (!attachment) throw new HttpError(404, 'Attachment not found');

    const expiresInSeconds = 5 * 60;
    const url = await signStreamUrl({
      key: attachment.fileKey,
      providerId: attachment.storageProviderId ?? null,
      expiresInSeconds
    });

    res.json({ url, expiresInSeconds });
  })
);

export default router;
