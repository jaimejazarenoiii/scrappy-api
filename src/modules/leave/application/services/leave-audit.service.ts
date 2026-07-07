import type { AuditEvent } from '../../../../shared/audit/audit-event.js';
import { getLogger } from '../../../../config/logger.js';

export function logLeaveAudit(event: AuditEvent): void {
  getLogger().info({ audit: event }, 'leave audit event');
}
