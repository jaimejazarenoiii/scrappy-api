import type { AuditEvent } from '../../../../shared/audit/audit-event.js';
import { emitStructuredAudit } from '../../../../shared/audit/emit-structured-audit.js';

export function logVehicleAudit(event: AuditEvent): void {
  emitStructuredAudit('vehicle audit event', event);
}
