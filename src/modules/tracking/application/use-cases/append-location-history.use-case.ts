import { randomUUID } from 'node:crypto';
import { shouldAppendHistory } from '../../domain/location-history-rules.js';
import type { LocationHistoryRepository } from '../../domain/location-history.repository.js';
import { getLocationHistorySampleMs } from '../../../../shared/geo/location-history-config.js';
import { logTrackingHistorySkipped } from '../services/tracking-audit.service.js';

export interface AppendLocationHistoryCommand {
  companyId: string;
  employeeId: string;
  tripId: string;
  latitude: number;
  longitude: number;
  capturedAt: Date;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  batteryLevel?: number | null;
}

export class AppendLocationHistoryUseCase {
  constructor(
    private readonly locationHistoryRepository: LocationHistoryRepository,
    private readonly sampleMs: number = getLocationHistorySampleMs(),
  ) {}

  async execute(command: AppendLocationHistoryCommand): Promise<boolean> {
    const lastCapturedAt = await this.locationHistoryRepository.findLatestCapturedAt(
      command.employeeId,
      command.tripId,
      command.companyId,
    );

    if (!shouldAppendHistory(lastCapturedAt, command.capturedAt, this.sampleMs)) {
      logTrackingHistorySkipped({
        companyId: command.companyId,
        employeeId: command.employeeId,
        tripId: command.tripId,
        capturedAt: command.capturedAt.toISOString(),
        sampleMs: this.sampleMs,
      });
      return false;
    }

    await this.locationHistoryRepository.append({
      id: randomUUID(),
      companyId: command.companyId,
      employeeId: command.employeeId,
      tripId: command.tripId,
      latitude: command.latitude,
      longitude: command.longitude,
      capturedAt: command.capturedAt,
      accuracy: command.accuracy ?? null,
      speed: command.speed ?? null,
      heading: command.heading ?? null,
      batteryLevel: command.batteryLevel ?? null,
    });

    return true;
  }
}
