import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { prisma } from '../lib/prisma.js';
import { encryptSecret } from '../lib/cryptoSecret.js';
import { getStorageProvidersEncKeyMaterial } from '../lib/storageProvidersEncKey.js';
import { HttpError } from '../utils/errors.js';

const router = Router();

function requireEncKey() {
  return getStorageProvidersEncKeyMaterial();
}

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const providers = await prisma.storageProvider.findMany({
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        endpoint: true,
        region: true,
        bucket: true,
        accessKeyId: true,
        forcePathStyle: true,
        active: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({ providers });
  })
);

router.post(
  '/',
  validateBody(
    z.object({
      name: z.string().min(2),
      endpoint: z.string().min(1).optional().nullable(),
      region: z.string().min(1).default('us-east-1'),
      bucket: z.string().min(1),
      accessKeyId: z.string().min(1),
      secretAccessKey: z.string().min(1),
      forcePathStyle: z.coerce.boolean().default(false),
      active: z.coerce.boolean().default(true),
      isDefault: z.coerce.boolean().default(false)
    })
  ),
  asyncHandler(async (req, res) => {
    const body = req.body as {
      name: string;
      endpoint?: string | null;
      region: string;
      bucket: string;
      accessKeyId: string;
      secretAccessKey: string;
      forcePathStyle: boolean;
      active: boolean;
      isDefault: boolean;
    };

    const keyMaterial = requireEncKey();
    const secretEnc = encryptSecret(body.secretAccessKey, keyMaterial);

    const provider = await prisma.$transaction(async (tx) => {
      if (body.isDefault) {
        await tx.storageProvider.updateMany({ data: { isDefault: false }, where: { isDefault: true } });
      }

      return tx.storageProvider.create({
        data: {
          name: body.name,
          endpoint: body.endpoint ?? null,
          region: body.region,
          bucket: body.bucket,
          accessKeyId: body.accessKeyId,
          secretEnc,
          forcePathStyle: body.forcePathStyle,
          active: body.active,
          isDefault: body.isDefault
        },
        select: {
          id: true,
          name: true,
          endpoint: true,
          region: true,
          bucket: true,
          accessKeyId: true,
          forcePathStyle: true,
          active: true,
          isDefault: true,
          createdAt: true,
          updatedAt: true
        }
      });
    });

    res.status(201).json({ provider });
  })
);

router.patch(
  '/:id',
  validateBody(
    z
      .object({
        name: z.string().min(2).optional(),
        endpoint: z.string().min(1).optional().nullable(),
        region: z.string().min(1).optional(),
        bucket: z.string().min(1).optional(),
        accessKeyId: z.string().min(1).optional(),
        secretAccessKey: z.string().min(1).optional(),
        forcePathStyle: z.coerce.boolean().optional(),
        active: z.coerce.boolean().optional(),
        isDefault: z.coerce.boolean().optional()
      })
      .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' })
  ),
  asyncHandler(async (req, res) => {
    const existing = await prisma.storageProvider.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, 'Storage provider not found');

    const body = req.body as {
      name?: string;
      endpoint?: string | null;
      region?: string;
      bucket?: string;
      accessKeyId?: string;
      secretAccessKey?: string;
      forcePathStyle?: boolean;
      active?: boolean;
      isDefault?: boolean;
    };

    const provider = await prisma.$transaction(async (tx) => {
      if (body.isDefault) {
        await tx.storageProvider.updateMany({ data: { isDefault: false }, where: { isDefault: true } });
      }

      const data: any = {
        name: body.name,
        endpoint: body.endpoint,
        region: body.region,
        bucket: body.bucket,
        accessKeyId: body.accessKeyId,
        forcePathStyle: body.forcePathStyle,
        active: body.active,
        isDefault: body.isDefault
      };

      if (body.secretAccessKey) {
        const keyMaterial = requireEncKey();
        data.secretEnc = encryptSecret(body.secretAccessKey, keyMaterial);
      }

      return tx.storageProvider.update({
        where: { id: req.params.id },
        data,
        select: {
          id: true,
          name: true,
          endpoint: true,
          region: true,
          bucket: true,
          accessKeyId: true,
          forcePathStyle: true,
          active: true,
          isDefault: true,
          createdAt: true,
          updatedAt: true
        }
      });
    });

    res.json({ provider });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.storageProvider.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, 'Storage provider not found');

    await prisma.storageProvider.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

export default router;
