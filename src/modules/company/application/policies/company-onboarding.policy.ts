import { ForbiddenError } from '../../../../shared/errors/http-exceptions.js';
import type { TenantContext } from '../../../../shared/tenant/tenant-context.js';

export function assertOwnerCanManageCompany(context: TenantContext): void {
  if (context.role !== 'OWNER') {
    throw new ForbiddenError('Only Owners can manage Company information');
  }
}
