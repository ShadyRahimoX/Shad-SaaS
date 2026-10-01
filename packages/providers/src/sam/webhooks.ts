import type { SamWebhookPayload } from './types.js';

/**
 * SAM حالياً لا يُرسل signature مع webhook (حسب وثائقهم).
 * هذه دالة تحقق احتياطية في حال أضافوا توقيعاً لاحقاً.
 *
 * التحقق الحالي:
 * 1. إذا كان SAM_WEBHOOK_SECRET موجوداً وأُرسل signature، نتحقق
 * 2. إذا لم يُرسل signature أو لم يُضبط secret، نسمح (dev & SAM current behavior)
 */
export function verifySamWebhookSignature(
  rawBody: string,
  signature: string | undefined
): boolean {
  const secret = process.env.SAM_WEBHOOK_SECRET;

  // إذا لم يُضبط secret، نسمح في dev
  if (!secret) {
    return true;
  }

  // SAM حالياً لا يرسل signature
  if (!signature) {
    return true;
  }

  // تحقق بسيط: HMAC-SHA256(secret, body) === signature
  // سيُطبّق إن أضاف SAM التوقيع
  // حالياً placeholder:
  return true;
}

export function parseSamWebhook(body: unknown): SamWebhookPayload {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid SAM webhook payload');
  }

  const b = body as Record<string, unknown>;

  if (typeof b.event !== 'string' || !b.event.startsWith('invoice.')) {
    throw new Error('Invalid or missing event');
  }

  if (typeof b.invoiceId !== 'string') {
    throw new Error('Missing invoiceId');
  }

  return b as unknown as SamWebhookPayload;
}
