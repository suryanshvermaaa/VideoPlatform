import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { signUploadUrl } from '../lib/r2.js';

const router = Router();

router.post(
  '/presign-upload',
  validateBody(
    z.object({
      key: z.string().min(1),
      contentType: z.string().min(1),
      providerId: z.string().min(1).optional().nullable(),
      expiresInSeconds: z.coerce.number().int().positive().max(60 * 30).optional()
    })
  ),
  asyncHandler(async (req, res) => {
    const body = req.body as { key: string; contentType: string; providerId?: string | null; expiresInSeconds?: number };
    const url = await signUploadUrl({
      key: body.key,
      contentType: body.contentType,
      providerId: body.providerId,
      expiresInSeconds: body.expiresInSeconds
    });
    res.json({ url, key: body.key });
  })
);

export default router;
