import { ForbiddenError } from '../../../../shared/errors/http-exceptions.js';
import type { UserRole } from '../../../../shared/policy/roles.js';

/**
 * Asserts the actor may assign the requested role when provisioning a login account.
 * Owners may assign any role; Managers may assign EMPLOYEE only (v1).
 */
export function assertCanAssignRole(actorRole: UserRole, targetRole: UserRole): void {
  if (actorRole === 'OWNER') return;
  if (actorRole === 'MANAGER' && targetRole === 'EMPLOYEE') return;
  throw new ForbiddenError('You are not allowed to assign this role.');
}
