import { describe, expect, it } from 'vitest';
import { SubscriptionAccountCascadeService } from '../../../src/modules/subscription/application/services/subscription-account-cascade.service.js';
import {
  InMemoryCompanyRepository,
  InMemorySessionRepository,
  InMemoryUserRepository,
} from '../../setup/in-memory-repositories.js';

describe('subscription account cascade', () => {
  it('activates company and users for allowed subscription status', async () => {
    const companyRepository = new InMemoryCompanyRepository();
    const userRepository = new InMemoryUserRepository();
    const sessionRepository = new InMemorySessionRepository();
    const service = new SubscriptionAccountCascadeService(
      companyRepository,
      userRepository,
      sessionRepository,
    );

    await companyRepository.create({
      id: 'c1',
      name: 'Acme',
    });
    await userRepository.create({
      id: 'u1',
      companyId: 'c1',
      email: 'a@test.com',
      passwordHash: 'h',
      role: 'OWNER',
      status: 'INACTIVE',
    });

    await service.applyForSubscriptionStatus('c1', 'ACTIVE');

    const company = companyRepository.companies.get('c1')!;
    expect(company.status).toBe('ACTIVE');
    expect(company.subscriptionStatus).toBe('ACTIVE');
    expect(userRepository.users.get('u1')!.status).toBe('ACTIVE');
  });

  it('inactivates company and users and revokes sessions when blocked', async () => {
    const companyRepository = new InMemoryCompanyRepository();
    const userRepository = new InMemoryUserRepository();
    const sessionRepository = new InMemorySessionRepository();
    const service = new SubscriptionAccountCascadeService(
      companyRepository,
      userRepository,
      sessionRepository,
    );

    await companyRepository.create({ id: 'c1', name: 'Acme' });
    await userRepository.create({
      id: 'u1',
      companyId: 'c1',
      email: 'a@test.com',
      passwordHash: 'h',
      role: 'OWNER',
    });
    await sessionRepository.create({
      id: 's1',
      userId: 'u1',
      tokenHash: 't',
      expiresAt: new Date(Date.now() + 3600000),
    });

    await service.applyForSubscriptionStatus('c1', 'EXPIRED');

    const company = companyRepository.companies.get('c1')!;
    expect(company.status).toBe('INACTIVE');
    expect(company.subscriptionStatus).toBe('EXPIRED');
    expect(userRepository.users.get('u1')!.status).toBe('INACTIVE');
    expect(sessionRepository.sessions.get('s1')!.revokedAt).not.toBeNull();
  });
});
