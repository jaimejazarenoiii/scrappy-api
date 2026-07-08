import type { RequestHandler } from 'express';
import { UnauthenticatedError } from '../shared/errors/http-exceptions.js';
import type { TokenProvider } from '../shared/auth/token-provider.interface.js';
import { extractAccessToken } from '../shared/auth/extract-access-token.js';

export function createAuthenticationMiddleware(tokenProvider: TokenProvider): RequestHandler {
  return (req, _res, next) => {
    const token = extractAccessToken(req);
    if (!token) {
      next(new UnauthenticatedError());
      return;
    }
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
