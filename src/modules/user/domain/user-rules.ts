import { ForbiddenError, LifecycleConflictError } from '../../../shared/errors/http-exceptions.js';
import type { UserEntity } from './user.entity.js';

export function assertUserIsActive(user: UserEntity): void {
  if (!user.isActive()) {
    throw new LifecycleConflictError('User account is not active');
  }
}

export function assertOwnerRole(role: string): void {
  if (role !== 'OWNER') {
    throw new ForbiddenError('Only Owners can perform this action');
  }
}
