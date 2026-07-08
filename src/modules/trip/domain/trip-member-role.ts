export const TRIP_MEMBER_ROLES = ['DRIVER', 'HELPER', 'BUYER', 'SUPERVISOR'] as const;

export type TripMemberRole = (typeof TRIP_MEMBER_ROLES)[number];
