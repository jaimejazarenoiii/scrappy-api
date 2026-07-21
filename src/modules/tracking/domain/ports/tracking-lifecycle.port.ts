/**
 * Port invoked by Trip module when a Started trip completes to halt live tracking.
 */
export interface TrackingLifecyclePort {
  stopTrackingForTrip(tripId: string, companyId: string, actorUserId: string): Promise<void>;
}

export class NoOpTrackingLifecyclePort implements TrackingLifecyclePort {
  async stopTrackingForTrip(): Promise<void> {
    // No-op when tracking module is not wired.
  }
}
