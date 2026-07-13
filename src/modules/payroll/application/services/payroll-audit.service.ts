import type { AuditEvent } from '../../../../shared/audit/audit-event.js';
import { emitStructuredAudit } from '../../../../shared/audit/emit-structured-audit.js';

export function logPayrollAudit(event: AuditEvent): void {
  emitStructuredAudit('payroll audit event', event);
}
