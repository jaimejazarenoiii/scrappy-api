import type { TripProps } from '../../domain/trip.entity.js';

export type TripHistoryAction = 'CREATED' | 'STARTED' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';

export interface TripHistoryEventDto {
  action: TripHistoryAction;
  occurredAt: Date;
  actorUserId: string | null;
  note: string | null;
}

export interface TripHistoryDto {
  tripId: string;
  events: TripHistoryEventDto[];
}

export function buildTripHistory(tripId: string, trip: TripProps): TripHistoryDto {
  const events: TripHistoryEventDto[] = [
    {
      action: 'CREATED',
      occurredAt: trip.createdAt,
      actorUserId: trip.createdByUserId,
      note: null,
    },
  ];

  if (trip.actualStart) {
    events.push({
      action: 'STARTED',
      occurredAt: trip.actualStart,
      actorUserId: trip.startedByUserId,
      note: null,
    });
  }

  if (trip.status === 'COMPLETED' && trip.actualEnd) {
    events.push({
      action: 'COMPLETED',
      occurredAt: trip.actualEnd,
      actorUserId: trip.completedByUserId,
      note: null,
    });
  }

  if (trip.status === 'CANCELLED' && trip.cancelledByUserId) {
    events.push({
      action: 'CANCELLED',
      occurredAt: trip.updatedAt,
      actorUserId: trip.cancelledByUserId,
      note: trip.cancellationReason,
    });
  }

  if (trip.deletedAt) {
    events.push({
      action: 'ARCHIVED',
      occurredAt: trip.deletedAt,
      actorUserId: trip.updatedByUserId,
      note: null,
    });
  }

  events.sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime());

  return { tripId, events };
}
