import { Prisma } from '@prisma/client';
import { prisma } from '../../../database/prisma.client.js';
import type {
  AppendLocationHistoryInput,
  FindRoutePointsQuery,
  FindRoutePointsResult,
  LocationHistoryRepository,
  RoutePointRecord,
} from '../domain/location-history.repository.js';

function toRoutePoint(row: {
  latitude: Prisma.Decimal;
  longitude: Prisma.Decimal;
  capturedAt: Date;
  accuracy: Prisma.Decimal | null;
  speed: Prisma.Decimal | null;
  heading: Prisma.Decimal | null;
  batteryLevel: number | null;
}): RoutePointRecord {
  return {
    latitude: row.latitude.toNumber(),
    longitude: row.longitude.toNumber(),
    capturedAt: row.capturedAt,
    accuracy: row.accuracy?.toNumber() ?? null,
    speed: row.speed?.toNumber() ?? null,
    heading: row.heading?.toNumber() ?? null,
    batteryLevel: row.batteryLevel,
  };
}

export class LocationHistoryPrismaRepository implements LocationHistoryRepository {
  async append(input: AppendLocationHistoryInput): Promise<void> {
    await prisma.locationHistory.create({
      data: {
        id: input.id,
        companyId: input.companyId,
        employeeId: input.employeeId,
        tripId: input.tripId,
        latitude: new Prisma.Decimal(input.latitude),
        longitude: new Prisma.Decimal(input.longitude),
        capturedAt: input.capturedAt,
        accuracy: input.accuracy == null ? null : new Prisma.Decimal(input.accuracy),
        speed: input.speed == null ? null : new Prisma.Decimal(input.speed),
        heading: input.heading == null ? null : new Prisma.Decimal(input.heading),
        batteryLevel: input.batteryLevel,
      },
    });
  }

  async findLatestCapturedAt(
    employeeId: string,
    tripId: string,
    companyId: string,
  ): Promise<Date | null> {
    const row = await prisma.locationHistory.findFirst({
      where: { employeeId, tripId, companyId },
      orderBy: { capturedAt: 'desc' },
      select: { capturedAt: true },
    });
    return row?.capturedAt ?? null;
  }

  async findRoutePoints(query: FindRoutePointsQuery): Promise<FindRoutePointsResult> {
    const where = {
      tripId: query.tripId,
      companyId: query.companyId,
      employeeId: query.employeeId,
    };

    const [total, rows] = await Promise.all([
      prisma.locationHistory.count({ where }),
      prisma.locationHistory.findMany({
        where,
        orderBy: { capturedAt: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);

    return {
      total,
      points: rows.map(toRoutePoint),
    };
  }

  async deleteByTripIds(tripIds: string[]): Promise<number> {
    if (tripIds.length === 0) return 0;
    const result = await prisma.locationHistory.deleteMany({
      where: { tripId: { in: tripIds } },
    });
    return result.count;
  }

  async findTripIdsEligibleForRetention(cutoffDate: Date): Promise<string[]> {
    const trips = await prisma.trip.findMany({
      where: {
        status: { in: ['COMPLETED', 'CANCELLED'] },
        actualEnd: { not: null, lt: cutoffDate },
      },
      select: { id: true },
    });
    return trips.map((trip) => trip.id);
  }
}
