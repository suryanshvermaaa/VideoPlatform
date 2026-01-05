import crypto from 'crypto';
import { env } from '../config/env.js';
import { HttpError } from '../utils/errors.js';

export function verifyCashfreeWebhookSignature(rawBody: Buffer, headers: Record<string, string | string[] | undefined>) {
  const sig = headerValue(headers, 'x-webhook-signature');
  const ts = headerValue(headers, 'x-webhook-timestamp');

  if (!sig || !ts) throw new HttpError(400, 'Missing webhook signature headers');
  if (!env.CASHFREE_CLIENT_SECRET) throw new HttpError(500, 'Cashfree not configured');

  const signedPayload = `${ts}${rawBody.toString('utf8')}`;
  const expected = crypto.createHmac('sha256', env.CASHFREE_CLIENT_SECRET).update(signedPayload).digest('base64');

  // Constant-time compare
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new HttpError(400, 'Invalid webhook signature');
  }
}

export function cashfreeIdempotencyKey(headers: Record<string, string | string[] | undefined>) {
  return headerValue(headers, 'x-idempotency-key');
}

function headerValue(headers: Record<string, string | string[] | undefined>, key: string) {
  const v = headers[key] ?? headers[key.toLowerCase()];
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}
