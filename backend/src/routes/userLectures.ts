import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { prisma } from '../lib/prisma.js';
import { signStreamUrl } from '../lib/r2.js';
import { HttpError } from '../utils/errors.js';

const router = Router();

async function requireLectureAccess(userId: string, lectureId: string) {
  const lecture = await prisma.lecture.findUnique({ where: { id: lectureId } });
  if (!lecture) throw new HttpError(404, 'Lecture not found');

  const assigned = await prisma.courseAssignment.findUnique({
    where: { userId_courseId: { userId, courseId: lecture.courseId } }
  });

  if (!assigned) throw new HttpError(403, 'Course not assigned');

  return lecture;
}

router.get(
  '/:lectureId',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const lecture = await requireLectureAccess(userId, req.params.lectureId);

    const notesAttachment = lecture.notesAttachmentId
      ? await prisma.attachment.findUnique({
          where: { id: lecture.notesAttachmentId },
          select: { id: true, title: true, mimeType: true, sizeBytes: true, createdAt: true }
        })
      : null;

    const progress = await prisma.videoProgress.findUnique({
      where: { userId_lectureId: { userId, lectureId: lecture.id } },
      select: { progressPct: true, updatedAt: true }
    });

    res.json({
      lecture: {
        id: lecture.id,
        courseId: lecture.courseId,
        title: lecture.title,
        description: lecture.description,
        notesMd: lecture.notesMd,
        notesAttachmentId: lecture.notesAttachmentId,
        notesAttachment,
        orderIndex: lecture.orderIndex
      },
      progress: progress ?? { progressPct: 0, updatedAt: null }
    });
  })
);

router.get(
  '/:lectureId/stream-url',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const lecture = await requireLectureAccess(userId, req.params.lectureId);

    const url = await signStreamUrl({ key: lecture.videoKey, providerId: lecture.storageProviderId ?? null, expiresInSeconds: 60 });
    res.json({ url, expiresInSeconds: 60 });
  })
);

router.put(
  '/:lectureId/progress',
  validateBody(z.object({ progressPct: z.coerce.number().min(0).max(100) })),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    await requireLectureAccess(userId, req.params.lectureId);

    const body = req.body as { progressPct: number };

    const progress = await prisma.videoProgress.upsert({
      where: { userId_lectureId: { userId, lectureId: req.params.lectureId } },
      update: { progressPct: body.progressPct },
      create: { userId, lectureId: req.params.lectureId, progressPct: body.progressPct }
    });

    res.json({ progress: { progressPct: progress.progressPct, updatedAt: progress.updatedAt } });
  })
);

export default router;
