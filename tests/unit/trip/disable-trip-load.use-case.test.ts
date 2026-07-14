import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { setupTestEnv } from '../../setup/test-app.js';
import { DisableTripLoadUseCase } from '../../../src/modules/trip/application/use-cases/disable-trip-load.use-case.js';
import { LifecycleConflictError } from '../../../src/shared/errors/http-exceptions.js';
import type { AuthorizationContext } from '../../../src/shared/policy/authorization-context.js';
import { InMemoryTripRepository } from '../../setup/in-memory-trip-repository.js';
import { InMemoryTripLoadRepository } from '../../setup/in-memory-trip-load-repository.js';

async function buildFixture() {
  const companyId = randomUUID();
  const userId = randomUUID();
  const tripRepository = new InMemoryTripRepository();
  const tripLoadRepository = new InMemoryTripLoadRepository();
  const tripId = randomUUID();
  await tripRepository.create({
    id: tripId,
    companyId,
    tripNumber: 'TRIP-20260714-000003',
    vehicleId: randomUUID(),
    status: 'DRAFT',
    scheduledStart: new Date(),
    origin: 'A',
    destination: 'B',
    notes: null,
    createdByUserId: userId,
    updatedByUserId: userId,
    members: [],
  });
  await tripRepository.updateLoadFlags(tripId, companyId, {
    loadEnabled: true,
    strictLoadValidation: true,
  });
  await tripLoadRepository.create({
    id: randomUUID(),
    tripId,
    notes: null,
    createdByUserId: userId,
    items: [
      {
        id: randomUUID(),
        materialName: 'Copper',
        materialNameNorm: 'copper',
        quantity: 100,
        unit: 'KG',
        notes: null,
      },
    ],
  });
  const useCase = new DisableTripLoadUseCase(tripRepository, tripLoadRepository);
  const auth: AuthorizationContext = { companyId, userId, role: 'OWNER' };
  return { companyId, userId, tripId, tripRepository, tripLoadRepository, useCase, auth };
}

describe('DisableTripLoadUseCase', () => {
  beforeAll(() => setupTestEnv());

  it('disables load, clears the load, and resets strict validation', async () => {
    const f = await buildFixture();
    const result = await f.useCase.execute(f.tripId, f.auth);
    expect(result.loadEnabled).toBe(true);
    expect(result.strictLoadValidation).toBe(false);
    expect(await f.tripLoadRepository.findByTripId(f.tripId)).toBeNull();
  });

  it('rejects disabling on a non-draft trip', async () => {
    const f = await buildFixture();
    await f.tripRepository.start(f.tripId, f.companyId, {
      actualStart: new Date(),
      startedByUserId: f.userId,
    });
    await expect(f.useCase.execute(f.tripId, f.auth)).rejects.toThrow(LifecycleConflictError);
  });
});
