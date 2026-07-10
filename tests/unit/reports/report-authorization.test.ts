import { describe, expect, it } from 'vitest';
import { assertCanAccessReports } from '../../../src/modules/reports/domain/report-authorization.policy.js';
import { ForbiddenError } from '../../../src/shared/errors/http-exceptions.js';

describe('assertCanAccessReports', () => {
  it('allows OWNER and MANAGER', () => {
    expect(() => assertCanAccessReports('OWNER')).not.toThrow();
    expect(() => assertCanAccessReports('MANAGER')).not.toThrow();
  });

  it('denies EMPLOYEE', () => {
    expect(() => assertCanAccessReports('EMPLOYEE')).toThrow(ForbiddenError);
  });
});
