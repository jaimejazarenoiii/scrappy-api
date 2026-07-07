import { describe, expect, it } from 'vitest';
import { BranchEntity } from '../../../src/modules/branch/domain/branch.entity.js';
import { assertBranchNameAvailable } from '../../../src/modules/branch/domain/branch-rules.js';
import { DuplicateResourceError } from '../../../src/shared/errors/http-exceptions.js';

describe('branch rules', () => {
  it('rejects duplicate active branch names', () => {
    const existing = BranchEntity.create({
      id: 'b1',
      companyId: 'c1',
      name: 'Main',
      address: '123',
      contactNumber: '0917',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdByUserId: null,
      updatedByUserId: null,
    });
    expect(() => assertBranchNameAvailable(existing)).toThrow(DuplicateResourceError);
  });

  it('allows same name when updating same branch', () => {
    const existing = BranchEntity.create({
      id: 'b1',
      companyId: 'c1',
      name: 'Main',
      address: '123',
      contactNumber: '0917',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdByUserId: null,
      updatedByUserId: null,
    });
    expect(() => assertBranchNameAvailable(existing, 'b1')).not.toThrow();
  });
});
