import type { AuditEvent } from '../../../../shared/audit/audit-event.js';
import { getLogger } from '../../../../config/logger.js';

export const EMPLOYEE_ACCOUNT_AUDIT_ACTIONS = {
  PROVISIONED_ON_CREATE: 'employee.account_provisioned_on_create',
  ACCESS_GRANTED: 'employee.system_access_granted',
  ACCESS_DISABLED: 'employee.system_access_disabled',
  ACCESS_ENABLED: 'employee.system_access_enabled',
} as const;

/**
 * Emits a structured audit log for employee account provisioning events.
 */
export function logEmployeeAccountAudit(event: AuditEvent): void {
  getLogger().info({ audit: event }, 'employee account audit event');
}
