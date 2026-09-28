import { Hono } from 'hono';
import { authRoutes } from './auth.js';

export const routes = new Hono();

routes.get('/api/health', (c) => {
  return c.json({ status: 'ok', message: 'Shad-SaaS API is running' });
});

routes.get('/api/version', (c) => {
  return c.json({ version: '0.0.1-alpha' });
});

routes.route('/api/auth', authRoutes);
