import type { CompanyEntity } from './company.entity.js';

export interface CreateCompanyInput {
  id: string;
  name: string;
  logoUrl?: string | null;
  contactNumber?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface UpdateCompanyInput {
  name?: string;
  logoUrl?: string | null;
  contactNumber?: string | null;
  email?: string | null;
  address?: string | null;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface CompanyRepository {
  create(input: CreateCompanyInput): Promise<CompanyEntity>;
  findById(companyId: string): Promise<CompanyEntity | null>;
  findByName(name: string): Promise<CompanyEntity | null>;
  update(companyId: string, input: UpdateCompanyInput): Promise<CompanyEntity>;
  softDelete(companyId: string): Promise<CompanyEntity>;
}
