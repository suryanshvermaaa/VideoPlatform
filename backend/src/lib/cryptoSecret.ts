import crypto from 'node:crypto';

const VERSION = 'v1';

function deriveKey(keyMaterial: string) {
  // Hash to 32 bytes for AES-256
  return crypto.createHash('sha256').update(keyMaterial, 'utf8').digest();
}

export function encryptSecret(plain: string, keyMaterial: string) {
  const key = deriveKey(keyMaterial);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${VERSION}:${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`;
}

export function decryptSecret(enc: string, keyMaterial: string) {
  const [version, ivB64, tagB64, ctB64] = enc.split(':');
  if (version !== VERSION || !ivB64 || !tagB64 || !ctB64) {
    throw new Error('Unsupported secret format');
  }

  const key = deriveKey(keyMaterial);
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const ciphertext = Buffer.from(ctB64, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plain.toString('utf8');
}
