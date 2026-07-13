import type { AuditEvent } from '../../../../shared/audit/audit-event.js';
import { emitStructuredAudit } from '../../../../shared/audit/emit-structured-audit.js';

export const EXPENSE_AUDIT_ACTIONS = {
  CREATED: 'expense.created',
  UPDATED: 'expense.updated',
  RECORDED: 'expense.recorded',
  CANCELLED: 'expense.cancelled',
  ARCHIVED: 'expense.archived',
  ATTACHMENT_ADDED: 'expense.attachment_added',
  ATTACHMENT_REMOVED: 'expense.attachment_removed',
} as const;

export function logExpenseAudit(event: AuditEvent): void {
  emitStructuredAudit('expense audit event', event);
}
