import { Hono } from 'hono';
import { verifySamWebhookSignature, parseSamWebhook } from '@shad-saas/providers';
import { processInvoicePaid, processInvoiceExpired } from '../services/webhooks.service.js';

export const webhooksRoutes = new Hono();

// POST /api/webhooks/sam
webhooksRoutes.post('/sam', async (c) => {
  const rawBody = await c.req.text();
  const signature = c.req.header('x-sam-signature');

  // 1. تحقق من التوقيع (dev mode: يتجاوز إن لم يُضبط secret)
  if (!verifySamWebhookSignature(rawBody, signature)) {
    console.warn('[Webhook] Signature verification failed');
    return c.json({ ok: false, error: 'Invalid signature' }, 401);
  }

  // 2. Parse body
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    console.error('[Webhook] Invalid JSON');
    return c.json({ ok: false, error: 'Invalid JSON' }, 400);
  }

  // 3. Parse payload
  let payload;
  try {
    payload = parseSamWebhook(body);
  } catch (err) {
    console.error('[Webhook] Invalid payload:', err);
    return c.json({ ok: false, error: 'Invalid payload' }, 400);
  }

  console.log(`[Webhook] Received ${payload.event} for invoice ${payload.invoiceId}`);

  // 4. Process حسب النوع — دائماً أعِد 200 حتى لا SAM retries
  try {
    if (payload.event === 'invoice.paid') {
      const result = await processInvoicePaid(payload);
      console.log(`[Webhook] invoice.paid processed:`, {
        skipped: result.skipped,
        reason: result.reason,
        credited: result.credited,
      });
    } else if (payload.event === 'invoice.expired') {
      const result = await processInvoiceExpired(payload);
      console.log(`[Webhook] invoice.expired processed:`, {
        skipped: result.skipped,
        reason: result.reason,
      });
    }
  } catch (err) {
    // ⚠️ مهم: نسجّل الخطأ لكن نرد 200
    // (لأن SAM سيُعيد المحاولة إذا ردّينا 4xx/5xx، وهذا يُنشئ حلقة)
    console.error('[Webhook] Processing error (still returning 200):', err);
  }

  return c.json({ ok: true }, 200);
});
