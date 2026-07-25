import { describe, expect, it } from 'vitest';
import { AppendLocationHistoryUseCase } from '../../../src/modules/tracking/application/use-cases/append-location-history.use-case.js';
import { InMemoryLocationHistoryRepository } from '../../setup/in-memory-location-history-repository.js';

describe('AppendLocationHistoryUseCase', () => {
  it('appends first history point', async () => {
    const repo = new InMemoryLocationHistoryRepository();
    const useCase = new AppendLocationHistoryUseCase(repo, 15_000);

    const appended = await useCase.execute({
      companyId: 'c1',
      employeeId: 'e1',
      tripId: 't1',
      latitude: 14.5,
      longitude: 120.9,
      capturedAt: new Date('2026-07-24T10:00:00Z'),
    });

    expect(appended).toBe(true);
    expect(repo.countForTrip('t1')).toBe(1);
  });

  it('skips append within sampling interval', async () => {
    const repo = new InMemoryLocationHistoryRepository();
    const useCase = new AppendLocationHistoryUseCase(repo, 15_000);

    await useCase.execute({
      companyId: 'c1',
      employeeId: 'e1',
      tripId: 't1',
      latitude: 14.5,
      longitude: 120.9,
      capturedAt: new Date('2026-07-24T10:00:00Z'),
    });

    const appended = await useCase.execute({
      companyId: 'c1',
      employeeId: 'e1',
      tripId: 't1',
      latitude: 14.6,
      longitude: 121.0,
      capturedAt: new Date('2026-07-24T10:00:05Z'),
    });

    expect(appended).toBe(false);
    expect(repo.countForTrip('t1')).toBe(1);
  });

  it('appends when sampling interval elapsed', async () => {
    const repo = new InMemoryLocationHistoryRepository();
    const useCase = new AppendLocationHistoryUseCase(repo, 15_000);

    await useCase.execute({
      companyId: 'c1',
      employeeId: 'e1',
      tripId: 't1',
      latitude: 14.5,
      longitude: 120.9,
      capturedAt: new Date('2026-07-24T10:00:00Z'),
    });

    const appended = await useCase.execute({
      companyId: 'c1',
      employeeId: 'e1',
      tripId: 't1',
      latitude: 14.6,
      longitude: 121.0,
      capturedAt: new Date('2026-07-24T10:00:20Z'),
    });

    expect(appended).toBe(true);
    expect(repo.countForTrip('t1')).toBe(2);
  });
});
