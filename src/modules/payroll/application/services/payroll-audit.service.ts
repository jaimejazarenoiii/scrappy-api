import type { AuditEvent } from '../../../../shared/audit/audit-event.js';
import { getLogger } from '../../../../config/logger.js';

export function logPayrollAudit(event: AuditEvent): void {
  getLogger().info({ audit: event }, 'payroll audit event');
}
