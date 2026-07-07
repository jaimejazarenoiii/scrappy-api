import type { AuditEvent } from '../../../../shared/audit/audit-event.js';
import { getLogger } from '../../../../config/logger.js';

export function logWarehouseAudit(event: AuditEvent): void {
  getLogger().info({ audit: event }, 'warehouse audit event');
}
