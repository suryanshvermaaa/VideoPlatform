import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { env, isProd } from './config/env.js';
import { requireAuth, requireRole } from './middleware/auth.js';
import { requireActivePlan } from './middleware/plan.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRouter from './routes/auth.js';
import adminUsersRouter from './routes/adminUsers.js';
import adminCoursesRouter from './routes/adminCourses.js';
import adminLecturesRouter from './routes/adminLectures.js';
import adminAssignmentsRouter from './routes/adminAssignments.js';
import adminR2Router from './routes/adminR2.js';
import adminStorageProvidersRouter from './routes/adminStorageProviders.js';
import adminCouponsRouter from './routes/adminCoupons.js';
import adminAttachmentsRouter from './routes/adminAttachments.js';
import paymentsRouter from './routes/payments.js';
import webhooksRouter from './routes/webhooksCashfree.js';
import userCoursesRouter from './routes/userCourses.js';
import userLecturesRouter from './routes/userLectures.js';
import userAttachmentsRouter from './routes/userAttachments.js';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  })
);

app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: 'draft-7',
    legacyHeaders: false
  })
);

app.use(
  express.json({
    limit: '2mb',
    verify: (req, _res, buf) => {
      // Required for Cashfree webhook signature verification.
      // Signature is computed over the raw payload.
      (req as any).rawBody = buf;
    }
  })
);
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ ok: true, env: env.NODE_ENV });
});

app.use('/auth', authRouter);
app.use('/webhooks', webhooksRouter);
app.use('/admin/users', requireAuth, requireRole('ADMIN'), adminUsersRouter);
app.use('/admin/courses', requireAuth, requireRole('ADMIN'), adminCoursesRouter);
app.use('/admin', requireAuth, requireRole('ADMIN'), adminLecturesRouter);
app.use('/admin/assignments', requireAuth, requireRole('ADMIN'), adminAssignmentsRouter);
app.use('/admin/r2', requireAuth, requireRole('ADMIN'), adminR2Router);
app.use('/admin/storage-providers', requireAuth, requireRole('ADMIN'), adminStorageProvidersRouter);
app.use('/admin/coupons', requireAuth, requireRole('ADMIN'), adminCouponsRouter);
app.use('/admin/attachments', requireAuth, requireRole('ADMIN'), adminAttachmentsRouter);

// Payments should be accessible even if plan is expired (so users can pay to regain access).
app.use('/payments', requireAuth, paymentsRouter);

app.use('/courses', requireAuth, userCoursesRouter);
app.use('/lectures', requireAuth, requireActivePlan, userLecturesRouter);
app.use('/attachments', requireAuth, userAttachmentsRouter);

app.use((_req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use(errorHandler);

export default app;