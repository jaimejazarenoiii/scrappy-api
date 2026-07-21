import { getTrackingStalenessMs } from '../../../../shared/geo/tracking-staleness.js';
import type { CurrentLocationEntity } from '../../domain/current-location.entity.js';
import type { TrackingStatus } from '../../domain/tracking-status.js';

/**
 * Derives online/offline tracking status from stored current location rows.
 */
export class TrackingStatusService {
  resolve(location: CurrentLocationEntity | null, now: Date = new Date()): TrackingStatus {
    if (!location) return 'OFFLINE';
    return location.trackingStatus(getTrackingStalenessMs(), now);
  }
}
