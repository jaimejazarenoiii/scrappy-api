import type { AuditEvent } from '../../../../shared/audit/audit-event.js';
import { emitStructuredAudit } from '../../../../shared/audit/emit-structured-audit.js';

export function logAttendanceAudit(event: AuditEvent): void {
  emitStructuredAudit('attendance audit event', event);
}
