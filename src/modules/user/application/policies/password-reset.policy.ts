import { ForbiddenError } from '../../../../shared/errors/http-exceptions.js';
import type { UserRole } from '../../../../shared/policy/roles.js';

/**
 * Asserts the actor may reset the target user's password.
 * Owners may reset any role; Managers may reset EMPLOYEE only.
 */
export function assertCanResetPassword(actorRole: UserRole, targetRole: UserRole): void {
  if (actorRole === 'OWNER') return;
  if (actorRole === 'MANAGER' && targetRole === 'EMPLOYEE') return;
  throw new ForbiddenError('You are not allowed to reset this user password.');
}
