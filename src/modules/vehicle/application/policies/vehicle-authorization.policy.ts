import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ForbiddenError } from '../../../../shared/errors/http-exceptions.js';

export function assertCanManageVehicles(auth: AuthorizationContext): void {
  if (auth.role !== 'OWNER' && auth.role !== 'MANAGER') {
    throw new ForbiddenError('Only owners and managers can manage vehicles');
  }
}

export function assertCanViewVehicles(_auth: AuthorizationContext): void {
  // All authenticated company users may view vehicles
}
