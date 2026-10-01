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

// Fallback proxy to Vite dev server (port 5173) for frontend routes in AI Studio preview
app.all('*', async (c) => {
  if (c.req.path.startsWith('/api')) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } }, 404);
  }

  try {
    const query = c.req.url.includes('?') ? '?' + c.req.url.split('?')[1] : '';
    const viteUrl = `http://127.0.0.1:5173${c.req.path}${query}`;
    const headers = new Headers(c.req.raw.headers);
    headers.set('host', 'localhost:5173');

    const response = await fetch(viteUrl, {
      method: c.req.method,
      headers,
      body: c.req.method !== 'GET' && c.req.method !== 'HEAD' ? c.req.raw.body : undefined,
    });

    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch {
    return c.html('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Loading Store...</title></head><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;"><div><h3>جاري تشغيل واجهة المتجر (Vite Store)...</h3><p>يرجى الانتظار ثوانٍ معدودة.</p></div></body></html>', 503);
  }
});
