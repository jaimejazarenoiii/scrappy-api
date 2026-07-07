import type { AuditEvent } from '../../../../shared/audit/audit-event.js';
import { getLogger } from '../../../../config/logger.js';

export function logAuthAudit(event: AuditEvent): void {
  getLogger().info({ audit: event }, 'auth audit event');
}
