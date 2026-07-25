import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ForbiddenError } from '../../../../shared/errors/http-exceptions.js';

const READ_ROLES = new Set(['OWNER', 'MANAGER', 'SUPER_ADMIN']);

export function assertCanTransmitLocation(auth: AuthorizationContext): void {
  if (auth.role !== 'EMPLOYEE') {
    throw new ForbiddenError('Only employees may transmit GPS locations.');
  }
}

export function assertCanViewTracking(auth: AuthorizationContext): void {
  if (!READ_ROLES.has(auth.role)) {
    throw new ForbiddenError('You do not have access to live tracking.');
  }
}

export function assertCanReadRouteHistory(auth: AuthorizationContext): void {
  if (auth.role === 'EMPLOYEE') {
    throw new ForbiddenError('Employees may not view route history.');
  }
  assertCanViewTracking(auth);
}

export function assertCanViewEmployeeLocation(
  auth: AuthorizationContext,
  targetEmployeeId: string,
  resolvedEmployeeId?: string,
): void {
  if (auth.role === 'EMPLOYEE') {
    if (!resolvedEmployeeId || resolvedEmployeeId !== targetEmployeeId) {
      throw new ForbiddenError('Employees may not view other employees locations.');
    }
    return;
  }
  assertCanViewTracking(auth);
}

export function assertSuperAdmin(auth: AuthorizationContext): void {
  if (auth.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Super Admin access is required.');
  }
}
