import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ForbiddenError } from '../../../../shared/errors/http-exceptions.js';

export function assertSuperAdmin(auth: AuthorizationContext): void {
  if (auth.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError();
  }
}
