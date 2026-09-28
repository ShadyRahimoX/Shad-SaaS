import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { registerSchema, loginSchema } from '@shad-saas/validators';
import { signAccessToken, signRefreshToken, verifyRefreshToken, generateUuid } from '@shad-saas/utils';
import { ok, err } from '../lib/response.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { requireAuth, type AuthVariables } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rate-limit.js';

export const authRoutes = new Hono<{ Variables: AuthVariables }>();

// Apply rate limiting (5 attempts/min) to login and register routes
authRoutes.use('/login', rateLimiter(5, 60 * 1000));
authRoutes.use('/register', rateLimiter(5, 60 * 1000));

interface StoredUser {
  id: string;
  displayId: number;
  username: string;
  email: string;
  passwordHash: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  country: string | null;
  avatarUrl: string | null;
  vipLevelId: string | null;
  balanceUsd: string;
  referralCode: string;
  referredBy: string | null;
  emailVerified: boolean;
  banned: boolean;
  totpSecret: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface StoredSession {
  id: string;
  userId: string;
  refreshTokenHash: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

// In-memory repositories for robust sandbox operation
const usersStore = new Map<string, StoredUser>();
const sessionsStore = new Map<string, StoredSession>();
let displayIdCounter = 1001;

function sanitizeUser(user: StoredUser) {
  const { passwordHash: _, totpSecret: __, ...safeUser } = user;
  return safeUser;
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

  // Check duplicate username or email
  for (const user of usersStore.values()) {
    if (user.username.toLowerCase() === username.toLowerCase() || user.email.toLowerCase() === email.toLowerCase()) {
      return err(c, 'USER_EXISTS', 'Username or email already exists', 409);
    }
  }

  const hashedPassword = await hashPassword(password);
  const userId = generateUuid();
  const referralCode = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const newUser: StoredUser = {
    id: userId,
    displayId: displayIdCounter++,
    username,
    email,
    passwordHash: hashedPassword,
    firstName: firstName || null,
    lastName: lastName || null,
    phone: phone || null,
    country: country || null,
    avatarUrl: null,
    vipLevelId: null,
    balanceUsd: '0.00',
    referralCode,
    referredBy: null,
    emailVerified: false,
    banned: false,
    totpSecret: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  usersStore.set(userId, newUser);

  const accessToken = signAccessToken({ userId: newUser.id, email: newUser.email, username: newUser.username });
  const refreshToken = signRefreshToken({ userId: newUser.id });

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

  let foundUser: StoredUser | undefined;
  for (const user of usersStore.values()) {
    if (
      user.username.toLowerCase() === usernameOrEmail.toLowerCase() ||
      user.email.toLowerCase() === usernameOrEmail.toLowerCase()
    ) {
      foundUser = user;
      break;
    }
  }

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

  foundUser.lastLoginAt = new Date();
  foundUser.updatedAt = new Date();

  const accessToken = signAccessToken({
    userId: foundUser.id,
    email: foundUser.email,
    username: foundUser.username,
  });
  const refreshToken = signRefreshToken({ userId: foundUser.id });

  const sessionId = generateUuid();
  const session: StoredSession = {
    id: sessionId,
    userId: foundUser.id,
    refreshTokenHash: refreshToken,
    userAgent: c.req.header('user-agent') || null,
    ipAddress: c.req.header('x-forwarded-for') || null,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    revokedAt: null,
    createdAt: new Date(),
  };
  sessionsStore.set(sessionId, session);

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
    const user = usersStore.get(payload.userId);
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
    return err(c, 'UNAUTHORIZED', 'Invalid or expired refresh token', 401);
  }
});

// POST /api/auth/logout
authRoutes.post('/logout', async (c) => {
  const token = getCookie(c, 'refreshToken');
  if (token) {
    for (const session of sessionsStore.values()) {
      if (session.refreshTokenHash === token) {
        session.revokedAt = new Date();
      }
    }
  }

  deleteCookie(c, 'refreshToken', { path: '/' });
  return c.body(null, 204);
});

// GET /api/auth/me (protected)
authRoutes.get('/me', requireAuth, async (c) => {
  const userId = c.get('userId');
  const user = usersStore.get(userId);

  if (!user) {
    return err(c, 'NOT_FOUND', 'User not found', 404);
  }

  return ok(c, sanitizeUser(user));
});
