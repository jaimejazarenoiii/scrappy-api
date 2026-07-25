import { getLogger } from '../../../../config/logger.js';
import {
  getLocationHistoryRetentionDays,
  getLocationHistoryRetentionSweepMs,
} from '../../../../shared/geo/location-history-config.js';
import type { LocationHistoryRepository } from '../../domain/location-history.repository.js';

/**
 * Periodically purges route history for trips completed/cancelled beyond retention window.
 */
export class LocationHistoryRetentionService {
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly locationHistoryRepository: LocationHistoryRepository) {}

  start(): void {
    if (this.timer) return;
    const intervalMs = getLocationHistoryRetentionSweepMs();
    void this.runPurge().catch((error: unknown) => {
      getLogger().error({ error }, 'location history retention purge failed');
    });
    this.timer = setInterval(() => {
      void this.runPurge().catch((error: unknown) => {
        getLogger().error({ error }, 'location history retention purge failed');
      });
    }, intervalMs);
    this.timer.unref?.();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async runPurge(): Promise<number> {
    const retentionDays = getLocationHistoryRetentionDays();
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const tripIds = await this.locationHistoryRepository.findTripIdsEligibleForRetention(cutoff);
    if (tripIds.length === 0) return 0;

    const deleted = await this.locationHistoryRepository.deleteByTripIds(tripIds);
    getLogger().info(
      { tripCount: tripIds.length, deletedPoints: deleted },
      'location history retention purge completed',
    );
    return deleted;
  }
}
