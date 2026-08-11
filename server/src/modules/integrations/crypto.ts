import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { env } from '../../config/env.js';

/**
 * AES-256-GCM encryption for OAuth tokens at rest. The key is derived once from
 * INTEGRATIONS_ENCRYPTION_KEY (or JWT_ACCESS_SECRET as a fallback) via scrypt.
 * Format: base64(iv).base64(authTag).base64(ciphertext).
 */
let cachedKey: Buffer | null = null;
function key(): Buffer {
  if (!cachedKey) {
    const secret = env.INTEGRATIONS_ENCRYPTION_KEY || env.JWT_ACCESS_SECRET;
    cachedKey = scryptSync(secret, 'vorizon-integrations', 32);
  }
  return cachedKey;
}

export function encryptToken(plaintext: string): string {
  if (!plaintext) return '';
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${enc.toString('base64')}`;
}

export function decryptToken(payload: string): string {
  if (!payload) return '';
  const [ivB64, tagB64, dataB64] = payload.split('.');
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Malformed encrypted token');
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
}
