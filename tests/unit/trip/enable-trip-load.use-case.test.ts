import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { setupTestEnv } from '../../setup/test-app.js';
import { EnableTripLoadUseCase } from '../../../src/modules/trip/application/use-cases/enable-trip-load.use-case.js';
import {
  ForbiddenError,
  LifecycleConflictError,
} from '../../../src/shared/errors/http-exceptions.js';
import type { AuthorizationContext } from '../../../src/shared/policy/authorization-context.js';
import { InMemoryCompanyRepository } from '../../setup/in-memory-repositories.js';
import { InMemoryTripRepository } from '../../setup/in-memory-trip-repository.js';

async function buildFixture() {
  const companyId = randomUUID();
  const userId = randomUUID();
  const companyRepository = new InMemoryCompanyRepository();
  await companyRepository.create({ id: companyId, name: `Co-${companyId}` });
  const tripRepository = new InMemoryTripRepository();
  const tripId = randomUUID();
  await tripRepository.create({
    id: tripId,
    companyId,
    tripNumber: 'TRIP-20260714-000002',
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
  const useCase = new EnableTripLoadUseCase(tripRepository, companyRepository);
  const auth: AuthorizationContext = { companyId, userId, role: 'MANAGER' };
  return { companyId, userId, tripId, tripRepository, companyRepository, useCase, auth };
}

describe('EnableTripLoadUseCase', () => {
  beforeAll(() => setupTestEnv());

  it('enables load with explicit strict flag', async () => {
    const f = await buildFixture();
    const result = await f.useCase.execute(f.tripId, f.auth, { strictLoadValidation: true });
    expect(result.loadEnabled).toBe(true);
    expect(result.strictLoadValidation).toBe(true);
  });

  it('applies company default strict flag when not provided', async () => {
    const f = await buildFixture();
    await f.companyRepository.update(f.companyId, { defaultStrictLoadValidation: true });
    const result = await f.useCase.execute(f.tripId, f.auth, {});
    expect(result.loadEnabled).toBe(true);
    expect(result.strictLoadValidation).toBe(true);
  });

  it('defaults strict to false when company default is off', async () => {
    const f = await buildFixture();
    const result = await f.useCase.execute(f.tripId, f.auth, {});
    expect(result.strictLoadValidation).toBe(false);
  });

  it('forbids employees', async () => {
    const f = await buildFixture();
    await expect(f.useCase.execute(f.tripId, { ...f.auth, role: 'EMPLOYEE' }, {})).rejects.toThrow(
      ForbiddenError,
    );
  });

  it('rejects enabling on a non-draft trip', async () => {
    const f = await buildFixture();
    await f.tripRepository.start(f.tripId, f.companyId, {
      actualStart: new Date(),
      startedByUserId: f.userId,
    });
    await expect(f.useCase.execute(f.tripId, f.auth, {})).rejects.toThrow(LifecycleConflictError);
  });
});
