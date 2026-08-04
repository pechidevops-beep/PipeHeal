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
