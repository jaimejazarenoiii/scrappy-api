import type { AuditEvent } from '../../../../shared/audit/audit-event.js';
import { emitStructuredAudit } from '../../../../shared/audit/emit-structured-audit.js';

export function logWarehouseAudit(event: AuditEvent): void {
  emitStructuredAudit('warehouse audit event', event);
}
