import type { CompanyEntity } from './company.entity.js';

export interface CreateCompanyInput {
  id: string;
  name: string;
  logoUrl?: string | null;
  contactNumber?: string | null;
  email?: string | null;
  address?: string | null;
}

import type { CompanySubscriptionStatus } from './company-subscription-status.js';

export interface UpdateCompanyInput {
  name?: string;
  logoUrl?: string | null;
  contactNumber?: string | null;
  email?: string | null;
  address?: string | null;
  status?: 'ACTIVE' | 'INACTIVE';
  subscriptionStatus?: CompanySubscriptionStatus;
  defaultStrictLoadValidation?: boolean;
}

export interface ListCompaniesQuery {
  page: number;
  limit: number;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface ListCompaniesResult {
  items: CompanyEntity[];
  total: number;
}

export interface CompanyRepository {
  create(input: CreateCompanyInput): Promise<CompanyEntity>;
  findById(companyId: string): Promise<CompanyEntity | null>;
  findByName(name: string): Promise<CompanyEntity | null>;
  list(query: ListCompaniesQuery): Promise<ListCompaniesResult>;
  update(companyId: string, input: UpdateCompanyInput): Promise<CompanyEntity>;
  softDelete(companyId: string): Promise<CompanyEntity>;
}
