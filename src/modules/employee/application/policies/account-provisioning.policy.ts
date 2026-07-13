import { ForbiddenError } from '../../../../shared/errors/http-exceptions.js';
import type { UserRole } from '../../../../shared/policy/roles.js';

const TENANT_ASSIGNABLE: UserRole[] = ['OWNER', 'MANAGER', 'EMPLOYEE'];

/**
 * Asserts the actor may assign the requested role when provisioning a login account.
 * Owners may assign any tenant role; Managers may assign EMPLOYEE only (v1).
 * SUPER_ADMIN may assign OWNER | MANAGER | EMPLOYEE (never SUPER_ADMIN).
 */
export function assertCanAssignRole(actorRole: UserRole, targetRole: UserRole): void {
  if (actorRole === 'SUPER_ADMIN' && TENANT_ASSIGNABLE.includes(targetRole)) return;
  if (actorRole === 'OWNER' && TENANT_ASSIGNABLE.includes(targetRole)) return;
  if (actorRole === 'MANAGER' && targetRole === 'EMPLOYEE') return;
  throw new ForbiddenError('You are not allowed to assign this role.');
}
