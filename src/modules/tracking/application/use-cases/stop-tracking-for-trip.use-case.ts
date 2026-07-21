import type { TripRepository } from '../../../trip/domain/trip.repository.js';
import type { CurrentLocationRepository } from '../../domain/current-location.repository.js';
import type { TrackingBroadcastPort } from '../../domain/ports/tracking-broadcast.port.js';
import type { TrackingLifecyclePort } from '../../domain/ports/tracking-lifecycle.port.js';
import { TRACKING_AUDIT_ACTIONS, logTrackingAudit } from '../services/tracking-audit.service.js';

export class StopTrackingForTripUseCase implements TrackingLifecyclePort {
  constructor(
    private readonly currentLocationRepository: CurrentLocationRepository,
    private readonly tripRepository: TripRepository,
    private readonly broadcastPort: TrackingBroadcastPort,
  ) {}

  async stopTrackingForTrip(tripId: string, companyId: string, actorUserId: string): Promise<void> {
    const trip = await this.tripRepository.findById(tripId, companyId);
    const tripNumber = trip?.toPrimitives().tripNumber;

    const employeeIds = await this.currentLocationRepository.clearTripAssociation(
      tripId,
      companyId,
    );

    if (employeeIds.length === 0) return;

    this.broadcastPort.publish('tracking:stopped', {
      companyId,
      tripId,
      tripNumber,
      employeeIds,
      reason: 'TRIP_COMPLETED',
    });

    for (const employeeId of employeeIds) {
      logTrackingAudit({
        action: TRACKING_AUDIT_ACTIONS.STOPPED,
        companyId,
        resourceType: 'trip',
        resourceId: tripId,
        actorUserId,
        metadata: {
          tripNumber,
          employeeId,
          reason: 'TRIP_COMPLETED',
        },
      });
    }
  }
}
