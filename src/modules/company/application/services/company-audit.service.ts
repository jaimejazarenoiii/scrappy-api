import type { AuditEvent } from '../../../../shared/audit/audit-event.js';
import { getLogger } from '../../../../config/logger.js';

export function logCompanyAudit(event: AuditEvent): void {
  getLogger().info({ audit: event }, 'company audit event');
}
