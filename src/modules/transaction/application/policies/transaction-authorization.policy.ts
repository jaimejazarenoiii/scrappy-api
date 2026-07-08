import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ForbiddenError } from '../../../../shared/errors/http-exceptions.js';

function isManagerOrOwner(auth: AuthorizationContext): boolean {
  return auth.role === 'OWNER' || auth.role === 'MANAGER';
}

/**
 * Only owners and managers may list all company transactions.
 */
export function assertCanListCompanyTransactions(auth: AuthorizationContext): void {
  if (!isManagerOrOwner(auth)) {
    throw new ForbiddenError('Only owners and managers can list all company transactions.');
  }
}

/**
 * Throws when an employee is not assigned to a transaction they are trying to access.
 */
export function assertEmployeeAssigned(isAssigned: boolean): void {
  if (!isAssigned) {
    throw new ForbiddenError('You are not assigned to this transaction.');
  }
}

/**
 * Owners and managers may view any company transaction; employees may only view assigned ones.
 */
export function assertCanViewTransaction(
  auth: AuthorizationContext,
  opts: { isAssigned: boolean },
): void {
  if (isManagerOrOwner(auth)) return;
  assertEmployeeAssigned(opts.isAssigned);
}

/**
 * Owners and managers may manage any draft; employees may only manage assigned drafts.
 */
export function assertCanManageDraft(
  auth: AuthorizationContext,
  opts: { isAssigned: boolean },
): void {
  if (isManagerOrOwner(auth)) return;
  assertEmployeeAssigned(opts.isAssigned);
}

export function assertCanFinish(auth: AuthorizationContext, opts: { isAssigned: boolean }): void {
  if (auth.role !== 'EMPLOYEE') {
    throw new ForbiddenError('Only employees can submit transactions for settlement.');
  }
  assertEmployeeAssigned(opts.isAssigned);
}

export function assertCanSettle(auth: AuthorizationContext): void {
  if (!isManagerOrOwner(auth)) {
    throw new ForbiddenError('Only owners and managers can settle transactions.');
  }
}

export function assertCanReturnToDraft(auth: AuthorizationContext): void {
  if (!isManagerOrOwner(auth)) {
    throw new ForbiddenError('Only owners and managers can return transactions to draft.');
  }
}

export function assertCanReopen(auth: AuthorizationContext): void {
  if (auth.role !== 'OWNER') {
    throw new ForbiddenError('Only owners can reopen paid transactions.');
  }
}

export function assertCanEditTransaction(
  auth: AuthorizationContext,
  opts: { isAssigned: boolean },
): void {
  if (isManagerOrOwner(auth)) return;
  assertEmployeeAssigned(opts.isAssigned);
}
