import type { BranchStatus } from './branch-status.js';
import type { BranchEntity } from './branch.entity.js';

export interface CreateBranchInput {
  id: string;
  companyId: string;
  name: string;
  address: string;
  contactNumber: string;
  status?: BranchStatus;
  createdByUserId?: string | null;
}

export interface UpdateBranchInput {
  name?: string;
  address?: string;
  contactNumber?: string;
  status?: BranchStatus;
  updatedByUserId?: string | null;
}

export interface ListBranchesQuery {
  page: number;
  limit: number;
  sortBy?: 'name' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: BranchStatus;
}

export interface ListBranchesResult {
  items: BranchEntity[];
  total: number;
}

export interface BranchRepository {
  create(input: CreateBranchInput): Promise<BranchEntity>;
  findById(branchId: string, companyId: string): Promise<BranchEntity | null>;
  findByIdIncludingArchived(branchId: string, companyId: string): Promise<BranchEntity | null>;
  findByName(name: string, companyId: string): Promise<BranchEntity | null>;
  update(branchId: string, companyId: string, input: UpdateBranchInput): Promise<BranchEntity>;
  softDelete(branchId: string, companyId: string): Promise<BranchEntity>;
  list(companyId: string, query: ListBranchesQuery): Promise<ListBranchesResult>;
}
