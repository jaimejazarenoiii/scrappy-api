import { getTrackingStalenessMs } from '../../../../shared/geo/tracking-staleness.js';
import type { CurrentLocationEntity } from '../../domain/current-location.entity.js';
import type { CurrentLocationSummaryDto } from '../../application/dto/current-location.response.js';
import { TrackingStatusService } from '../../application/services/tracking-status.service.js';

const statusService = new TrackingStatusService();

export function toCurrentLocationSummaryDto(
  location: CurrentLocationEntity | null,
  tripNumber: string | null = null,
): CurrentLocationSummaryDto {
  if (!location) {
    return {
      employeeId: '',
      tripId: null,
      tripNumber: null,
      latitude: null,
      longitude: null,
      accuracy: null,
      speed: null,
      heading: null,
      batteryLevel: null,
      trackingStatus: 'OFFLINE',
      lastSeenAt: null,
    };
  }

  const props = location.toPrimitives();
  return {
    employeeId: props.employeeId,
    tripId: props.tripId,
    tripNumber,
    latitude: props.latitude,
    longitude: props.longitude,
    accuracy: props.accuracy,
    speed: props.speed,
    heading: props.heading,
    batteryLevel: props.batteryLevel,
    trackingStatus: statusService.resolve(location),
    lastSeenAt: props.lastSeenAt.toISOString(),
  };
}

export function toLocationBroadcast(location: CurrentLocationEntity) {
  const props = location.toPrimitives();
  const summary = toCurrentLocationSummaryDto(location);
  return {
    employeeId: props.employeeId,
    tripId: props.tripId!,
    latitude: props.latitude,
    longitude: props.longitude,
    accuracy: props.accuracy,
    speed: props.speed,
    heading: props.heading,
    batteryLevel: props.batteryLevel,
    lastSeenAt: props.lastSeenAt.toISOString(),
    trackingStatus: summary.trackingStatus,
    points: [] as Array<{
      latitude: number;
      longitude: number;
      capturedAt: string;
      accuracy: number | null;
      speed: number | null;
      heading: number | null;
      batteryLevel: number | null;
    }>,
  };
}

export function isStaleCapture(existing: CurrentLocationEntity | null, capturedAt: Date): boolean {
  if (!existing) return false;
  return capturedAt.getTime() < existing.toPrimitives().lastSeenAt.getTime();
}

export function wasOnlineBefore(
  existing: CurrentLocationEntity | null,
  stalenessMs = getTrackingStalenessMs(),
): boolean {
  if (!existing) return false;
  return existing.isOnline(stalenessMs);
}
