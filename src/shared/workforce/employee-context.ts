import { ForbiddenError } from '../errors/http-exceptions.js';
import type { UserEntity } from '../../modules/user/domain/user.entity.js';

/**
 * Resolves the acting employee ID from an authenticated user profile.
 * @throws ForbiddenError when the user has no linked employee profile.
 */
export function resolveActingEmployeeId(user: UserEntity): string {
  const employeeId = user.employeeId;
  if (!employeeId) {
    throw new ForbiddenError('A linked employee profile is required for this action.');
  }
  return employeeId;
}
