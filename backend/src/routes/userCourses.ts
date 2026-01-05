import { Router } from 'express';

import { asyncHandler } from '../middleware/asyncHandler.js';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../utils/errors.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    const courses = await prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnailKey: true,
        createdAt: true,
        priceInrPaise: true,
        assignments: { where: { userId }, select: { userId: true } }
      }
    });

    res.json({
      courses: courses.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        thumbnailKey: c.thumbnailKey,
        createdAt: c.createdAt,
        priceInrPaise: c.priceInrPaise,
        assigned: c.assignments.length > 0
      }))
    });
  })
);

router.get(
  '/:courseId',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    const course = await prisma.course.findUnique({
      where: { id: req.params.courseId },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnailKey: true,
        createdAt: true,
        priceInrPaise: true
      }
    });

    if (!course) throw new HttpError(404, 'Course not found');

    const assignment = await prisma.courseAssignment.findUnique({
      where: { userId_courseId: { userId, courseId: req.params.courseId } }
    });

    if (!assignment) {
      return res.json({ course: { ...course, lectures: [] }, assigned: false });
    }

    const lectures = await prisma.lecture.findMany({
      where: { courseId: req.params.courseId },
      orderBy: { orderIndex: 'asc' },
      select: { id: true, title: true, description: true, orderIndex: true }
    });

    res.json({ course: { ...course, lectures }, assigned: true });
  })
);

export default router;
