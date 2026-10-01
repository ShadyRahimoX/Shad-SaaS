import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { registerSchema, loginSchema } from '@shad-saas/validators';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@shad-saas/utils';
import { db, users, sessions } from '@shad-saas/db';
import { eq, or } from 'drizzle-orm';
import { ok, err } from '../lib/response.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { requireAuth, type AuthVariables } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rate-limit.js';

export const authRoutes = new Hono<{ Variables: AuthVariables }>();

// Rate limit authentication routes (5 attempts per minute)
authRoutes.use('/login', rateLimiter(5, 60 * 1000));
authRoutes.use('/register', rateLimiter(5, 60 * 1000));

function sanitizeUser(user: typeof users.$inferSelect) {
  const { passwordHash: _hash, totpSecret: _totp, ...safe } = user;
  return safe;
}

// POST /api/auth/register
authRoutes.post('/register', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) {
    return err(c, 'INVALID_BODY', 'Invalid JSON body provided', 400);
  }

  const result = registerSchema.safeParse(body);
  if (!result.success) {
    return err(c, 'VALIDATION_ERROR', result.error.errors.map((e) => e.message).join(', '), 400);
  }

  const { username, email, password, firstName, lastName, phone, country } = result.data;

  try {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(or(eq(users.username, username), eq(users.email, email)))
      .limit(1);

    if (existing.length > 0) {
      return err(c, 'USER_EXISTS', 'Username or email already exists', 409);
    }

    const hashedPassword = await hashPassword(password);
    const referralCode = 'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const { newUser, accessToken, refreshToken } = await db.transaction(async (tx) => {
      const [createdUser] = await tx
        .insert(users)
        .values({
          username,
          email,
          passwordHash: hashedPassword,
          firstName: firstName || null,
          lastName: lastName || null,
          phone: phone || null,
          country: country || null,
          referralCode,
          balanceUsd: '0.00',
        })
        .returning();

      const accessTok = signAccessToken({
        userId: createdUser.id,
        email: createdUser.email,
        username: createdUser.username,
      });
      const refreshTok = signRefreshToken({ userId: createdUser.id });

      const refreshTokenHash = await hashPassword(refreshTok);

      await tx.insert(sessions).values({
        userId: createdUser.id,
        refreshTokenHash,
        userAgent: c.req.header('user-agent') || null,
        ipAddress: c.req.header('x-forwarded-for') || null,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      return { newUser: createdUser, accessToken: accessTok, refreshToken: refreshTok };
    });

    setCookie(c, 'refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return ok(
      c,
      {
        user: sanitizeUser(newUser),
        accessToken,
        refreshToken,
      },
      201
    );
  } catch (error) {
    console.error('Registration database error:', error);
    return err(c, 'DB_ERROR', 'Database error', 500);
  }
});

// POST /api/auth/login
authRoutes.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) {
    return err(c, 'INVALID_BODY', 'Invalid JSON body provided', 400);
  }

  const result = loginSchema.safeParse(body);
  if (!result.success) {
    return err(c, 'VALIDATION_ERROR', result.error.errors.map((e) => e.message).join(', '), 400);
  }

  const { usernameOrEmail, password } = result.data;

  try {
    const [foundUser] = await db
      .select()
      .from(users)
      .where(or(eq(users.username, usernameOrEmail), eq(users.email, usernameOrEmail)))
      .limit(1);

    if (!foundUser) {
      return err(c, 'INVALID_CREDENTIALS', 'Invalid username or password', 401);
    }

    const isPasswordValid = await verifyPassword(password, foundUser.passwordHash);
    if (!isPasswordValid) {
      return err(c, 'INVALID_CREDENTIALS', 'Invalid username or password', 401);
    }

    if (foundUser.banned) {
      return err(c, 'ACCOUNT_BANNED', 'Your account has been banned', 403);
    }

    await db
      .update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, foundUser.id));

    const accessToken = signAccessToken({
      userId: foundUser.id,
      email: foundUser.email,
      username: foundUser.username,
    });
    const refreshToken = signRefreshToken({ userId: foundUser.id });

    const refreshTokenHash = await hashPassword(refreshToken);

    await db.insert(sessions).values({
      userId: foundUser.id,
      refreshTokenHash,
      userAgent: c.req.header('user-agent') || null,
      ipAddress: c.req.header('x-forwarded-for') || null,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    setCookie(c, 'refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return ok(c, {
      user: sanitizeUser(foundUser),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login database error:', error);
    return err(c, 'DB_ERROR', 'Database error', 500);
  }
});

// POST /api/auth/refresh
authRoutes.post('/refresh', async (c) => {
  const cookieToken = getCookie(c, 'refreshToken');
  const body = await c.req.json().catch(() => ({}));
  const token = cookieToken || body.refreshToken;

  if (!token) {
    return err(c, 'UNAUTHORIZED', 'No refresh token provided', 401);
  }

  try {
    const payload = verifyRefreshToken<{ userId: string }>(token);
    if (!payload?.userId) {
      return err(c, 'UNAUTHORIZED', 'Invalid or expired refresh token', 401);
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user || user.banned) {
      return err(c, 'UNAUTHORIZED', 'User not found or banned', 401);
    }

    const newAccessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    return ok(c, { accessToken: newAccessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    return err(c, 'UNAUTHORIZED', 'Invalid or expired refresh token', 401);
  }
});

// POST /api/auth/logout
authRoutes.post('/logout', async (c) => {
  const token = getCookie(c, 'refreshToken');
  if (token) {
    try {
      const payload = verifyRefreshToken<{ userId: string }>(token);
      if (payload?.userId) {
        await db
          .update(sessions)
          .set({ revokedAt: new Date() })
          .where(eq(sessions.userId, payload.userId));
      }
    } catch {
      // Ignore invalid or expired token during logout
    }
  }

  deleteCookie(c, 'refreshToken', { path: '/' });
  return c.body(null, 204);
});

// GET /api/auth/me (protected)
authRoutes.get('/me', requireAuth, async (c) => {
  const userId = c.get('userId');

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return err(c, 'NOT_FOUND', 'User not found', 404);
    }

    return ok(c, sanitizeUser(user));
  } catch (error) {
    console.error('Fetch user database error:', error);
    return err(c, 'DB_ERROR', 'Database error', 500);
  }
});
