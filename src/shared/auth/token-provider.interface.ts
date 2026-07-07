import type { UserRole } from '../policy/roles.js';

export interface AuthTokenPayload {
  sub: string;
  companyId: string;
  role: UserRole;
  email: string;
  sessionId: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TokenProvider {
  signAccessToken(payload: AuthTokenPayload): string;
  signRefreshToken(payload: AuthTokenPayload): string;
  verifyAccessToken(token: string): AuthTokenPayload;
  verifyRefreshToken(token: string): AuthTokenPayload;
  getAccessTokenTtlSeconds(): number;
}
