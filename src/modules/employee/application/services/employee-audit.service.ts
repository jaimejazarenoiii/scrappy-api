import type { AuditEvent } from '../../../../shared/audit/audit-event.js';
import { emitStructuredAudit } from '../../../../shared/audit/emit-structured-audit.js';

export function logEmployeeAudit(event: AuditEvent): void {
  emitStructuredAudit('employee audit event', event);
}
