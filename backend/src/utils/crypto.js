import { createHmac, timingSafeEqual, randomBytes } from 'crypto';

/**
 * Verify a GitHub webhook HMAC-SHA256 signature.
 *
 * GitHub sends: X-Hub-Signature-256: sha256=<hex_digest>
 *
 * @param {Buffer|string} payload - Raw request body
 * @param {string} signature - Value of X-Hub-Signature-256 header
 * @param {string} secret - Webhook secret from env
 * @returns {boolean}
 */
export function verifyWebhookSignature(payload, signature, secret) {
  if (!signature || !secret) return false;

  const sigBuffer = Buffer.from(signature);
  const expectedSig = `sha256=${createHmac('sha256', secret)
    .update(payload)
    .digest('hex')}`;
  const expectedBuffer = Buffer.from(expectedSig);

  if (sigBuffer.length !== expectedBuffer.length) return false;

  try {
    return timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Generate a random hex secret of given byte length.
 * @param {number} [bytes=32]
 * @returns {string}
 */
export function generateSecret(bytes = 32) {
  return randomBytes(bytes).toString('hex');
}

import { createCipheriv, createDecipheriv } from 'crypto';
import env from '../config/env.js';

/**
 * Encrypt a string using AES-256-GCM
 */
export function encryptToken(text) {
  if (!text) return null;
  const iv = randomBytes(12);
  const key = Buffer.from(env.ENCRYPTION_KEY, 'hex'); // Requires a 32-byte hex key (64 chars)
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt a string using AES-256-GCM
 */
export function decryptToken(encryptedText) {
  if (!encryptedText) return null;
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  if (!ivHex || !authTagHex || !encrypted) throw new Error('Invalid encrypted token format');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = Buffer.from(env.ENCRYPTION_KEY, 'hex');
  
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
