import type { AuditEvent } from '../../../../shared/audit/audit-event.js';
import { emitStructuredAudit } from '../../../../shared/audit/emit-structured-audit.js';

export function logAuthAudit(event: AuditEvent): void {
  emitStructuredAudit('auth audit event', event);
}
