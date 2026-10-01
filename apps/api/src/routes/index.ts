import { Hono } from 'hono';
import { authRoutes } from './auth.js';
import { adminRoutes } from './admin.js';
import { publicRoutes } from './public.js';
import { ordersRoutes } from './orders.js';

export const routes = new Hono();

routes.get('/api/health', (c) => c.json({ status: 'ok', message: 'Shad-SaaS API is running' }));
routes.get('/api/version', (c) => c.json({ version: '0.0.1-alpha' }));

routes.route('/api/auth', authRoutes);
routes.route('/api/admin', adminRoutes);
routes.route('/api/public', publicRoutes);
routes.route('/api/orders', ordersRoutes);
