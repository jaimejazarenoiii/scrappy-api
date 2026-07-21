export const TRACKING_STATUSES = ['ONLINE', 'OFFLINE'] as const;

export type TrackingStatus = (typeof TRACKING_STATUSES)[number];

/**
 * Derives tracking status from last seen timestamp and staleness window.
 */
export function deriveTrackingStatus(
  lastSeenAt: Date | null,
  tripId: string | null,
  stalenessMs: number,
  now: Date = new Date(),
): TrackingStatus {
  if (!lastSeenAt || !tripId) return 'OFFLINE';
  const elapsed = now.getTime() - lastSeenAt.getTime();
  return elapsed <= stalenessMs ? 'ONLINE' : 'OFFLINE';
}
