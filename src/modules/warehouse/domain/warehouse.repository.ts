import type { WarehouseStatus } from './warehouse-status.js';
import type { WarehouseEntity } from './warehouse.entity.js';

export interface CreateWarehouseInput {
  id: string;
  companyId: string;
  name: string;
  address: string;
  contactNumber: string;
  status?: WarehouseStatus;
  createdByUserId?: string | null;
}

export interface UpdateWarehouseInput {
  name?: string;
  address?: string;
  contactNumber?: string;
  status?: WarehouseStatus;
  updatedByUserId?: string | null;
}

export interface ListWarehousesQuery {
  page: number;
  limit: number;
  sortBy?: 'name' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: WarehouseStatus;
}

export interface ListWarehousesResult {
  items: WarehouseEntity[];
  total: number;
}

export interface WarehouseRepository {
  create(input: CreateWarehouseInput): Promise<WarehouseEntity>;
  findById(warehouseId: string, companyId: string): Promise<WarehouseEntity | null>;
  findByName(name: string, companyId: string): Promise<WarehouseEntity | null>;
  update(
    warehouseId: string,
    companyId: string,
    input: UpdateWarehouseInput,
  ): Promise<WarehouseEntity>;
  softDelete(warehouseId: string, companyId: string): Promise<WarehouseEntity>;
  list(companyId: string, query: ListWarehousesQuery): Promise<ListWarehousesResult>;
}
