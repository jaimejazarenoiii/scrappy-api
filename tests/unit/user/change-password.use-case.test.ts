import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/config/logger.js', () => ({
  getLogger: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() }),
}));

import { ChangePasswordUseCase } from '../../../src/modules/user/application/use-cases/change-password.use-case.js';
import { ValidationAppError } from '../../../src/shared/errors/http-exceptions.js';
import {
  FakePasswordHasher,
  InMemorySessionRepository,
  InMemoryUserRepository,
} from '../../setup/in-memory-repositories.js';

describe('ChangePasswordUseCase', () => {
  it('updates hash, clears flag, and revokes sessions', async () => {
    const users = new InMemoryUserRepository();
    const sessions = new InMemorySessionRepository();
    const hasher = new FakePasswordHasher();
    const user = await users.create({
      id: 'u1',
      companyId: 'c1',
      email: 'a@test.com',
      passwordHash: 'hashed:oldpass12',
      role: 'EMPLOYEE',
      passwordChangeRequired: true,
    });
    await sessions.create({
      id: 's1',
      userId: user.id,
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 60_000),
    });

    const useCase = new ChangePasswordUseCase(users, hasher, sessions);
    const result = await useCase.execute(user.id, 'c1', {
      currentPassword: 'oldpass12',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123',
    });

    expect(result.passwordChangeRequired).toBe(false);
    expect(result.passwordChangedAt).toBeTruthy();
    const updated = await users.findById(user.id, 'c1');
    expect(updated?.passwordHash).toBe('hashed:newpass123');
    expect(updated?.passwordChangeRequired).toBe(false);
    expect((await sessions.findById('s1'))?.revokedAt).not.toBeNull();
  });

  it('rejects incorrect current password without mutating', async () => {
    const users = new InMemoryUserRepository();
    const sessions = new InMemorySessionRepository();
    const hasher = new FakePasswordHasher();
    const revokeSpy = vi.spyOn(sessions, 'revokeAllForUser');
    const user = await users.create({
      id: 'u1',
      companyId: 'c1',
      email: 'a@test.com',
      passwordHash: 'hashed:oldpass12',
      role: 'EMPLOYEE',
    });

    const useCase = new ChangePasswordUseCase(users, hasher, sessions);
    await expect(
      useCase.execute(user.id, 'c1', {
        currentPassword: 'wrongpass',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123',
      }),
    ).rejects.toBeInstanceOf(ValidationAppError);

    const unchanged = await users.findById(user.id, 'c1');
    expect(unchanged?.passwordHash).toBe('hashed:oldpass12');
    expect(revokeSpy).not.toHaveBeenCalled();
  });
});
