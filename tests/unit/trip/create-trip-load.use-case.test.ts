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
import { InMemoryUserRepository } from '../../setup/in-memory-repositories.js';
import { InMemoryTripRepository } from '../../setup/in-memory-trip-repository.js';
import { InMemoryTripLoadRepository } from '../../setup/in-memory-trip-load-repository.js';

async function buildFixture(opts?: { withMember?: boolean }) {
  const companyId = randomUUID();
  const userId = randomUUID();
  const employeeId = randomUUID();
  const tripRepository = new InMemoryTripRepository();
  const tripLoadRepository = new InMemoryTripLoadRepository();
  const userRepository = new InMemoryUserRepository();
  await userRepository.create({
    id: userId,
    companyId,
    email: `${userId}@test.local`,
    passwordHash: 'hashed',
    role: 'EMPLOYEE',
    employeeId,
  });
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
    members: opts?.withMember ? [{ employeeId, role: 'DRIVER' }] : [],
  });
  const useCase = new CreateTripLoadUseCase(tripRepository, tripLoadRepository, userRepository);
  const auth: AuthorizationContext = { companyId, userId, role: 'OWNER' };
  return {
    companyId,
    userId,
    employeeId,
    tripId,
    tripRepository,
    tripLoadRepository,
    userRepository,
    useCase,
    auth,
  };
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

  it('allows assigned employees to create a load', async () => {
    const f = await buildFixture({ withMember: true });
    const result = await f.useCase.execute(
      f.tripId,
      { ...f.auth, role: 'EMPLOYEE' },
      { items: [{ materialName: 'Copper', quantity: 1, unit: 'KG' }] },
    );
    expect(result.items).toHaveLength(1);
  });

  it('forbids non-member employees from creating a load', async () => {
    const f = await buildFixture({ withMember: false });
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
