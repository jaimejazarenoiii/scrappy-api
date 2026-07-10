import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type { UserRole } from '../../../../shared/policy/roles.js';
import { ForbiddenError } from '../../../../shared/errors/http-exceptions.js';

const COMPANY_LIST_ROLES: UserRole[] = ['OWNER', 'MANAGER'];

function isManagerOrOwner(auth: AuthorizationContext): boolean {
  return auth.role === 'OWNER' || auth.role === 'MANAGER';
}

export function assertCanListCompanyTrips(role: UserRole): void {
  if (!COMPANY_LIST_ROLES.includes(role)) {
    throw new ForbiddenError();
  }
}

export function assertCanManageTrips(role: UserRole): void {
  assertCanListCompanyTrips(role);
}

export function assertEmployeeIsTripMember(isMember: boolean): void {
  if (!isMember) {
    throw new ForbiddenError('You are not assigned to this trip.');
  }
}

export function assertCanViewTrip(auth: AuthorizationContext, opts: { isMember: boolean }): void {
  if (isManagerOrOwner(auth)) return;
  assertEmployeeIsTripMember(opts.isMember);
}
