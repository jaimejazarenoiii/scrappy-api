import type { Request } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { createPasswordChangeGateMiddleware } from '../../../src/middleware/password-change-gate.middleware.js';
import { PasswordChangeRequiredError } from '../../../src/shared/errors/http-exceptions.js';
import { InMemoryUserRepository } from '../../setup/in-memory-repositories.js';

function mockReq(
  partial: Partial<Request> & { auth?: Request['auth']; path: string; method: string },
) {
  return partial as Request;
}

describe('password-change-gate middleware', () => {
  it('allows allowlisted routes when flag is true', async () => {
    const users = new InMemoryUserRepository();
    await users.create({
      id: 'u1',
      companyId: 'c1',
      email: 'a@test.com',
      passwordHash: 'hashed:x',
      role: 'EMPLOYEE',
      passwordChangeRequired: true,
    });
    const gate = createPasswordChangeGateMiddleware(users);
    const next = vi.fn();

    await gate(
      mockReq({
        method: 'POST',
        path: '/users/me/password',
        auth: { userId: 'u1', companyId: 'c1', role: 'EMPLOYEE' },
      }),
      {} as never,
      next,
    );
    expect(next).toHaveBeenCalledWith();
  });

  it('blocks non-allowlisted routes when flag is true', async () => {
    const users = new InMemoryUserRepository();
    await users.create({
      id: 'u1',
      companyId: 'c1',
      email: 'a@test.com',
      passwordHash: 'hashed:x',
      role: 'EMPLOYEE',
      passwordChangeRequired: true,
    });
    const gate = createPasswordChangeGateMiddleware(users);
    const next = vi.fn();

    await gate(
      mockReq({
        method: 'GET',
        path: '/employees',
        auth: { userId: 'u1', companyId: 'c1', role: 'EMPLOYEE' },
      }),
      {} as never,
      next,
    );
    expect(next.mock.calls[0]?.[0]).toBeInstanceOf(PasswordChangeRequiredError);
  });

  it('allows non-allowlisted routes when flag is false', async () => {
    const users = new InMemoryUserRepository();
    await users.create({
      id: 'u1',
      companyId: 'c1',
      email: 'a@test.com',
      passwordHash: 'hashed:x',
      role: 'EMPLOYEE',
      passwordChangeRequired: false,
    });
    const gate = createPasswordChangeGateMiddleware(users);
    const next = vi.fn();

    await gate(
      mockReq({
        method: 'GET',
        path: '/employees',
        auth: { userId: 'u1', companyId: 'c1', role: 'EMPLOYEE' },
      }),
      {} as never,
      next,
    );
    expect(next).toHaveBeenCalledWith();
  });
});
