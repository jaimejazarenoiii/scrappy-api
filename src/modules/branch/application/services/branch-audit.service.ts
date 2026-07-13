import type { AuditEvent } from '../../../../shared/audit/audit-event.js';
import { emitStructuredAudit } from '../../../../shared/audit/emit-structured-audit.js';

export function logBranchAudit(event: AuditEvent): void {
  emitStructuredAudit('branch audit event', event);
}
