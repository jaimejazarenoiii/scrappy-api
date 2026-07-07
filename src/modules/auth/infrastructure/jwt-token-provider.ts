import jwt, { type SignOptions } from 'jsonwebtoken';
import { loadConfig } from '../../../config/index.js';
import type {
  AuthTokenPayload,
  TokenProvider,
} from '../../../shared/auth/token-provider.interface.js';

function toSeconds(value: string): number {
  if (value.endsWith('m')) return Number.parseInt(value.slice(0, -1), 10) * 60;
  if (value.endsWith('h')) return Number.parseInt(value.slice(0, -1), 10) * 3600;
  if (value.endsWith('d')) return Number.parseInt(value.slice(0, -1), 10) * 86400;
  return Number.parseInt(value, 10);
}

function sanitizePayload(payload: AuthTokenPayload): AuthTokenPayload {
  return {
    sub: payload.sub,
    companyId: payload.companyId,
    role: payload.role,
    email: payload.email,
    sessionId: payload.sessionId,
  };
}

export class JwtTokenProvider implements TokenProvider {
  signAccessToken(payload: AuthTokenPayload): string {
    const config = loadConfig();
    return jwt.sign(sanitizePayload(payload), config.JWT_ACCESS_SECRET, {
      expiresIn: config.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
    });
  }

  signRefreshToken(payload: AuthTokenPayload): string {
    const config = loadConfig();
    return jwt.sign(sanitizePayload(payload), config.JWT_REFRESH_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
    });
  }

  verifyAccessToken(token: string): AuthTokenPayload {
    return jwt.verify(token, loadConfig().JWT_ACCESS_SECRET) as AuthTokenPayload;
  }

  verifyRefreshToken(token: string): AuthTokenPayload {
    return jwt.verify(token, loadConfig().JWT_REFRESH_SECRET) as AuthTokenPayload;
  }

  getAccessTokenTtlSeconds(): number {
    return toSeconds(loadConfig().JWT_ACCESS_EXPIRES_IN);
  }
}
