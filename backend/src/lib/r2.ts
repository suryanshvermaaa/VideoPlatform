import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getStorageProviderConfig } from './storageProviders.js';

export async function getR2Client(providerId?: string | null) {
  const cfg = await getStorageProviderConfig(providerId);
  return new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint,
    forcePathStyle: cfg.forcePathStyle,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey
    }
  });
}

export async function getR2BucketName(providerId?: string | null) {
  const cfg = await getStorageProviderConfig(providerId);
  return cfg.bucket;
}

export async function signUploadUrl(opts: { key: string; contentType: string; expiresInSeconds?: number; providerId?: string | null }) {
  const s3 = await getR2Client(opts.providerId);
  const Bucket = await getR2BucketName(opts.providerId);
  const command = new PutObjectCommand({
    Bucket,
    Key: opts.key,
    ContentType: opts.contentType
  });

  return getSignedUrl(s3, command, { expiresIn: opts.expiresInSeconds ?? 5 * 60 });
}

export async function signStreamUrl(opts: { key: string; expiresInSeconds?: number; providerId?: string | null }) {
  const s3 = await getR2Client(opts.providerId);
  const Bucket = await getR2BucketName(opts.providerId);
  const command = new GetObjectCommand({
    Bucket,
    Key: opts.key
  });

  return getSignedUrl(s3, command, { expiresIn: opts.expiresInSeconds ?? 60 });
}
