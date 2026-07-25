import type { AuditEvent } from '../../../../shared/audit/audit-event.js';
import { getLogger } from '../../../../config/logger.js';
import { emitStructuredAudit } from '../../../../shared/audit/emit-structured-audit.js';

export const TRACKING_AUDIT_ACTIONS = {
  STARTED: 'tracking.started',
  STOPPED: 'tracking.stopped',
} as const;

export type TrackingLocationChannel = 'rest' | 'websocket';

export interface TrackingLocationAcceptedLog {
  companyId: string;
  employeeId: string;
  tripId: string;
  tripNumber: string;
  userId: string;
  channel: TrackingLocationChannel;
  capturedAt: string;
  routePointCount: number;
  historyAppended: boolean;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  batteryLevel: number | null;
}

export interface TrackingLocationRejectedLog {
  companyId?: string;
  userId?: string;
  employeeId?: string;
  channel: TrackingLocationChannel;
  code: string;
  message: string;
}

export function logTrackingAudit(event: AuditEvent): void {
  emitStructuredAudit('tracking audit event', event);
}

/** Info: accepted GPS upsert without coordinates. Debug: includes lat/lng for local dev. */
export function logTrackingLocationAccepted(input: TrackingLocationAcceptedLog): void {
  const logger = getLogger();
  logger.info(
    {
      tracking: {
        event: 'location.accepted',
        companyId: input.companyId,
        employeeId: input.employeeId,
        tripId: input.tripId,
        tripNumber: input.tripNumber,
        userId: input.userId,
        channel: input.channel,
        capturedAt: input.capturedAt,
        routePointCount: input.routePointCount,
        historyAppended: input.historyAppended,
        accuracy: input.accuracy,
        batteryLevel: input.batteryLevel,
      },
    },
    'tracking location accepted',
  );
  logger.debug(
    {
      tracking: {
        event: 'location.accepted.detail',
        latitude: input.latitude,
        longitude: input.longitude,
      },
    },
    'tracking location coordinates',
  );
}

/** Warn when a transmit attempt is rejected before upsert (WS gateway, validation, etc.). */
export function logTrackingLocationRejected(input: TrackingLocationRejectedLog): void {
  getLogger().warn(
    {
      tracking: {
        event: 'location.rejected',
        companyId: input.companyId,
        userId: input.userId,
        employeeId: input.employeeId,
        channel: input.channel,
        code: input.code,
        message: input.message,
      },
    },
    'tracking location rejected',
  );
}

/** Debug when history append is skipped by sampling interval. */
export function logTrackingHistorySkipped(input: {
  companyId: string;
  employeeId: string;
  tripId: string;
  capturedAt: string;
  sampleMs: number;
}): void {
  getLogger().debug(
    {
      tracking: {
        event: 'history.skipped',
        companyId: input.companyId,
        employeeId: input.employeeId,
        tripId: input.tripId,
        capturedAt: input.capturedAt,
        sampleMs: input.sampleMs,
      },
    },
    'tracking history append skipped by sampling',
  );
}

/** Debug when route points are broadcast to websocket subscribers. */
export function logTrackingRouteBroadcast(input: {
  companyId: string;
  tripId: string;
  employeeId: string;
  routePointCount: number;
}): void {
  getLogger().debug(
    {
      tracking: {
        event: 'route.broadcast',
        companyId: input.companyId,
        tripId: input.tripId,
        employeeId: input.employeeId,
        routePointCount: input.routePointCount,
      },
    },
    'tracking route broadcast',
  );
}
