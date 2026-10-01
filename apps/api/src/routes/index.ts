import { Hono } from 'hono';
import { authRoutes } from './auth.js';
import { adminRoutes } from './admin.js';
import { publicRoutes } from './public.js';
import { ordersRoutes } from './orders.js';
import { depositsRoutes } from './deposits.js';
import { webhooksRoutes } from './webhooks.js';
import { meRoutes } from './me.js';

export const routes = new Hono();

routes.get('/api/health', (c) => c.json({ status: 'ok', message: 'Shad-SaaS API is running' }));
routes.get('/api/version', (c) => c.json({ version: '0.0.1-alpha' }));

// Webhooks أولاً (بدون auth)
routes.route('/api/webhooks', webhooksRoutes);

// ثم الباقي
routes.route('/api/auth', authRoutes);
routes.route('/api/me', meRoutes);
routes.route('/api/admin', adminRoutes);
routes.route('/api/public', publicRoutes);
routes.route('/api/orders', ordersRoutes);
routes.route('/api/deposits', depositsRoutes);
