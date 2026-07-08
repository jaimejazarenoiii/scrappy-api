export const TRIP_STATUSES = ['DRAFT', 'STARTED', 'COMPLETED', 'CANCELLED'] as const;

export type TripStatus = (typeof TRIP_STATUSES)[number];
