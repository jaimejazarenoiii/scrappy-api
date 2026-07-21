import type { AuditEvent } from '../../../../shared/audit/audit-event.js';
import { emitStructuredAudit } from '../../../../shared/audit/emit-structured-audit.js';

export const TRACKING_AUDIT_ACTIONS = {
  STARTED: 'tracking.started',
  STOPPED: 'tracking.stopped',
} as const;

export function logTrackingAudit(event: AuditEvent): void {
  emitStructuredAudit('tracking audit event', event);
}
