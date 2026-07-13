import type { AuditEvent } from '../../../../shared/audit/audit-event.js';
import { getLogger } from '../../../../config/logger.js';

export const USER_PASSWORD_AUDIT_ACTIONS = {
  CHANGED: 'user.password_changed',
  ADMIN_RESET: 'user.password_admin_reset',
} as const;

/**
 * Emits a structured audit log for password change/reset. Never include plaintext passwords.
 */
export function logUserPasswordAudit(event: AuditEvent): void {
  getLogger().info({ audit: event }, 'user password audit event');
}
