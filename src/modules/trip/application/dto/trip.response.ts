import type { TripSummaryProjection } from '../../domain/trip.repository.js';

export type TripVehicleSummaryDto = TripSummaryProjection['vehicle'];
export type TripSummaryDto = TripSummaryProjection;
