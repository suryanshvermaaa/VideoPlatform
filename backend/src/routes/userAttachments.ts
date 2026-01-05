import { Router } from 'express';

import { asyncHandler } from '../middleware/asyncHandler.js';
import { prisma } from '../lib/prisma.js';
import { signStreamUrl } from '../lib/r2.js';
import { HttpError } from '../utils/errors.js';

const router = Router();

async function requireCourseAccess(userId: string, courseId: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
  if (!course) throw new HttpError(404, 'Course not found');

  const assigned = await prisma.courseAssignment.findUnique({
    where: { userId_courseId: { userId, courseId } }
  });

  if (!assigned) throw new HttpError(403, 'Course not assigned');
  return course;
}

async function requireLectureAccess(userId: string, lectureId: string) {
  const lecture = await prisma.lecture.findUnique({ where: { id: lectureId }, select: { id: true, courseId: true } });
  if (!lecture) throw new HttpError(404, 'Lecture not found');

  await requireCourseAccess(userId, lecture.courseId);
  return lecture;
}

router.get(
  '/courses/:courseId',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const courseId = req.params.courseId;

    await requireCourseAccess(userId, courseId);

    const attachments = await prisma.attachment.findMany({
      where: { courseId, lectureId: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, mimeType: true, sizeBytes: true, lectureId: true, createdAt: true }
    });

    res.json({ attachments });
  })
);

router.get(
  '/lectures/:lectureId',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const lectureId = req.params.lectureId;

    await requireLectureAccess(userId, lectureId);

    const attachments = await prisma.attachment.findMany({
      where: { lectureId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, mimeType: true, sizeBytes: true, lectureId: true, createdAt: true }
    });

    res.json({ attachments });
  })
);

router.get(
  '/:id/download-url',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    const attachment = await prisma.attachment.findUnique({
      where: { id: req.params.id },
      select: { id: true, courseId: true, lectureId: true, fileKey: true, storageProviderId: true }
    });

    if (!attachment) throw new HttpError(404, 'Attachment not found');

    await requireCourseAccess(userId, attachment.courseId);

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
