import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { InMemoryLocationHistoryRepository } from '../../setup/in-memory-location-history-repository.js';

describe('location history persistence', () => {
  it('stores and retrieves ordered route points with pagination', async () => {
    const repo = new InMemoryLocationHistoryRepository();
    const companyId = randomUUID();
    const employeeId = randomUUID();
    const tripId = randomUUID();

    for (let index = 0; index < 3; index += 1) {
      await repo.append({
        id: randomUUID(),
        companyId,
        employeeId,
        tripId,
        latitude: 14.5 + index * 0.01,
        longitude: 120.9,
        capturedAt: new Date(`2026-07-24T10:00:${String(index * 20).padStart(2, '0')}Z`),
        accuracy: null,
        speed: null,
        heading: null,
        batteryLevel: null,
      });
    }

    const page1 = await repo.findRoutePoints({
      tripId,
      companyId,
      employeeId,
      page: 1,
      limit: 2,
      sortOrder: 'asc',
    });
    expect(page1.total).toBe(3);
    expect(page1.points).toHaveLength(2);

    const page2 = await repo.findRoutePoints({
      tripId,
      companyId,
      employeeId,
      page: 2,
      limit: 2,
      sortOrder: 'asc',
    });
    expect(page2.points).toHaveLength(1);
  });
});
