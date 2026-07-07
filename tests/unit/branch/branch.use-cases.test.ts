import { describe, expect, it, beforeAll } from 'vitest';
import { ArchiveBranchUseCase } from '../../../src/modules/branch/application/use-cases/archive-branch.use-case.js';
import { CreateBranchUseCase } from '../../../src/modules/branch/application/use-cases/create-branch.use-case.js';
import { ListBranchesUseCase } from '../../../src/modules/branch/application/use-cases/list-branches.use-case.js';
import { LifecycleConflictError } from '../../../src/shared/errors/http-exceptions.js';
import { InMemoryBranchRepository } from '../../setup/in-memory-repositories.js';
import { setupTestEnv } from '../../setup/test-app.js';

describe('branch use cases', () => {
  beforeAll(() => {
    setupTestEnv();
  });
  it('creates, lists, and archives branches', async () => {
    const repo = new InMemoryBranchRepository();
    const create = new CreateBranchUseCase(repo);
    const list = new ListBranchesUseCase(repo);
    const archive = new ArchiveBranchUseCase(repo);

    const branch = await create.execute('c1', {
      name: 'Main',
      address: '123 St',
      contactNumber: '0917',
      status: 'ACTIVE',
    });
    expect(branch.name).toBe('Main');

    const listed = await list.execute('c1', { page: 1, limit: 20 });
    expect(listed.items).toHaveLength(1);

    await archive.execute(branch.id, 'c1');
    const afterArchive = await list.execute('c1', { page: 1, limit: 20 });
    expect(afterArchive.items).toHaveLength(0);
  });

  it('rejects double archive', async () => {
    const repo = new InMemoryBranchRepository();
    const create = new CreateBranchUseCase(repo);
    const archive = new ArchiveBranchUseCase(repo);
    const branch = await create.execute('c1', {
      name: 'Main',
      address: '123 St',
      contactNumber: '0917',
      status: 'ACTIVE',
    });
    await archive.execute(branch.id, 'c1');
    await expect(archive.execute(branch.id, 'c1')).rejects.toThrow(LifecycleConflictError);
  });
});
