import type { AuditEvent } from '../../../../shared/audit/audit-event.js';
import { getLogger } from '../../../../config/logger.js';

export const TRANSACTION_AUDIT_ACTIONS = {
  CREATED: 'transaction.created',
  UPDATED: 'transaction.updated',
  CANCELLED: 'transaction.cancelled',
  ARCHIVED: 'transaction.archived',
  FINISHED: 'transaction.finished',
  RETURNED_TO_DRAFT: 'transaction.returned_to_draft',
  SETTLED: 'transaction.settled',
  REOPENED: 'transaction.reopened',
  ITEM_ADDED: 'transaction.item_added',
  ITEM_UPDATED: 'transaction.item_updated',
  ITEM_REMOVED: 'transaction.item_removed',
  ATTACHMENT_ADDED: 'transaction.attachment_added',
  ATTACHMENT_REMOVED: 'transaction.attachment_removed',
} as const;

export type TransactionAuditAction =
  (typeof TRANSACTION_AUDIT_ACTIONS)[keyof typeof TRANSACTION_AUDIT_ACTIONS];

export function logTransactionAudit(event: AuditEvent): void {
  getLogger().info({ audit: event }, 'transaction audit event');
}
