import type {
  LocationHistoryRepository,
  RoutePointRecord,
} from '../../domain/location-history.repository.js';

export interface RoutePointBroadcast {
  latitude: number;
  longitude: number;
  capturedAt: string;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  batteryLevel: number | null;
}

const WS_ROUTE_POINTS_LIMIT = 2000;

function toRoutePointBroadcast(point: RoutePointRecord): RoutePointBroadcast {
  return {
    latitude: point.latitude,
    longitude: point.longitude,
    capturedAt: point.capturedAt.toISOString(),
    accuracy: point.accuracy,
    speed: point.speed,
    heading: point.heading,
    batteryLevel: point.batteryLevel,
  };
}

export async function buildRoutePointsForBroadcast(
  repository: LocationHistoryRepository,
  input: {
    companyId: string;
    employeeId: string;
    tripId: string;
    latitude: number;
    longitude: number;
    capturedAt: Date;
    accuracy: number | null;
    speed: number | null;
    heading: number | null;
    batteryLevel: number | null;
  },
): Promise<RoutePointBroadcast[]> {
  const { points } = await repository.findRoutePoints({
    tripId: input.tripId,
    companyId: input.companyId,
    employeeId: input.employeeId,
    page: 1,
    limit: WS_ROUTE_POINTS_LIMIT,
    sortOrder: 'asc',
  });

  if (points.length > 0) {
    return points.map(toRoutePointBroadcast);
  }

  return [
    {
      latitude: input.latitude,
      longitude: input.longitude,
      capturedAt: input.capturedAt.toISOString(),
      accuracy: input.accuracy,
      speed: input.speed,
      heading: input.heading,
      batteryLevel: input.batteryLevel,
    },
  ];
}
