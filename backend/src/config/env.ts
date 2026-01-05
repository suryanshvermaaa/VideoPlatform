import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Used for payment return_url + webhook notify_url
  APP_BASE_URL: z.string().default('http://localhost:3000'),
  PUBLIC_BACKEND_URL: z.string().default('http://localhost:4000'),

  DATABASE_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(15 * 60),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(7 * 24 * 60 * 60),

  COOKIE_SECURE: z.coerce.boolean().default(false),
  COOKIE_DOMAIN: z.string().optional().or(z.literal('')),

  // Generic S3-compatible storage (recommended). If set, these take precedence.
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET_NAME: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(false),

  // Cloudflare R2 legacy env vars (still supported).
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_REGION: z.string().default('auto'),
  R2_PUBLIC_BASE_URL: z.string().optional(),
  R2_ENDPOINT: z.string().optional(),
  R2_FORCE_PATH_STYLE: z.coerce.boolean().default(false),

  // Used to encrypt secrets for dynamically added storage providers.
  // Recommended: a long random string (will be hashed to a 32-byte key).
  STORAGE_PROVIDERS_ENC_KEY: z.string().optional(),

  // Cashfree Payment Gateway
  CASHFREE_ENV: z.enum(['SANDBOX', 'PRODUCTION']).default('SANDBOX'),
  CASHFREE_CLIENT_ID: z.string().optional(),
  CASHFREE_CLIENT_SECRET: z.string().optional(),
  CASHFREE_API_VERSION: z.string().default('2025-01-01')
});

export const env = envSchema.parse(process.env);

export const isProd = env.NODE_ENV === 'production';
