import type { Context } from 'hono';

export const ok = <T>(c: Context, data: T, status: 200 | 201 = 200) =>
  c.json({ success: true, data }, status);

export const err = (c: Context, code: string, message: string, status = 400) =>
  c.json({ success: false, error: { code, message } }, status as any);
