import { describe, expect, it } from 'vitest';
import { assertCanManageEmployees } from '../../../src/modules/employee/application/policies/employee-authorization.policy.js';

describe('employee policy', () => {
  it('allows owners and managers', () => {
    expect(() =>
      assertCanManageEmployees({ companyId: 'c1', userId: 'u1', role: 'OWNER' }),
    ).not.toThrow();
    expect(() =>
      assertCanManageEmployees({ companyId: 'c1', userId: 'u1', role: 'MANAGER' }),
    ).not.toThrow();
  });
});
