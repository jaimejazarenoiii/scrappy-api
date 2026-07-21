import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../database/prisma.client.js';
import type {
  CurrentLocationRepository,
  ListActiveLocationFilters,
  UpsertCurrentLocationInput,
} from '../domain/current-location.repository.js';
import type { CurrentLocationEntity } from '../domain/current-location.entity.js';
import { toCurrentLocationDomain } from './mappers/current-location.mapper.js';

export class CurrentLocationPrismaRepository implements CurrentLocationRepository {
  async upsert(input: UpsertCurrentLocationInput): Promise<CurrentLocationEntity> {
    const existing = await prisma.currentLocation.findUnique({
      where: { employeeId: input.employeeId },
    });

    if (existing && input.lastSeenAt.getTime() < existing.lastSeenAt.getTime()) {
      return toCurrentLocationDomain(existing);
    }

    const row = await prisma.currentLocation.upsert({
      where: { employeeId: input.employeeId },
      create: {
        id: input.id,
        companyId: input.companyId,
        employeeId: input.employeeId,
        tripId: input.tripId,
        latitude: new Prisma.Decimal(input.latitude),
        longitude: new Prisma.Decimal(input.longitude),
        speed: input.speed == null ? null : new Prisma.Decimal(input.speed),
        heading: input.heading == null ? null : new Prisma.Decimal(input.heading),
        accuracy: input.accuracy == null ? null : new Prisma.Decimal(input.accuracy),
        batteryLevel: input.batteryLevel,
        isMockLocation: false,
        lastSeenAt: input.lastSeenAt,
      },
      update: {
        tripId: input.tripId,
        latitude: new Prisma.Decimal(input.latitude),
        longitude: new Prisma.Decimal(input.longitude),
        speed: input.speed == null ? null : new Prisma.Decimal(input.speed),
        heading: input.heading == null ? null : new Prisma.Decimal(input.heading),
        accuracy: input.accuracy == null ? null : new Prisma.Decimal(input.accuracy),
        batteryLevel: input.batteryLevel,
        isMockLocation: false,
        lastSeenAt: input.lastSeenAt,
      },
    });

    return toCurrentLocationDomain(row);
  }

  async findByEmployeeId(
    employeeId: string,
    companyId: string,
  ): Promise<CurrentLocationEntity | null> {
    const row = await prisma.currentLocation.findFirst({
      where: { employeeId, companyId },
    });
    return row ? toCurrentLocationDomain(row) : null;
  }

  async findByTripId(companyId: string, tripId: string): Promise<CurrentLocationEntity[]> {
    const rows = await prisma.currentLocation.findMany({
      where: { companyId, tripId },
    });
    return rows.map(toCurrentLocationDomain);
  }

  async findActiveByCompany(
    companyId: string,
    filters: ListActiveLocationFilters = {},
  ): Promise<CurrentLocationEntity[]> {
    const rows = await prisma.currentLocation.findMany({
      where: {
        companyId,
        tripId: { not: null },
        ...(filters.tripId ? { tripId: filters.tripId } : {}),
        ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
      },
    });
    return rows.map(toCurrentLocationDomain);
  }

  async clearTripAssociation(tripId: string, companyId: string): Promise<string[]> {
    const rows = await prisma.currentLocation.findMany({
      where: { tripId, companyId },
      select: { employeeId: true },
    });
    if (rows.length === 0) return [];

    await prisma.currentLocation.updateMany({
      where: { tripId, companyId },
      data: { tripId: null },
    });

    return rows.map((row) => row.employeeId);
  }

  async findWithActiveTripOlderThan(
    companyId: string,
    threshold: Date,
  ): Promise<CurrentLocationEntity[]> {
    const rows = await prisma.currentLocation.findMany({
      where: {
        companyId,
        tripId: { not: null },
        lastSeenAt: { lt: threshold },
      },
    });
    return rows.map(toCurrentLocationDomain);
  }

  async findDistinctCompanyIdsWithActiveTracking(): Promise<string[]> {
    const rows = await prisma.currentLocation.findMany({
      where: { tripId: { not: null } },
      select: { companyId: true },
      distinct: ['companyId'],
    });
    return rows.map((row) => row.companyId);
  }
}

export function newCurrentLocationId(): string {
  return randomUUID();
}
