import type { AuditEvent } from '../../../../shared/audit/audit-event.js';
import { getLogger } from '../../../../config/logger.js';

export function logAttendanceAudit(event: AuditEvent): void {
  getLogger().info({ audit: event }, 'attendance audit event');
}
