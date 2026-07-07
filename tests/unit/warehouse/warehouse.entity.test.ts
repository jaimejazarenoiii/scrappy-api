import { describe, expect, it } from 'vitest';
import { WarehouseEntity } from '../../../src/modules/warehouse/domain/warehouse.entity.js';

describe('warehouse entity', () => {
  it('is operationally eligible when active and not deleted', () => {
    const warehouse = WarehouseEntity.create({
      id: 'w1',
      companyId: 'c1',
      name: 'Central',
      address: '456',
      contactNumber: '0918',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdByUserId: null,
      updatedByUserId: null,
    });
    expect(warehouse.isOperationallyEligible()).toBe(true);
  });
});
