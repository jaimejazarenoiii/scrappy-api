import type { UserRole } from '../../../shared/policy/roles.js';
import { ForbiddenError } from '../../../shared/errors/http-exceptions.js';

const ALLOWED_ROLES: UserRole[] = ['OWNER', 'MANAGER'];

export function assertCanAccessReports(role: UserRole): void {
  if (!ALLOWED_ROLES.includes(role)) {
    throw new ForbiddenError();
  }
}
