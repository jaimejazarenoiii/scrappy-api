import type { VehicleStatus } from '../../domain/vehicle-status.js';

export interface CreateVehicleRequestDto {
  plateNumber: string;
  description: string;
  status: VehicleStatus;
}

export interface UpdateVehicleRequestDto {
  plateNumber?: string;
  description?: string;
  status?: VehicleStatus;
}

export interface VehicleResponseDto {
  id: string;
  companyId: string;
  plateNumber: string;
  description: string;
  status: VehicleStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdByUserId: string | null;
  updatedByUserId: string | null;
}
