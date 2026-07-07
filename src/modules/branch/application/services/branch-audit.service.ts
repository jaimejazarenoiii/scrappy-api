import type { AuditEvent } from '../../../../shared/audit/audit-event.js';
import { getLogger } from '../../../../config/logger.js';

export function logBranchAudit(event: AuditEvent): void {
  getLogger().info({ audit: event }, 'branch audit event');
}
