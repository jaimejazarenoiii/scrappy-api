import type { Trip as PrismaTrip } from '@prisma/client';
import { TripEntity } from '../../domain/trip.entity.js';
import type { TripStatus } from '../../domain/trip-status.js';

export function toTripDomain(record: PrismaTrip): TripEntity {
  return TripEntity.create({
    id: record.id,
    companyId: record.companyId,
    tripNumber: record.tripNumber,
    vehicleId: record.vehicleId,
    status: record.status as TripStatus,
    scheduledStart: record.scheduledStart,
    actualStart: record.actualStart,
    actualEnd: record.actualEnd,
    origin: record.origin,
    destination: record.destination,
    notes: record.notes,
    createdByUserId: record.createdByUserId,
    updatedByUserId: record.updatedByUserId,
    startedByUserId: record.startedByUserId,
    completedByUserId: record.completedByUserId,
    cancelledByUserId: record.cancelledByUserId,
    cancellationReason: record.cancellationReason,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    deletedAt: record.deletedAt,
  });
}
