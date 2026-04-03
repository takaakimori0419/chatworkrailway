import crypto from 'node:crypto';
import { config } from './config.js';

export function verifyChatworkSignature(rawBody, signatureHeader) {
  if (!rawBody || !signatureHeader || !config.chatworkWebhookTokenBase64) {
    return false;
  }

  const key = Buffer.from(config.chatworkWebhookTokenBase64, 'base64');
  const digest = crypto
    .createHmac('sha256', key)
    .update(rawBody, 'utf8')
    .digest('base64');

  const expected = Buffer.from(digest);
  const actual = Buffer.from(signatureHeader || '');

  if (expected.length !== actual.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, actual);
}
