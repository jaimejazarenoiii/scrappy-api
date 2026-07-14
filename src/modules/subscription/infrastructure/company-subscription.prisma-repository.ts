import { prisma } from '../../../database/prisma.client.js';
import { ResourceNotFoundError } from '../../../shared/errors/http-exceptions.js';
import type {
  CompanySubscriptionRepository,
  CreateCompanySubscriptionInput,
  ListCompanySubscriptionsQuery,
  ListCompanySubscriptionsResult,
  UpdateCompanySubscriptionInput,
} from '../domain/company-subscription.repository.js';
import type { SubscriptionPeriodStatus } from '../domain/subscription-period-status.js';
import { toCompanySubscriptionDomain } from './mappers/company-subscription.mapper.js';

export class CompanySubscriptionPrismaRepository implements CompanySubscriptionRepository {
  async create(input: CreateCompanySubscriptionInput) {
    return toCompanySubscriptionDomain(
      await prisma.companySubscription.create({
        data: {
          id: input.id,
          companyId: input.companyId,
          planName: input.planName,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          status: input.status,
          notes: input.notes ?? null,
          createdBy: input.createdBy,
        },
      }),
    );
  }

  async findById(subscriptionId: string, companyId: string) {
    const record = await prisma.companySubscription.findFirst({
      where: { id: subscriptionId, companyId },
    });
    return record ? toCompanySubscriptionDomain(record) : null;
  }

  async listByCompany(
    companyId: string,
    query: ListCompanySubscriptionsQuery,
  ): Promise<ListCompanySubscriptionsResult> {
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
    const [records, total] = await Promise.all([
      prisma.companySubscription.findMany({
        where: { companyId },
        orderBy: { startsAt: sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.companySubscription.count({ where: { companyId } }),
    ]);
    return { items: records.map(toCompanySubscriptionDomain), total };
  }

  async listAllByCompany(companyId: string) {
    const records = await prisma.companySubscription.findMany({
      where: { companyId },
      orderBy: { startsAt: 'asc' },
    });
    return records.map(toCompanySubscriptionDomain);
  }

  async findActiveByCompany(companyId: string) {
    const record = await prisma.companySubscription.findFirst({
      where: { companyId, status: 'ACTIVE' },
    });
    return record ? toCompanySubscriptionDomain(record) : null;
  }

  async updateStatus(subscriptionId: string, companyId: string, status: SubscriptionPeriodStatus) {
    const existing = await this.findById(subscriptionId, companyId);
    if (!existing) throw new ResourceNotFoundError('Subscription not found');
    return toCompanySubscriptionDomain(
      await prisma.companySubscription.update({
        where: { id: subscriptionId },
        data: { status },
      }),
    );
  }

  async update(subscriptionId: string, companyId: string, input: UpdateCompanySubscriptionInput) {
    const existing = await this.findById(subscriptionId, companyId);
    if (!existing) throw new ResourceNotFoundError('Subscription not found');
    return toCompanySubscriptionDomain(
      await prisma.companySubscription.update({
        where: { id: subscriptionId },
        data: {
          ...(input.planName !== undefined ? { planName: input.planName } : {}),
          ...(input.startsAt !== undefined ? { startsAt: input.startsAt } : {}),
          ...(input.endsAt !== undefined ? { endsAt: input.endsAt } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
        },
      }),
    );
  }
}
