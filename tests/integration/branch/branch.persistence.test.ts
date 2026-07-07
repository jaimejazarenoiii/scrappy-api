import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { InMemoryBranchRepository } from '../../setup/in-memory-repositories.js';

describe('branch persistence', () => {
  it('scopes queries by company and excludes archived records', async () => {
    const repo = new InMemoryBranchRepository();
    const branch = await repo.create({
      id: randomUUID(),
      companyId: 'c1',
      name: 'Main',
      address: '123',
      contactNumber: '0917',
    });
    expect(await repo.findById(branch.id, 'c1')).not.toBeNull();
    expect(await repo.findById(branch.id, 'c2')).toBeNull();
    await repo.softDelete(branch.id, 'c1');
    expect(await repo.findById(branch.id, 'c1')).toBeNull();
    const list = await repo.list('c1', { page: 1, limit: 20 });
    expect(list.total).toBe(0);
  });
});
