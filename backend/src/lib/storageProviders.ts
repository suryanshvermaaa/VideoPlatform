import { prisma } from './prisma.js';
import { env } from '../config/env.js';
import { decryptSecret } from './cryptoSecret.js';
import { HttpError } from '../utils/errors.js';

export type StorageProviderConfig = {
  id?: string;
  name?: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  endpoint?: string;
  forcePathStyle: boolean;
  region: string;
};

function envFallbackConfig(): StorageProviderConfig {
  const accessKeyId = env.S3_ACCESS_KEY_ID ?? env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.S3_SECRET_ACCESS_KEY ?? env.R2_SECRET_ACCESS_KEY;
  const bucket = env.S3_BUCKET_NAME ?? env.R2_BUCKET_NAME;

  const endpoint =
    env.S3_ENDPOINT ??
    env.R2_ENDPOINT ??
    (env.R2_ACCOUNT_ID ? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined);

  const forcePathStyle = env.S3_FORCE_PATH_STYLE || env.R2_FORCE_PATH_STYLE;
  const region = env.S3_ACCESS_KEY_ID || env.S3_BUCKET_NAME || env.S3_ENDPOINT ? env.S3_REGION : env.R2_REGION;

  const missing = [
    ['S3_ACCESS_KEY_ID (or R2_ACCESS_KEY_ID)', accessKeyId],
    ['S3_SECRET_ACCESS_KEY (or R2_SECRET_ACCESS_KEY)', secretAccessKey],
    ['S3_BUCKET_NAME (or R2_BUCKET_NAME)', bucket]
  ].filter(([, v]) => !v);

  if (missing.length) {
    throw new HttpError(500, `Storage is not configured (missing: ${missing.map(([k]) => k).join(', ')})`);
  }

  return {
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
    bucket: bucket!,
    endpoint,
    forcePathStyle,
    region
  };
}

export async function getStorageProviderConfig(providerId?: string | null): Promise<StorageProviderConfig> {
  if (providerId) {
    const p = await prisma.storageProvider.findUnique({ where: { id: providerId } });
    if (!p) throw new HttpError(404, 'Storage provider not found');
    if (!p.active) throw new HttpError(400, 'Storage provider is inactive');

    if (!env.STORAGE_PROVIDERS_ENC_KEY) {
      throw new HttpError(500, 'STORAGE_PROVIDERS_ENC_KEY is not set (required for dynamic storage providers)');
    }

    const secretAccessKey = decryptSecret(p.secretEnc, env.STORAGE_PROVIDERS_ENC_KEY);

    return {
      id: p.id,
      name: p.name,
      accessKeyId: p.accessKeyId,
      secretAccessKey,
      bucket: p.bucket,
      endpoint: p.endpoint ?? undefined,
      forcePathStyle: p.forcePathStyle,
      region: p.region
    };
  }

  // If no providerId is specified, prefer the DB default provider (if any), otherwise fall back to env.
  const dbDefault = await prisma.storageProvider.findFirst({ where: { isDefault: true, active: true } });
  if (dbDefault) {
    if (!env.STORAGE_PROVIDERS_ENC_KEY) {
      throw new HttpError(500, 'STORAGE_PROVIDERS_ENC_KEY is not set (required for dynamic storage providers)');
    }
    const secretAccessKey = decryptSecret(dbDefault.secretEnc, env.STORAGE_PROVIDERS_ENC_KEY);
    return {
      id: dbDefault.id,
      name: dbDefault.name,
      accessKeyId: dbDefault.accessKeyId,
      secretAccessKey,
      bucket: dbDefault.bucket,
      endpoint: dbDefault.endpoint ?? undefined,
      forcePathStyle: dbDefault.forcePathStyle,
      region: dbDefault.region
    };
  }

  return envFallbackConfig();
}
