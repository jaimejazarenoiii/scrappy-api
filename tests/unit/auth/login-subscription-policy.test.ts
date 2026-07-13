import { describe, expect, it } from 'vitest';
import { CompanyEntity } from '../../../src/modules/company/domain/company.entity.js';
import {
  assertSubscriptionAllowsLogin,
  assertValidAdminLoginUser,
  assertValidLoginUser,
} from '../../../src/modules/auth/application/services/login-policy.service.js';
import { UserEntity } from '../../../src/modules/user/domain/user.entity.js';
import {
  InvalidCredentialsError,
  LifecycleConflictError,
  SubscriptionInactiveError,
} from '../../../src/shared/errors/http-exceptions.js';

function company(
  subscriptionStatus: 'TRIAL' | 'ACTIVE' | 'GRACE_PERIOD' | 'EXPIRED' | 'SUSPENDED',
) {
  return CompanyEntity.create({
    id: 'c1',
    name: 'Acme',
    logoUrl: null,
    contactNumber: null,
    email: null,
    address: null,
    status: 'ACTIVE',
    subscriptionStatus,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });
}

function user(role: 'OWNER' | 'SUPER_ADMIN', status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE') {
  return UserEntity.create({
    id: 'u1',
    companyId: 'c1',
    employeeId: null,
    email: 'u@test.com',
    passwordHash: 'hash',
    role,
    passwordChangeRequired: false,
    passwordChangedAt: null,
    lastLoginAt: null,
    status,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });
}

describe('login subscription policy', () => {
  it('allows TRIAL, ACTIVE, GRACE_PERIOD for tenant roles', () => {
    for (const status of ['TRIAL', 'ACTIVE', 'GRACE_PERIOD'] as const) {
      expect(() => assertSubscriptionAllowsLogin(company(status), 'OWNER')).not.toThrow();
    }
  });

  it('denies EXPIRED and SUSPENDED for tenant roles', () => {
    for (const status of ['EXPIRED', 'SUSPENDED'] as const) {
      expect(() => assertSubscriptionAllowsLogin(company(status), 'OWNER')).toThrow(
        SubscriptionInactiveError,
      );
    }
  });

  it('allows SUPER_ADMIN regardless of subscription status (admin login path)', () => {
    expect(() => assertSubscriptionAllowsLogin(company('EXPIRED'), 'SUPER_ADMIN')).not.toThrow();
    expect(() => assertSubscriptionAllowsLogin(company('SUSPENDED'), 'SUPER_ADMIN')).not.toThrow();
  });

  it('rejects SUPER_ADMIN on tenant login with invalid credentials', () => {
    expect(() => assertValidLoginUser(user('SUPER_ADMIN'))).toThrow(InvalidCredentialsError);
  });

  it('admin login accepts active SUPER_ADMIN only', () => {
    expect(assertValidAdminLoginUser(user('SUPER_ADMIN')).role).toBe('SUPER_ADMIN');
    expect(() => assertValidAdminLoginUser(user('OWNER'))).toThrow(InvalidCredentialsError);
    expect(() => assertValidAdminLoginUser(user('SUPER_ADMIN', 'INACTIVE'))).toThrow(
      LifecycleConflictError,
    );
  });

  it('still validates user active after subscription gate in use case order', () => {
    expect(() => assertValidLoginUser(user('OWNER', 'INACTIVE'))).toThrow(LifecycleConflictError);
  });
});
