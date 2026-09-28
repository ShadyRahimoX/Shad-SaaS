import jwt from 'jsonwebtoken';

const getAccessSecret = (): string => {
  return process.env.JWT_SECRET || 'fallback-access-secret-32-bytes-shad-saas';
};

const getRefreshSecret = (): string => {
  return process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-32-bytes-shad-saas';
};

export interface TokenPayload {
  userId: string;
  email?: string;
  username?: string;
  [key: string]: unknown;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, getAccessSecret(), {
    expiresIn: '15m',
  });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, getRefreshSecret(), {
    expiresIn: '30d',
  });
}

export function verifyAccessToken<T = TokenPayload>(token: string): T {
  return jwt.verify(token, getAccessSecret()) as T;
}

export function verifyRefreshToken<T = TokenPayload>(token: string): T {
  return jwt.verify(token, getRefreshSecret()) as T;
}
