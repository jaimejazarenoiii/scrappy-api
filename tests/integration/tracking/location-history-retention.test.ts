import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { LocationHistoryRetentionService } from '../../../src/modules/tracking/application/services/location-history-retention.service.js';
import { InMemoryLocationHistoryRepository } from '../../setup/in-memory-location-history-repository.js';
import { setupTestEnv } from '../../setup/test-app.js';

describe('location history retention integration', () => {
  it('purges all points for trips past retention cutoff', async () => {
    setupTestEnv();
    const repo = new InMemoryLocationHistoryRepository();
    const oldTripId = randomUUID();
    const recentTripId = randomUUID();

    repo.setEligibleTripIds([oldTripId]);

    for (const tripId of [oldTripId, recentTripId]) {
      await repo.append({
        id: randomUUID(),
        companyId: randomUUID(),
        employeeId: randomUUID(),
        tripId,
        latitude: 14.5,
        longitude: 120.9,
        capturedAt: new Date(),
        accuracy: null,
        speed: null,
        heading: null,
        batteryLevel: null,
      });
    }

    const service = new LocationHistoryRetentionService(repo);
    await service.runPurge();

    expect(repo.countForTrip(oldTripId)).toBe(0);
    expect(repo.countForTrip(recentTripId)).toBe(1);
  });
});
