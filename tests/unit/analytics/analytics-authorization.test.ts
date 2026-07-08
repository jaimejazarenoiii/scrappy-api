import { describe, expect, it } from 'vitest';
import { assertCanAccessAnalytics } from '../../../src/modules/analytics/domain/analytics-authorization.policy.js';
import { ForbiddenError } from '../../../src/shared/errors/http-exceptions.js';

describe('assertCanAccessAnalytics', () => {
  it('allows OWNER and MANAGER', () => {
    expect(() => assertCanAccessAnalytics('OWNER')).not.toThrow();
    expect(() => assertCanAccessAnalytics('MANAGER')).not.toThrow();
  });

  it('denies EMPLOYEE', () => {
    expect(() => assertCanAccessAnalytics('EMPLOYEE')).toThrow(ForbiddenError);
  });
});
