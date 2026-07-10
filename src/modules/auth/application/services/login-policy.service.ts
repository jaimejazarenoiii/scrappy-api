import {
  InvalidCredentialsError,
  LifecycleConflictError,
  ResourceNotFoundError,
} from '../../../../shared/errors/http-exceptions.js';
import type { CompanyEntity } from '../../../company/domain/company.entity.js';
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

export function assertValidLoginCompany(company: CompanyEntity | null): CompanyEntity {
  if (!company) {
    throw new ResourceNotFoundError('Company not found');
  }
  if (!company.isActive()) {
    throw new LifecycleConflictError('Company account is not active');
  }
  return company;
}
