import type {
  AppendLocationHistoryInput,
  FindRoutePointsQuery,
  FindRoutePointsResult,
  LocationHistoryRepository,
  RoutePointRecord,
} from '../../src/modules/tracking/domain/location-history.repository.js';

interface StoredPoint extends RoutePointRecord {
  id: string;
  companyId: string;
  employeeId: string;
  tripId: string;
}

export class InMemoryLocationHistoryRepository implements LocationHistoryRepository {
  private readonly points: StoredPoint[] = [];
  private eligibleTripIds: string[] = [];

  async append(input: AppendLocationHistoryInput): Promise<void> {
    this.points.push({
      id: input.id,
      companyId: input.companyId,
      employeeId: input.employeeId,
      tripId: input.tripId,
      latitude: input.latitude,
      longitude: input.longitude,
      capturedAt: input.capturedAt,
      accuracy: input.accuracy,
      speed: input.speed,
      heading: input.heading,
      batteryLevel: input.batteryLevel,
    });
  }

  async findLatestCapturedAt(
    employeeId: string,
    tripId: string,
    companyId: string,
  ): Promise<Date | null> {
    const matching = this.points
      .filter(
        (point) =>
          point.employeeId === employeeId &&
          point.tripId === tripId &&
          point.companyId === companyId,
      )
      .sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime());
    return matching[0]?.capturedAt ?? null;
  }

  async findRoutePoints(query: FindRoutePointsQuery): Promise<FindRoutePointsResult> {
    const filtered = this.points.filter(
      (point) =>
        point.tripId === query.tripId &&
        point.companyId === query.companyId &&
        point.employeeId === query.employeeId,
    );
    filtered.sort((a, b) => {
      const delta = a.capturedAt.getTime() - b.capturedAt.getTime();
      return query.sortOrder === 'asc' ? delta : -delta;
    });

    const total = filtered.length;
    const start = (query.page - 1) * query.limit;
    const pageItems = filtered.slice(start, start + query.limit);

    return {
      total,
      points: pageItems.map(
        ({ latitude, longitude, capturedAt, accuracy, speed, heading, batteryLevel }) => ({
          latitude,
          longitude,
          capturedAt,
          accuracy,
          speed,
          heading,
          batteryLevel,
        }),
      ),
    };
  }

  async deleteByTripIds(tripIds: string[]): Promise<number> {
    const tripIdSet = new Set(tripIds);
    const before = this.points.length;
    for (let index = this.points.length - 1; index >= 0; index -= 1) {
      if (tripIdSet.has(this.points[index]!.tripId)) {
        this.points.splice(index, 1);
      }
    }
    return before - this.points.length;
  }

  async findTripIdsEligibleForRetention(_cutoffDate: Date): Promise<string[]> {
    return [...this.eligibleTripIds];
  }

  /** Test helper */
  countForTrip(tripId: string): number {
    return this.points.filter((point) => point.tripId === tripId).length;
  }

  /** Test helper for retention */
  setEligibleTripIds(tripIds: string[]): void {
    this.eligibleTripIds = tripIds;
  }
}
