import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { setupTestEnv } from '../../setup/test-app.js';
import { CreateTripLoadUseCase } from '../../../src/modules/trip/application/use-cases/create-trip-load.use-case.js';
import {
  DuplicateResourceError,
  ForbiddenError,
  LifecycleConflictError,
  ValidationAppError,
} from '../../../src/shared/errors/http-exceptions.js';
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
    tripNumber: 'TRIP-20260714-000001',
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
  const useCase = new CreateTripLoadUseCase(tripRepository, tripLoadRepository);
  const auth: AuthorizationContext = { companyId, userId, role: 'OWNER' };
  return { companyId, userId, tripId, tripRepository, tripLoadRepository, useCase, auth };
}

describe('CreateTripLoadUseCase', () => {
  beforeAll(() => setupTestEnv());

  it('creates a load with items and enables loadEnabled', async () => {
    const f = await buildFixture();
    const result = await f.useCase.execute(f.tripId, f.auth, {
      notes: 'Morning cargo',
      items: [
        { materialName: 'Copper', quantity: 100, unit: 'KG' },
        { materialName: 'Steel', quantity: 50, unit: 'KG' },
      ],
    });

    expect(result.items).toHaveLength(2);
    expect(result.notes).toBe('Morning cargo');
    const trip = await f.tripRepository.findById(f.tripId, f.companyId);
    expect(trip?.loadEnabled).toBe(true);
  });

  it('rejects a second load for the same trip', async () => {
    const f = await buildFixture();
    await f.useCase.execute(f.tripId, f.auth, {
      items: [{ materialName: 'Copper', quantity: 100, unit: 'KG' }],
    });
    await expect(
      f.useCase.execute(f.tripId, f.auth, {
        items: [{ materialName: 'Steel', quantity: 10, unit: 'KG' }],
      }),
    ).rejects.toThrow(DuplicateResourceError);
  });

  it('rejects duplicate materials in one request', async () => {
    const f = await buildFixture();
    await expect(
      f.useCase.execute(f.tripId, f.auth, {
        items: [
          { materialName: 'Copper', quantity: 100, unit: 'KG' },
          { materialName: 'copper', quantity: 20, unit: 'KG' },
        ],
      }),
    ).rejects.toThrow(ValidationAppError);
  });

  it('forbids employees from creating a load', async () => {
    const f = await buildFixture();
    await expect(
      f.useCase.execute(
        f.tripId,
        { ...f.auth, role: 'EMPLOYEE' },
        { items: [{ materialName: 'Copper', quantity: 1, unit: 'KG' }] },
      ),
    ).rejects.toThrow(ForbiddenError);
  });

  it('rejects load creation on a non-draft trip', async () => {
    const f = await buildFixture();
    await f.tripRepository.start(f.tripId, f.companyId, {
      actualStart: new Date(),
      startedByUserId: f.userId,
    });
    await expect(
      f.useCase.execute(f.tripId, f.auth, {
        items: [{ materialName: 'Copper', quantity: 1, unit: 'KG' }],
      }),
    ).rejects.toThrow(LifecycleConflictError);
  });
});
