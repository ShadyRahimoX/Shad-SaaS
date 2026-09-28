import { createMiddleware } from 'hono/factory';
import { verifyAccessToken, type TokenPayload } from '@shad-saas/utils';
import { err } from '../lib/response.js';

export type AuthVariables = {
  userId: string;
  userEmail?: string;
};

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return err(c, 'UNAUTHORIZED', 'Missing or invalid authorization header', 401);
  }

  const token = authHeader.substring(7).trim();

  try {
    const payload = verifyAccessToken<TokenPayload>(token);
    if (!payload || !payload.userId) {
      return err(c, 'UNAUTHORIZED', 'Invalid token payload', 401);
    }

    c.set('userId', payload.userId);
    c.set('userEmail', payload.email);
    return next();
  } catch (error) {
    return err(c, 'UNAUTHORIZED', 'Invalid or expired token', 401);
  }
});
