import type { AuditEvent } from '../../../../shared/audit/audit-event.js';
import { emitStructuredAudit } from '../../../../shared/audit/emit-structured-audit.js';

export const USER_PASSWORD_AUDIT_ACTIONS = {
  CHANGED: 'user.password_changed',
  ADMIN_RESET: 'user.password_admin_reset',
} as const;

/**
 * Emits a structured audit log for password change/reset. Never include plaintext passwords.
 */
export function logUserPasswordAudit(event: AuditEvent): void {
  emitStructuredAudit('user password audit event', event);
}
