import { describe, expect, it } from 'vitest';
import { BranchEntity } from '../../../src/modules/branch/domain/branch.entity.js';

describe('branch entity', () => {
  const base = {
    id: 'b1',
    companyId: 'c1',
    name: 'Main',
    address: '123 St',
    contactNumber: '0917',
    status: 'ACTIVE' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdByUserId: null,
    updatedByUserId: null,
  };

  it('reports active and operationally eligible when not deleted', () => {
    const branch = BranchEntity.create(base);
    expect(branch.isActive()).toBe(true);
    expect(branch.isOperationallyEligible()).toBe(true);
    expect(branch.isDeleted()).toBe(false);
  });

  it('is not operationally eligible when inactive or deleted', () => {
    const inactive = BranchEntity.create({ ...base, status: 'INACTIVE' });
    const deleted = BranchEntity.create({ ...base, deletedAt: new Date() });
    expect(inactive.isOperationallyEligible()).toBe(false);
    expect(deleted.isOperationallyEligible()).toBe(false);
  });
});
