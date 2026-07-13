import { describe, expect, it } from 'vitest';
import { LoginUseCase } from '../../../src/modules/auth/application/use-cases/login.use-case.js';
import { LogoutUseCase } from '../../../src/modules/auth/application/use-cases/logout.use-case.js';
import { RefreshSessionUseCase } from '../../../src/modules/auth/application/use-cases/refresh-session.use-case.js';
import { JwtTokenProvider } from '../../../src/modules/auth/infrastructure/jwt-token-provider.js';
import { makeCompanyPayload } from '../../factories/company.factory.js';
import {
  FakePasswordHasher,
  InMemoryCompanyRepository,
  InMemorySessionRepository,
  InMemoryUserRepository,
} from '../../setup/in-memory-repositories.js';
import { setupTestEnv } from '../../setup/test-app.js';
import { CreateCompanyWithOwnerUseCase } from '../../../src/modules/company/application/use-cases/create-company-with-owner.use-case.js';

describe('auth lifecycle use cases', () => {
  it('logs in, refreshes, and logs out', async () => {
    setupTestEnv();
    const companyRepo = new InMemoryCompanyRepository();
    const userRepo = new InMemoryUserRepository();
    const sessionRepo = new InMemorySessionRepository();
    const hasher = new FakePasswordHasher();
    const tokenProvider = new JwtTokenProvider();
    await new CreateCompanyWithOwnerUseCase(companyRepo, userRepo, hasher).execute(
      makeCompanyPayload(),
    );
    const login = await new LoginUseCase(
      userRepo,
      companyRepo,
      sessionRepo,
      hasher,
      tokenProvider,
    ).execute('owner@scrappy.test', 'password123');
    expect(login.accessToken).toBeTruthy();
    const refreshed = await new RefreshSessionUseCase(sessionRepo, tokenProvider).execute(
      login.refreshToken,
    );
    expect(refreshed.accessToken).toBeTruthy();
    const payload = tokenProvider.verifyAccessToken(login.accessToken);
    const logout = await new LogoutUseCase(sessionRepo).execute({
      sessionId: payload.sessionId,
      companyId: payload.companyId,
      userId: payload.sub,
    });
    expect(logout.loggedOut).toBe(true);
  });
});
