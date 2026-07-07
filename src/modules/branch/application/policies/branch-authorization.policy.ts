import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ForbiddenError } from '../../../../shared/errors/http-exceptions.js';

export function assertCanManageBranches(auth: AuthorizationContext): void {
  if (auth.role !== 'OWNER' && auth.role !== 'MANAGER') {
    throw new ForbiddenError('Only owners and managers can manage branches');
  }
}

export function assertCanViewBranches(_auth: AuthorizationContext): void {
  // All authenticated company users may view branches
}
