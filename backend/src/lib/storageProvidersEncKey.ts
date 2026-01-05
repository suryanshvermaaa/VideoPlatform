import { env, isProd } from '../config/env.js';
import { HttpError } from '../utils/errors.js';

let warned = false;

/**
 * Returns key material used to encrypt/decrypt dynamic storage provider secrets.
 *
 * - In production: requires STORAGE_PROVIDERS_ENC_KEY.
 * - In dev/test: falls back to JWT_REFRESH_SECRET (to avoid hard-blocking local setups).
 */
export function getStorageProvidersEncKeyMaterial() {
  if (env.STORAGE_PROVIDERS_ENC_KEY) return env.STORAGE_PROVIDERS_ENC_KEY;

  if (isProd) {
    throw new HttpError(500, 'STORAGE_PROVIDERS_ENC_KEY is not set (required for dynamic storage providers)');
  }

  if (!warned) {
    warned = true;
    console.warn('[backend] STORAGE_PROVIDERS_ENC_KEY missing; falling back to JWT_REFRESH_SECRET (dev/test only).');
  }

  return env.JWT_REFRESH_SECRET;
}
