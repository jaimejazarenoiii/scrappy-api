import type { AuditEvent } from '../../../../shared/audit/audit-event.js';
import { getLogger } from '../../../../config/logger.js';

export function logCashAdvanceAudit(event: AuditEvent): void {
  getLogger().info({ audit: event }, 'cash advance audit event');
}
