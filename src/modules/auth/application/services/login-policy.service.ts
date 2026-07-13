import {
  InvalidCredentialsError,
  LifecycleConflictError,
  ResourceNotFoundError,
  SubscriptionInactiveError,
} from '../../../../shared/errors/http-exceptions.js';
import type { UserRole } from '../../../../shared/policy/roles.js';
import type { CompanyEntity } from '../../../company/domain/company.entity.js';
import { isAllowedSubscriptionStatus } from '../../../company/domain/company-subscription-status.js';
import type { UserEntity } from '../../../user/domain/user.entity.js';

export function assertValidLoginUser(user: UserEntity | null): UserEntity {
  if (!user) {
    throw new InvalidCredentialsError();
  }
  // Tenant login must not admit platform admins (separate admin login).
  // Same error as bad password so we do not reveal role.
  if (user.role === 'SUPER_ADMIN') {
    throw new InvalidCredentialsError();
  }
  if (!user.isActive()) {
    throw new LifecycleConflictError('User account is not active');
  }
  return user;
}

/** Admin login: only active SUPER_ADMIN. Other roles look like bad credentials. */
export function assertValidAdminLoginUser(user: UserEntity | null): UserEntity {
  if (!user) {
    throw new InvalidCredentialsError();
  }
  if (user.role !== 'SUPER_ADMIN') {
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

export function assertSubscriptionAllowsLogin(
  company: CompanyEntity,
  role: UserRole,
): CompanyEntity {
  if (role === 'SUPER_ADMIN') {
    return company;
  }
  if (!isAllowedSubscriptionStatus(company.subscriptionStatus)) {
    throw new SubscriptionInactiveError();
  }
  return company;
}
