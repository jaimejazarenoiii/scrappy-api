import type { CurrentLocation as PrismaCurrentLocation } from '@prisma/client';
import { CurrentLocationEntity } from '../../domain/current-location.entity.js';

function toNumber(value: { toNumber(): number } | null | undefined): number | null {
  if (value == null) return null;
  return value.toNumber();
}

export function toCurrentLocationDomain(row: PrismaCurrentLocation): CurrentLocationEntity {
  return CurrentLocationEntity.create({
    id: row.id,
    companyId: row.companyId,
    employeeId: row.employeeId,
    tripId: row.tripId,
    latitude: row.latitude.toNumber(),
    longitude: row.longitude.toNumber(),
    speed: toNumber(row.speed),
    heading: toNumber(row.heading),
    accuracy: toNumber(row.accuracy),
    batteryLevel: row.batteryLevel,
    isMockLocation: row.isMockLocation,
    lastSeenAt: row.lastSeenAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}
