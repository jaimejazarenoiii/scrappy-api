import { describe, expect, it } from 'vitest';
import { GetPasswordStatusUseCase } from '../../../src/modules/user/application/use-cases/get-password-status.use-case.js';
import { InMemoryUserRepository } from '../../setup/in-memory-repositories.js';

describe('GetPasswordStatusUseCase', () => {
  it('returns password change required status', async () => {
    const users = new InMemoryUserRepository();
    await users.create({
      id: 'u1',
      companyId: 'c1',
      email: 'a@test.com',
      passwordHash: 'hashed:x',
      role: 'EMPLOYEE',
      passwordChangeRequired: true,
      passwordChangedAt: new Date('2026-07-13T00:00:00.000Z'),
    });

    const result = await new GetPasswordStatusUseCase(users).execute('u1', 'c1');
    expect(result.passwordChangeRequired).toBe(true);
    expect(result.passwordChangedAt).toBe('2026-07-13T00:00:00.000Z');
  });
});
