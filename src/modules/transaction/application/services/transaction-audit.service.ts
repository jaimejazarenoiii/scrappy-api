import type { AuditEvent } from '../../../../shared/audit/audit-event.js';
import { getLogger } from '../../../../config/logger.js';

export function logTransactionAudit(event: AuditEvent): void {
  getLogger().info({ audit: event }, 'transaction audit event');
}
