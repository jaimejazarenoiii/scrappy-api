import { randomUUID } from 'node:crypto';
import { ResourceNotFoundError } from '../../src/shared/errors/http-exceptions.js';
import request from 'supertest';
import type { Express } from 'express';
import {
  CompanySubscriptionEntity as CompanySubscriptionModel,
  type CompanySubscriptionEntity,
} from '../../src/modules/subscription/domain/company-subscription.entity.js';
import type {
  CompanySubscriptionRepository,
  CreateCompanySubscriptionInput,
  ListCompanySubscriptionsQuery,
  ListCompanySubscriptionsResult,
  UpdateCompanySubscriptionInput,
} from '../../src/modules/subscription/domain/company-subscription.repository.js';
import type { SubscriptionPeriodStatus } from '../../src/modules/subscription/domain/subscription-period-status.js';

function paginate<T>(
  items: T[],
  query: ListCompanySubscriptionsQuery,
): ListCompanySubscriptionsResult {
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
  const sorted = [...items].sort(
    (left, right) =>
      sortOrder *
      ((left as CompanySubscriptionEntity).startsAt.getTime() -
        (right as CompanySubscriptionEntity).startsAt.getTime()),
  );
  const start = (query.page - 1) * query.limit;
  return { items: sorted.slice(start, start + query.limit), total: items.length };
}

export class InMemoryCompanySubscriptionRepository implements CompanySubscriptionRepository {
  public subscriptions = new Map<string, CompanySubscriptionEntity>();

  async create(input: CreateCompanySubscriptionInput): Promise<CompanySubscriptionEntity> {
    const now = new Date();
    const subscription = CompanySubscriptionModel.create({
      id: input.id,
      companyId: input.companyId,
      planName: input.planName,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      status: input.status,
      notes: input.notes ?? null,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    });
    this.subscriptions.set(subscription.id, subscription);
    return subscription;
  }

  async findById(
    subscriptionId: string,
    companyId: string,
  ): Promise<CompanySubscriptionEntity | null> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription || subscription.companyId !== companyId) return null;
    return subscription;
  }

  async listByCompany(
    companyId: string,
    query: ListCompanySubscriptionsQuery,
  ): Promise<ListCompanySubscriptionsResult> {
    const items = [...this.subscriptions.values()].filter((s) => s.companyId === companyId);
    return paginate(items, query);
  }

  async listAllByCompany(companyId: string): Promise<CompanySubscriptionEntity[]> {
    return [...this.subscriptions.values()]
      .filter((s) => s.companyId === companyId)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  }

  async findActiveByCompany(companyId: string): Promise<CompanySubscriptionEntity | null> {
    return (
      [...this.subscriptions.values()].find(
        (s) => s.companyId === companyId && s.status === 'ACTIVE',
      ) ?? null
    );
  }

  async updateStatus(
    subscriptionId: string,
    companyId: string,
    status: SubscriptionPeriodStatus,
  ): Promise<CompanySubscriptionEntity> {
    return this.update(subscriptionId, companyId, { status });
  }

  async update(
    subscriptionId: string,
    companyId: string,
    input: UpdateCompanySubscriptionInput,
  ): Promise<CompanySubscriptionEntity> {
    const existing = await this.findById(subscriptionId, companyId);
    if (!existing) throw new ResourceNotFoundError('Subscription not found');
    const updated = CompanySubscriptionModel.create({
      ...existing.toPrimitives(),
      ...(input.planName !== undefined ? { planName: input.planName } : {}),
      ...(input.startsAt !== undefined ? { startsAt: input.startsAt } : {}),
      ...(input.endsAt !== undefined ? { endsAt: input.endsAt } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      updatedAt: new Date(),
    });
    this.subscriptions.set(subscriptionId, updated);
    return updated;
  }
}

export async function createSuperAdminUser(
  userRepository: {
    create: (input: {
      id: string;
      companyId: string;
      email: string;
      passwordHash: string;
      role: 'SUPER_ADMIN';
    }) => Promise<unknown>;
  },
  companyId: string,
  email = 'superadmin@scrappy.test',
) {
  await userRepository.create({
    id: randomUUID(),
    companyId,
    email,
    passwordHash: 'hashed:password123',
    role: 'SUPER_ADMIN',
  });
}

/**
 * Logs in via `POST /api/v1/admin/auth/login` (tenant login rejects SUPER_ADMIN).
 */
export async function loginAsSuperAdmin(app: Express, email = 'superadmin@scrappy.test') {
  const login = await request(app)
    .post('/api/v1/admin/auth/login')
    .send({ identifier: email, password: 'password123' });
  if (login.status !== 200) {
    throw new Error(`Admin login failed: ${login.status} ${JSON.stringify(login.body)}`);
  }
  return { Authorization: `Bearer ${login.body.data.accessToken}` };
}
