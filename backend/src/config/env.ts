import "dotenv/config";

export const env = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Used for payment return_url + webhook notify_url
  APP_BASE_URL: process.env.APP_BASE_URL || 'http://localhost:3000',
  PUBLIC_BACKEND_URL: process.env.PUBLIC_BACKEND_URL || 'http://localhost:4000',

  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/videoplatform?schema=public',

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'change_me_access_secret_min_20_chars --- IGNORE ---', 
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'change_me_refresh_secret_min_20_chars --- IGNORE ---',
  ACCESS_TOKEN_TTL_SECONDS: process.env.ACCESS_TOKEN_TTL_SECONDS ? Number(process.env.ACCESS_TOKEN_TTL_SECONDS) : 3600,
  REFRESH_TOKEN_TTL_SECONDS: process.env.REFRESH_TOKEN_TTL_SECONDS ? Number(process.env.REFRESH_TOKEN_TTL_SECONDS) : 86400,

  COOKIE_SECURE: process.env.COOKIE_SECURE === 'true' ? true : false,
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || 'localhost',

  // Generic S3-compatible storage (recommended). If set, these take precedence.
  S3_ENDPOINT: process.env.S3_ENDPOINT || '', 
  S3_REGION: process.env.S3_REGION || 'us-east-1',
  S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID || '', 
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY || '',
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || '', 
  S3_FORCE_PATH_STYLE: process.env.S3_FORCE_PATH_STYLE =='true'?true:false,

  // Cloudflare R2 legacy env vars (still supported).
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID || '',
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || '',
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || '',
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || '', 
  R2_REGION: process.env.R2_REGION || 'us-east-1',
  R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL || '',
  R2_ENDPOINT: process.env.R2_ENDPOINT || '',
  R2_FORCE_PATH_STYLE: process.env.R2_FORCE_PATH_STYLE =='true'?true:false,

  // Used to encrypt secrets for dynamically added storage providers.
  // Recommended: a long random string (will be hashed to a 32-byte key).
  STORAGE_PROVIDERS_ENC_KEY: process.env.STORAGE_PROVIDERS_ENC_KEY || 'change_me_storage_providers_encryption_key',

  // Cashfree Payment Gateway
  CASHFREE_ENV: process.env.CASHFREE_ENV || 'TEST',
  CASHFREE_CLIENT_ID: process.env.CASHFREE_CLIENT_ID || '',
  CASHFREE_CLIENT_SECRET: process.env.CASHFREE_CLIENT_SECRET || '',
  CASHFREE_API_VERSION: process.env.CASHFREE_API_VERSION || 'v1'
};

export const isProd = env.NODE_ENV === 'production';
