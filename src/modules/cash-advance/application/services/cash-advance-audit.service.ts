import type { AuditEvent } from '../../../../shared/audit/audit-event.js';
import { emitStructuredAudit } from '../../../../shared/audit/emit-structured-audit.js';

export function logCashAdvanceAudit(event: AuditEvent): void {
  emitStructuredAudit('cash advance audit event', event);
}
