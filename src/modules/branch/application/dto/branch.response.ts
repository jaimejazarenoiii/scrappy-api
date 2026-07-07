import type { BranchStatus } from '../../domain/branch-status.js';

export interface CreateBranchRequestDto {
  name: string;
  address: string;
  contactNumber: string;
  status: BranchStatus;
}

export interface UpdateBranchRequestDto {
  name?: string;
  address?: string;
  contactNumber?: string;
  status?: BranchStatus;
}

export interface BranchResponseDto {
  id: string;
  companyId: string;
  name: string;
  address: string;
  contactNumber: string;
  status: BranchStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdByUserId: string | null;
  updatedByUserId: string | null;
}
