import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ForbiddenError } from '../../../../shared/errors/http-exceptions.js';

function isManagerOrOwner(auth: AuthorizationContext): boolean {
  return auth.role === 'OWNER' || auth.role === 'MANAGER';
}

export function assertCanListCompanyExpenses(auth: AuthorizationContext): void {
  if (!isManagerOrOwner(auth)) {
    throw new ForbiddenError('Only owners and managers can list company expenses.');
  }
}

export function assertCanArchiveExpense(auth: AuthorizationContext): void {
  if (!isManagerOrOwner(auth)) {
    throw new ForbiddenError('Only owners and managers can archive expenses.');
  }
}

export function assertCanViewExpense(auth: AuthorizationContext, opts: { isOwner: boolean }): void {
  if (isManagerOrOwner(auth)) return;
  if (!opts.isOwner) {
    throw new ForbiddenError('You can only view your own expenses.');
  }
}

export function assertCanEditExpense(auth: AuthorizationContext, opts: { isOwner: boolean }): void {
  if (isManagerOrOwner(auth)) return;
  if (!opts.isOwner) {
    throw new ForbiddenError('You can only edit your own expenses.');
  }
}

export function assertCanRecordExpense(
  auth: AuthorizationContext,
  opts: { isOwner: boolean },
): void {
  if (isManagerOrOwner(auth)) return;
  if (!opts.isOwner) {
    throw new ForbiddenError('You can only record your own draft expenses.');
  }
}

export function assertCanCancelExpense(
  auth: AuthorizationContext,
  opts: { isOwner: boolean; isRecorded: boolean },
): void {
  if (isManagerOrOwner(auth)) return;
  if (opts.isRecorded) {
    throw new ForbiddenError('Employees cannot cancel recorded expenses.');
  }
  if (!opts.isOwner) {
    throw new ForbiddenError('You can only cancel your own draft expenses.');
  }
}

export function assertCanManageAttachments(
  auth: AuthorizationContext,
  opts: { isOwner: boolean },
): void {
  if (isManagerOrOwner(auth)) return;
  if (!opts.isOwner) {
    throw new ForbiddenError('You can only manage attachments on your own expenses.');
  }
}
