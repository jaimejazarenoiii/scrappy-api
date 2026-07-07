import type { Request } from 'express';
import { UnauthenticatedError } from '../errors/http-exceptions.js';
import type { TenantContext } from './tenant-context.js';

export function getTenantContext(req: Request): TenantContext {
  if (!req.auth) {
    throw new UnauthenticatedError();
  }
  return {
    companyId: req.auth.companyId,
    userId: req.auth.userId,
    role: req.auth.role,
    sessionId: req.auth.sessionId,
    email: req.auth.email,
  };
}
