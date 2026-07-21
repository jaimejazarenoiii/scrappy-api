import type { TrackingLifecyclePort } from '../domain/ports/tracking-lifecycle.port.js';
import type { StopTrackingForTripUseCase } from '../application/use-cases/stop-tracking-for-trip.use-case.js';

export class TrackingLifecycleAdapter implements TrackingLifecyclePort {
  constructor(private readonly stopTrackingForTripUseCase: StopTrackingForTripUseCase) {}

  stopTrackingForTrip(tripId: string, companyId: string, actorUserId: string): Promise<void> {
    return this.stopTrackingForTripUseCase.stopTrackingForTrip(tripId, companyId, actorUserId);
  }
}
