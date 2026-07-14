import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { GetCurrentSubscriptionUseCase } from '../../../src/modules/subscription/application/use-cases/get-current-subscription.use-case.js';
import { ResourceNotFoundError } from '../../../src/shared/errors/http-exceptions.js';
import { InMemoryCompanyRepository } from '../../setup/in-memory-repositories.js';
import { InMemoryCompanySubscriptionRepository } from '../../setup/subscription-helpers.js';

describe('GetCurrentSubscriptionUseCase', () => {
  const superAdminAuth = {
    companyId: 'platform',
    userId: 'admin-1',
    role: 'SUPER_ADMIN' as const,
  };

  it('returns the ACTIVE subscription period', async () => {
    const companyRepository = new InMemoryCompanyRepository();
    const subscriptionRepository = new InMemoryCompanySubscriptionRepository();
    const useCase = new GetCurrentSubscriptionUseCase(companyRepository, subscriptionRepository);

    await companyRepository.create({ id: 'c1', name: 'Acme' });
    await subscriptionRepository.create({
      id: randomUUID(),
      companyId: 'c1',
      planName: 'Pro',
      startsAt: new Date('2026-01-01T00:00:00.000Z'),
      endsAt: new Date('2026-12-31T23:59:59.999Z'),
      status: 'ACTIVE',
      createdBy: 'admin-1',
      activatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const result = await useCase.execute(superAdminAuth, 'c1');

    expect(result.status).toBe('ACTIVE');
    expect(result.planName).toBe('Pro');
    expect(result.activatedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('throws when no ACTIVE period exists', async () => {
    const companyRepository = new InMemoryCompanyRepository();
    const subscriptionRepository = new InMemoryCompanySubscriptionRepository();
    const useCase = new GetCurrentSubscriptionUseCase(companyRepository, subscriptionRepository);

    await companyRepository.create({ id: 'c1', name: 'Acme' });

    await expect(useCase.execute(superAdminAuth, 'c1')).rejects.toBeInstanceOf(
      ResourceNotFoundError,
    );
  });
});
