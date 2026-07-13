import { describe, expect, it } from 'vitest';
import { assertCanResetPassword } from '../../../src/modules/user/application/policies/password-reset.policy.js';
import { ForbiddenError } from '../../../src/shared/errors/http-exceptions.js';

describe('assertCanResetPassword', () => {
  it('allows Owner to reset any role', () => {
    expect(() => assertCanResetPassword('OWNER', 'EMPLOYEE')).not.toThrow();
    expect(() => assertCanResetPassword('OWNER', 'MANAGER')).not.toThrow();
    expect(() => assertCanResetPassword('OWNER', 'OWNER')).not.toThrow();
  });

  it('allows Manager to reset Employee only', () => {
    expect(() => assertCanResetPassword('MANAGER', 'EMPLOYEE')).not.toThrow();
    expect(() => assertCanResetPassword('MANAGER', 'MANAGER')).toThrow(ForbiddenError);
    expect(() => assertCanResetPassword('MANAGER', 'OWNER')).toThrow(ForbiddenError);
  });

  it('forbids Employee from resetting anyone', () => {
    expect(() => assertCanResetPassword('EMPLOYEE', 'EMPLOYEE')).toThrow(ForbiddenError);
  });
});
