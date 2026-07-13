import type { AuditEvent } from '../../../../shared/audit/audit-event.js';
import { emitStructuredAudit } from '../../../../shared/audit/emit-structured-audit.js';

export const TRIP_AUDIT_ACTIONS = {
  CREATED: 'trip.created',
  UPDATED: 'trip.updated',
  STARTED: 'trip.started',
  COMPLETED: 'trip.completed',
  CANCELLED: 'trip.cancelled',
  ARCHIVED: 'trip.archived',
  MEMBER_ADDED: 'trip.member_added',
  MEMBER_UPDATED: 'trip.member_updated',
  MEMBER_REMOVED: 'trip.member_removed',
} as const;

export type TripAuditAction = (typeof TRIP_AUDIT_ACTIONS)[keyof typeof TRIP_AUDIT_ACTIONS];

export function logTripAudit(event: AuditEvent): void {
  emitStructuredAudit('trip audit event', event);
}
