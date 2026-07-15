import { describe, expect, it } from 'vitest';
import {
  isPlatformOnlyActivityLog,
  shouldHideActivityLogFromTenant,
} from '../../../src/modules/activity-log/domain/platform-activity-log.policy.js';

describe('platform activity log policy', () => {
  it('flags admin and platform auth actions', () => {
    expect(
      isPlatformOnlyActivityLog({
        action: 'admin.account_created',
        userId: 'u1',
      }),
    ).toBe(true);
    expect(
      isPlatformOnlyActivityLog({
        action: 'auth.admin_login',
        userId: 'u1',
      }),
    ).toBe(true);
  });

  it('flags super admin actors and platform password resets', () => {
    expect(
      isPlatformOnlyActivityLog({
        action: 'subscription.suspended',
        userId: 'u1',
        metadata: { actorRole: 'SUPER_ADMIN' },
      }),
    ).toBe(true);
    expect(
      isPlatformOnlyActivityLog({
        action: 'user.password_admin_reset',
        userId: 'u1',
        metadata: { source: 'admin.company_account' },
      }),
    ).toBe(true);
  });

  it('keeps tenant business actions visible', () => {
    expect(
      isPlatformOnlyActivityLog({
        action: 'transaction.settled',
        userId: 'u1',
        metadata: { actorRole: 'MANAGER' },
      }),
    ).toBe(false);
    expect(
      isPlatformOnlyActivityLog({
        action: 'user.password_admin_reset',
        userId: 'u1',
        metadata: { employeeId: 'emp-1' },
      }),
    ).toBe(false);
  });

  it('hides logs performed by known super admin user ids', () => {
    expect(
      shouldHideActivityLogFromTenant(
        { action: 'company.updated', userId: 'super-1' },
        new Set(['super-1']),
      ),
    ).toBe(true);
  });
});
