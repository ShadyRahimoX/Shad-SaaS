import { Hono } from 'hono';
import { authRoutes } from './auth.js';
import { adminRoutes } from './admin.js';
import { publicRoutes } from './public.js';
import { ordersRoutes } from './orders.js';
import { depositsRoutes } from './deposits.js';
import { webhooksRoutes } from './webhooks.js';
import { meRoutes } from './me.js';
import { meNotificationsRoutes } from './me-notifications.js';
import { meChatRoutes } from './me-chat.js';
import { adminChatRoutes } from './admin-chat.js';
import { meTicketsRoutes } from './me-tickets.js';
import { adminTicketsRoutes } from './admin-tickets.js';
import { adminSettingsRoutes } from './admin-settings.js';
import { publicSettingsRoutes } from './public-settings.js';
import { adminThemesRoutes } from './admin-themes.js';
import { publicThemesRoutes } from './public-themes.js';
import { publicBrandingRoutes } from './public-branding.js';

export const routes = new Hono();

routes.get('/api/health', (c) => c.json({ status: 'ok', message: 'Shad-SaaS API is running' }));
routes.get('/api/version', (c) => c.json({ version: '0.0.1-alpha' }));

// Webhooks أولاً (بدون auth)
routes.route('/api/webhooks', webhooksRoutes);

// ثم الباقي
routes.route('/api/auth', authRoutes);
routes.route('/api/me/notifications', meNotificationsRoutes);
routes.route('/api/me/chat', meChatRoutes);
routes.route('/api/me/tickets', meTicketsRoutes);
routes.route('/api/me', meRoutes);
routes.route('/api/admin/chat', adminChatRoutes);
routes.route('/api/admin/tickets', adminTicketsRoutes);
routes.route('/api/admin/settings', adminSettingsRoutes);
routes.route('/api/admin/themes', adminThemesRoutes);
routes.route('/api/admin', adminRoutes);
routes.route('/api/public/settings', publicSettingsRoutes);
routes.route('/api/public/theme', publicThemesRoutes);
routes.route('/api/public/branding', publicBrandingRoutes);
routes.route('/api/public', publicRoutes);
routes.route('/api/orders', ordersRoutes);
routes.route('/api/deposits', depositsRoutes);
