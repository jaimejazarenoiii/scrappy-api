import type { RequestHandler } from 'express';
import { PasswordChangeRequiredError } from '../shared/errors/http-exceptions.js';
import type { UserRepository } from '../modules/user/domain/user.repository.js';

function isAllowlisted(method: string, path: string): boolean {
  if (method === 'POST' && path === '/users/me/password') return true;
  if (method === 'GET' && path === '/users/me/password-status') return true;
  if (method === 'GET' && path === '/users/me') return true;
  return false;
}

/**
 * Blocks protected routes when the authenticated user must change their password.
 * Reads passwordChangeRequired from the database (not JWT claims).
 */
export function createPasswordChangeGateMiddleware(userRepository: UserRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      if (!req.auth) {
        next();
        return;
      }

      if (isAllowlisted(req.method.toUpperCase(), req.path)) {
        next();
        return;
      }

      const user = await userRepository.findById(req.auth.userId, req.auth.companyId);
      if (!user) {
        next();
        return;
      }

      if (user.passwordChangeRequired) {
        next(new PasswordChangeRequiredError());
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
