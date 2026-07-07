import type { RequestHandler } from 'express';
import { UnauthenticatedError } from '../shared/errors/http-exceptions.js';
import type { TokenProvider } from '../shared/auth/token-provider.interface.js';

export function createAuthenticationMiddleware(tokenProvider: TokenProvider): RequestHandler {
  return (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      next(new UnauthenticatedError());
      return;
    }
    const token = header.replace('Bearer ', '');
    try {
      const payload = tokenProvider.verifyAccessToken(token);
      req.auth = {
        userId: payload.sub,
        companyId: payload.companyId,
        role: payload.role,
        sessionId: payload.sessionId,
        email: payload.email,
      };
      next();
    } catch {
      next(new UnauthenticatedError());
    }
  };
}
