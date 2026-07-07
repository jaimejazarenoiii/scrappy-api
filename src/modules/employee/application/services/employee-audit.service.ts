import type { AuditEvent } from '../../../../shared/audit/audit-event.js';
import { getLogger } from '../../../../config/logger.js';

export function logEmployeeAudit(event: AuditEvent): void {
  getLogger().info({ audit: event }, 'employee audit event');
}
