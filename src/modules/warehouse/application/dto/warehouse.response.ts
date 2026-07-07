import type { WarehouseStatus } from '../../domain/warehouse-status.js';

export interface CreateWarehouseRequestDto {
  name: string;
  address: string;
  contactNumber: string;
  status: WarehouseStatus;
}

export interface UpdateWarehouseRequestDto {
  name?: string;
  address?: string;
  contactNumber?: string;
  status?: WarehouseStatus;
}

export interface WarehouseResponseDto {
  id: string;
  companyId: string;
  name: string;
  address: string;
  contactNumber: string;
  status: WarehouseStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdByUserId: string | null;
  updatedByUserId: string | null;
}
