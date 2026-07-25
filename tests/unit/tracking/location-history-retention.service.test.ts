import { describe, expect, it } from 'vitest';
import { LocationHistoryRetentionService } from '../../../src/modules/tracking/application/services/location-history-retention.service.js';
import { InMemoryLocationHistoryRepository } from '../../setup/in-memory-location-history-repository.js';
import { setupTestEnv } from '../../setup/test-app.js';
import { randomUUID } from 'node:crypto';

describe('LocationHistoryRetentionService', () => {
  it('deletes history for eligible trips', async () => {
    setupTestEnv();
    const repo = new InMemoryLocationHistoryRepository();
    const tripId = randomUUID();
    repo.setEligibleTripIds([tripId]);

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

    const service = new LocationHistoryRetentionService(repo);
    const deleted = await service.runPurge();

    expect(deleted).toBe(1);
    expect(repo.countForTrip(tripId)).toBe(0);
  });
});
