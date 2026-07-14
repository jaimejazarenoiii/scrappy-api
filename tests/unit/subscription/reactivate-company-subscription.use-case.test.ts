import { beforeEach, describe, expect, it } from 'vitest';
import { ReactivateCompanySubscriptionUseCase } from '../../../src/modules/subscription/application/use-cases/reactivate-company-subscription.use-case.js';
import { SubscriptionAccountCascadeService } from '../../../src/modules/subscription/application/services/subscription-account-cascade.service.js';
import { BusinessRuleViolationError } from '../../../src/shared/errors/http-exceptions.js';
import {
  InMemoryCompanyRepository,
  InMemorySessionRepository,
  InMemoryUserRepository,
} from '../../setup/in-memory-repositories.js';

describe('ReactivateCompanySubscriptionUseCase', () => {
  beforeEach(() => {
    process.env.DATABASE_URL =
      'postgresql://postgres:postgres@localhost:5432/scrappy?schema=public';
  });
  const superAdminAuth = {
    companyId: 'platform',
    userId: 'admin-1',
    role: 'SUPER_ADMIN' as const,
  };

  it('reactivates a suspended company to ACTIVE', async () => {
    const companyRepository = new InMemoryCompanyRepository();
    const userRepository = new InMemoryUserRepository();
    const sessionRepository = new InMemorySessionRepository();
    const cascadeService = new SubscriptionAccountCascadeService(
      companyRepository,
      userRepository,
      sessionRepository,
    );
    const useCase = new ReactivateCompanySubscriptionUseCase(companyRepository, cascadeService);

    await companyRepository.create({ id: 'c1', name: 'Acme' });
    await cascadeService.applyForSubscriptionStatus('c1', 'SUSPENDED');
    await userRepository.create({
      id: 'u1',
      companyId: 'c1',
      email: 'owner@test.com',
      passwordHash: 'h',
      role: 'OWNER',
      status: 'INACTIVE',
    });

    const result = await useCase.execute(superAdminAuth, 'c1', {});

    expect(result.subscriptionStatus).toBe('ACTIVE');
    expect(companyRepository.companies.get('c1')!.subscriptionStatus).toBe('ACTIVE');
    expect(companyRepository.companies.get('c1')!.status).toBe('ACTIVE');
    expect(userRepository.users.get('u1')!.status).toBe('ACTIVE');
  });

  it('rejects reactivate when company is not suspended', async () => {
    const companyRepository = new InMemoryCompanyRepository();
    const cascadeService = new SubscriptionAccountCascadeService(
      companyRepository,
      new InMemoryUserRepository(),
      new InMemorySessionRepository(),
    );
    const useCase = new ReactivateCompanySubscriptionUseCase(companyRepository, cascadeService);

    await companyRepository.create({ id: 'c1', name: 'Acme' });

    await expect(useCase.execute(superAdminAuth, 'c1', {})).rejects.toBeInstanceOf(
      BusinessRuleViolationError,
    );
  });

  it('rejects reactivate for expired company', async () => {
    const companyRepository = new InMemoryCompanyRepository();
    const cascadeService = new SubscriptionAccountCascadeService(
      companyRepository,
      new InMemoryUserRepository(),
      new InMemorySessionRepository(),
    );
    const useCase = new ReactivateCompanySubscriptionUseCase(companyRepository, cascadeService);

    await companyRepository.create({ id: 'c1', name: 'Acme' });
    await cascadeService.applyForSubscriptionStatus('c1', 'EXPIRED');

    await expect(useCase.execute(superAdminAuth, 'c1', {})).rejects.toBeInstanceOf(
      BusinessRuleViolationError,
    );
  });
});
