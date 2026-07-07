import { describe, expect, it } from 'vitest';
import { VehicleEntity } from '../../../src/modules/vehicle/domain/vehicle.entity.js';

describe('vehicle entity', () => {
  it('is operationally eligible only when available and not deleted', () => {
    const available = VehicleEntity.create({
      id: 'v1',
      companyId: 'c1',
      plateNumber: 'ABC-1234',
      description: 'Truck',
      status: 'AVAILABLE',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdByUserId: null,
      updatedByUserId: null,
    });
    const maintenance = VehicleEntity.create({
      ...available.toPrimitives(),
      status: 'MAINTENANCE',
    });
    expect(available.isOperationallyEligible()).toBe(true);
    expect(maintenance.isOperationallyEligible()).toBe(false);
  });
});
