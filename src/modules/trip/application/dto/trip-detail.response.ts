import type { TripDetailProjection, TripSummaryProjection } from '../../domain/trip.repository.js';

export type TripSummaryDto = TripSummaryProjection;
export type TripDetailDto = TripDetailProjection;

export function toTripDetailDto(detail: TripDetailProjection): TripDetailDto {
  return detail;
}
