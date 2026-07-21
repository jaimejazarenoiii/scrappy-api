import { getLogger } from '../../../../config/logger.js';
import {
  getTrackingStalenessMs,
  getTrackingSweepMs,
} from '../../../../shared/geo/tracking-staleness.js';
import type { CurrentLocationRepository } from '../../domain/current-location.repository.js';
import type { TrackingBroadcastPort } from '../../domain/ports/tracking-broadcast.port.js';
import { TrackingStatusService } from './tracking-status.service.js';

/**
 * Periodically emits employee:offline for active trip locations past the staleness window.
 */
export class TrackingStalenessSweepService {
  private timer: NodeJS.Timeout | null = null;
  private lastKnownOnline = new Set<string>();

  constructor(
    private readonly currentLocationRepository: CurrentLocationRepository,
    private readonly broadcastPort: TrackingBroadcastPort,
    private readonly statusService: TrackingStatusService,
  ) {}

  start(): void {
    if (this.timer) return;
    const intervalMs = getTrackingSweepMs();
    this.timer = setInterval(() => {
      void this.runSweep().catch((error: unknown) => {
        getLogger().error({ error }, 'tracking staleness sweep failed');
      });
    }, intervalMs);
    this.timer.unref?.();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async runSweep(): Promise<void> {
    const stalenessMs = getTrackingStalenessMs();
    const threshold = new Date(Date.now() - stalenessMs);
    const companyIds =
      await this.currentLocationRepository.findDistinctCompanyIdsWithActiveTracking();

    for (const companyId of companyIds) {
      const staleLocations = await this.currentLocationRepository.findWithActiveTripOlderThan(
        companyId,
        threshold,
      );

      for (const location of staleLocations) {
        const props = location.toPrimitives();
        const key = `${props.companyId}:${props.employeeId}`;
        if (!this.lastKnownOnline.has(key)) continue;

        this.lastKnownOnline.delete(key);
        this.broadcastPort.publish('employee:offline', {
          companyId: props.companyId,
          tripId: props.tripId ?? undefined,
          lastSeenAt: props.lastSeenAt.toISOString(),
        });
      }

      const activeLocations = await this.currentLocationRepository.findActiveByCompany(companyId);
      for (const location of activeLocations) {
        const props = location.toPrimitives();
        const key = `${props.companyId}:${props.employeeId}`;
        if (this.statusService.resolve(location) === 'ONLINE') {
          this.lastKnownOnline.add(key);
        }
      }
    }
  }

  markOnline(companyId: string, employeeId: string): void {
    this.lastKnownOnline.add(`${companyId}:${employeeId}`);
  }
}
