import { describe, expect, it } from 'vitest';
import { assertCanAssignRole } from '../../../src/modules/employee/application/policies/account-provisioning.policy.js';
import { ForbiddenError } from '../../../src/shared/errors/http-exceptions.js';

describe('account-provisioning.policy', () => {
  it('allows owner to assign any role', () => {
    expect(() => assertCanAssignRole('OWNER', 'OWNER')).not.toThrow();
    expect(() => assertCanAssignRole('OWNER', 'MANAGER')).not.toThrow();
    expect(() => assertCanAssignRole('OWNER', 'EMPLOYEE')).not.toThrow();
  });

  it('allows manager to assign employee only', () => {
    expect(() => assertCanAssignRole('MANAGER', 'EMPLOYEE')).not.toThrow();
    expect(() => assertCanAssignRole('MANAGER', 'MANAGER')).toThrow(ForbiddenError);
    expect(() => assertCanAssignRole('MANAGER', 'OWNER')).toThrow(ForbiddenError);
  });

  it('forbids employee actors from assigning roles', () => {
    expect(() => assertCanAssignRole('EMPLOYEE', 'EMPLOYEE')).toThrow(ForbiddenError);
  });

  it('allows SUPER_ADMIN to assign tenant roles only', () => {
    expect(() => assertCanAssignRole('SUPER_ADMIN', 'OWNER')).not.toThrow();
    expect(() => assertCanAssignRole('SUPER_ADMIN', 'MANAGER')).not.toThrow();
    expect(() => assertCanAssignRole('SUPER_ADMIN', 'EMPLOYEE')).not.toThrow();
    expect(() => assertCanAssignRole('SUPER_ADMIN', 'SUPER_ADMIN')).toThrow(ForbiddenError);
  });
});
