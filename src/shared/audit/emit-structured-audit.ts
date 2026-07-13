import type { AuditEvent } from './audit-event.js';
import { getLogger } from '../../config/logger.js';
import { persistActivityLogFromAudit } from './activity-log-bridge.js';

/**
 * Emits a structured Pino audit event and best-effort persists an Activity Log.
 */
export function emitStructuredAudit(message: string, event: AuditEvent): void {
  getLogger().info({ audit: event }, message);
  persistActivityLogFromAudit(event);
}
