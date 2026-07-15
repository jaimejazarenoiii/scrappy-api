import type { Prisma } from '@prisma/client';
import { shouldHideActivityLogFromTenant } from '../domain/platform-activity-log.policy.js';

export function buildTenantActivityLogVisibilityFilter(
  superAdminUserIds: readonly string[],
): Prisma.ActivityLogWhereInput {
  return {
    NOT: {
      OR: [
        { action: { startsWith: 'admin.' } },
        { action: 'auth.admin_login' },
        { metadata: { path: ['actorRole'], equals: 'SUPER_ADMIN' } },
        { metadata: { path: ['role'], equals: 'SUPER_ADMIN' } },
        {
          AND: [
            { action: 'user.password_admin_reset' },
            { metadata: { path: ['source'], equals: 'admin.company_account' } },
          ],
        },
        ...(superAdminUserIds.length > 0 ? [{ userId: { in: [...superAdminUserIds] } }] : []),
      ],
    },
  };
}

export function isVisibleTenantActivityLog(
  log: {
    action: string;
    userId: string;
    metadata?: Record<string, unknown> | null;
  },
  superAdminUserIds?: ReadonlySet<string>,
): boolean {
  return !shouldHideActivityLogFromTenant(log, superAdminUserIds);
}
