import type { CompanySubscriptionEntity } from './company-subscription.entity.js';
import type { SubscriptionPeriodStatus } from './subscription-period-status.js';

export interface CreateCompanySubscriptionInput {
  id: string;
  companyId: string;
  planName: string;
  startsAt: Date;
  endsAt: Date;
  status: SubscriptionPeriodStatus;
  notes?: string | null;
  createdBy: string;
}

export interface UpdateCompanySubscriptionInput {
  planName?: string;
  startsAt?: Date;
  endsAt?: Date;
  status?: SubscriptionPeriodStatus;
  notes?: string | null;
}

export interface ListCompanySubscriptionsQuery {
  page: number;
  limit: number;
  sortOrder?: 'asc' | 'desc';
}

export interface ListCompanySubscriptionsResult {
  items: CompanySubscriptionEntity[];
  total: number;
}

export interface CompanySubscriptionRepository {
  create(input: CreateCompanySubscriptionInput): Promise<CompanySubscriptionEntity>;
  findById(subscriptionId: string, companyId: string): Promise<CompanySubscriptionEntity | null>;
  listByCompany(
    companyId: string,
    query: ListCompanySubscriptionsQuery,
  ): Promise<ListCompanySubscriptionsResult>;
  listAllByCompany(companyId: string): Promise<CompanySubscriptionEntity[]>;
  findActiveByCompany(companyId: string): Promise<CompanySubscriptionEntity | null>;
  updateStatus(
    subscriptionId: string,
    companyId: string,
    status: SubscriptionPeriodStatus,
  ): Promise<CompanySubscriptionEntity>;
  update(
    subscriptionId: string,
    companyId: string,
    input: UpdateCompanySubscriptionInput,
  ): Promise<CompanySubscriptionEntity>;
}
