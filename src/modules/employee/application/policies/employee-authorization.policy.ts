import type { TenantContext } from '../../../../shared/tenant/tenant-context.js';
import { ForbiddenError } from '../../../../shared/errors/http-exceptions.js';

export function assertCanManageEmployees(context: TenantContext): void {
  if (!['OWNER', 'MANAGER'].includes(context.role)) {
    throw new ForbiddenError('Only Owners and Managers can manage employees');
  }
}
