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
  LOAD_ENABLED: 'trip.load_enabled',
  LOAD_DISABLED: 'trip.load_disabled',
  LOAD_CREATED: 'trip.load_created',
  LOAD_UPDATED: 'trip.load_updated',
  LOAD_DELETED: 'trip.load_deleted',
  LOAD_ITEM_ADDED: 'trip.load_item_added',
  LOAD_ITEM_UPDATED: 'trip.load_item_updated',
  LOAD_ITEM_REMOVED: 'trip.load_item_removed',
} as const;

export type TripAuditAction = (typeof TRIP_AUDIT_ACTIONS)[keyof typeof TRIP_AUDIT_ACTIONS];

export function logTripAudit(event: AuditEvent): void {
  emitStructuredAudit('trip audit event', event);
}
