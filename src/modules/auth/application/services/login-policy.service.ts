import {
  InvalidCredentialsError,
  LifecycleConflictError,
} from '../../../../shared/errors/http-exceptions.js';
import type { UserEntity } from '../../../user/domain/user.entity.js';

export function assertValidLoginUser(user: UserEntity | null): UserEntity {
  if (!user) {
    throw new InvalidCredentialsError();
  }
  if (!user.isActive()) {
    throw new LifecycleConflictError('User account is not active');
  }
  return user;
}
