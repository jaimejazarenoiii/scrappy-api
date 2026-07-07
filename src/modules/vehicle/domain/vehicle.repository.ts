import type { VehicleStatus } from './vehicle-status.js';
import type { VehicleEntity } from './vehicle.entity.js';

export interface CreateVehicleInput {
  id: string;
  companyId: string;
  plateNumber: string;
  description: string;
  status?: VehicleStatus;
  createdByUserId?: string | null;
}

export interface UpdateVehicleInput {
  plateNumber?: string;
  description?: string;
  status?: VehicleStatus;
  updatedByUserId?: string | null;
}

export interface ListVehiclesQuery {
  page: number;
  limit: number;
  sortBy?: 'plateNumber' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: VehicleStatus;
}

export interface ListVehiclesResult {
  items: VehicleEntity[];
  total: number;
}

export interface VehicleRepository {
  create(input: CreateVehicleInput): Promise<VehicleEntity>;
  findById(vehicleId: string, companyId: string): Promise<VehicleEntity | null>;
  findByPlateNumber(plateNumber: string, companyId: string): Promise<VehicleEntity | null>;
  update(vehicleId: string, companyId: string, input: UpdateVehicleInput): Promise<VehicleEntity>;
  softDelete(vehicleId: string, companyId: string): Promise<VehicleEntity>;
  list(companyId: string, query: ListVehiclesQuery): Promise<ListVehiclesResult>;
}
