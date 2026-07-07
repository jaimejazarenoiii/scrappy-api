import type { RequestHandler } from 'express';
import type { UserRole } from '../shared/policy/roles.js';
import { ForbiddenError, UnauthenticatedError } from '../shared/errors/http-exceptions.js';

export function authorize(allowedRoles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      next(new UnauthenticatedError());
      return;
    }
    if (!allowedRoles.includes(req.auth.role)) {
      next(new ForbiddenError());
      return;
    }
    next();
  };
}
