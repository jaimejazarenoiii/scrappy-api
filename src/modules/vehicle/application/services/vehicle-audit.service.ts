import type { AuditEvent } from '../../../../shared/audit/audit-event.js';
import { getLogger } from '../../../../config/logger.js';

export function logVehicleAudit(event: AuditEvent): void {
  getLogger().info({ audit: event }, 'vehicle audit event');
}
