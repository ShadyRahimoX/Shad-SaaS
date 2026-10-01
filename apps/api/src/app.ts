import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { routes } from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';

export const app = new Hono();

// CORS with credentials support
app.use('*', cors({
  origin: (origin) => {
    return origin || process.env.CLIENT_URL || 'http://localhost:5173';
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key'],
  exposeHeaders: ['Set-Cookie'],
}));

app.onError(errorHandler);
app.route('/', routes);

// Fallback proxy to Vite dev server (port 5173/5174) for frontend routes in AI Studio preview
app.all('*', async (c) => {
  if (c.req.path.startsWith('/api')) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } }, 404);
  }

  const query = c.req.url.includes('?') ? '?' + c.req.url.split('?')[1] : '';
  const ports = [5173, 5174];

  for (const p of ports) {
    try {
      const headers = new Headers(c.req.raw.headers);
      headers.set('host', `localhost:${p}`);

      const response = await fetch(`http://127.0.0.1:${p}${c.req.path}${query}`, {
        method: c.req.method,
        headers,
        body: c.req.method !== 'GET' && c.req.method !== 'HEAD' ? c.req.raw.body : undefined,
      });

      return new Response(response.body, {
        status: response.status,
        headers: response.headers,
      });
    } catch {
      // try next port
    }
  }

  // Always return 200 so platform health check passes while frontend is warming up
  return c.html(
    '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>المتجر</title><meta http-equiv="refresh" content="1"></head><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;background:#ffffff;color:#111827;"><div><h3>جاري تشغيل واجهة المتجر...</h3><p>يرجى الانتظار ثوانٍ معدودة.</p></div></body></html>',
    200
  );
});
