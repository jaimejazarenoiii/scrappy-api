import { ForbiddenError } from '../errors/http-exceptions.js';
import type { UserRole } from '../policy/roles.js';
import type { UserEntity } from '../../modules/user/domain/user.entity.js';

/**
 * Managers and employees must track attendance and may request leave.
 * Owners are exempt from self-service attendance and leave tracking.
 */
export function isWorkforceTrackingRequired(role: UserRole): boolean {
  return role === 'MANAGER' || role === 'EMPLOYEE';
}

export function assertWorkforceTrackingRequired(user: UserEntity): void {
  if (!isWorkforceTrackingRequired(user.role)) {
    throw new ForbiddenError('Company owners are not required to track attendance or leave.');
  }
}

export function canManageWorkforceOnBehalf(role: UserRole): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}
