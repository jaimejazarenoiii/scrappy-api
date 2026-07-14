import { describe, expect, it } from 'vitest';
import { TripEntity } from '../../../src/modules/trip/domain/trip.entity.js';

function buildEntity(overrides: Partial<Parameters<typeof TripEntity.create>[0]> = {}) {
  const now = new Date();
  return TripEntity.create({
    id: 't1',
    companyId: 'c1',
    tripNumber: 'TRIP-20260708-000001',
    vehicleId: 'v1',
    status: 'DRAFT',
    scheduledStart: now,
    actualStart: null,
    actualEnd: null,
    origin: 'Origin',
    destination: 'Destination',
    notes: null,
    startingOdometer: null,
    endingOdometer: null,
    loadEnabled: true,
    strictLoadValidation: false,
    createdByUserId: 'u1',
    updatedByUserId: null,
    startedByUserId: null,
    completedByUserId: null,
    cancelledByUserId: null,
    cancellationReason: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  });
}

describe('TripEntity', () => {
  it('reports draft status and location helpers', () => {
    const entity = buildEntity();
    expect(entity.isDraft()).toBe(true);
    expect(entity.isCancelled()).toBe(false);
    expect(entity.isArchived()).toBe(false);
    expect(entity.belongsToCompany('c1')).toBe(true);
    expect(entity.belongsToCompany('other')).toBe(false);
  });

  it('detects cancelled and archived states', () => {
    expect(buildEntity({ status: 'CANCELLED' }).isCancelled()).toBe(true);
    expect(buildEntity({ deletedAt: new Date() }).isArchived()).toBe(true);
  });

  it('reports editability by role', () => {
    expect(buildEntity().isEditableBy('MANAGER')).toBe(true);
    expect(buildEntity().isEditableBy('OWNER')).toBe(true);
    expect(buildEntity().isEditableBy('EMPLOYEE')).toBe(false);
    expect(buildEntity({ status: 'STARTED' }).isEditableBy('MANAGER')).toBe(false);
    expect(buildEntity({ status: 'COMPLETED' }).isEditableBy('MANAGER')).toBe(false);
  });

  it('exposes an immutable primitives copy', () => {
    const entity = buildEntity();
    const primitives = entity.toPrimitives();
    primitives.origin = 'Mutated';
    expect(entity.toPrimitives().origin).toBe('Origin');
  });
});
