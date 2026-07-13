import type { AuditEvent } from '../../../../shared/audit/audit-event.js';
import { emitStructuredAudit } from '../../../../shared/audit/emit-structured-audit.js';

export const SUBSCRIPTION_AUDIT_ACTIONS = {
  CREATED: 'subscription.created',
  RENEWED: 'subscription.renewed',
  EXPIRED: 'subscription.expired',
  SUSPENDED: 'subscription.suspended',
} as const;

export function logSubscriptionAudit(event: AuditEvent): void {
  emitStructuredAudit('subscription audit event', event);
}
