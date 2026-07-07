import type { Vehicle } from '@prisma/client';
import { VehicleEntity as VehicleModel } from '../../domain/vehicle.entity.js';
import type { VehicleEntity } from '../../domain/vehicle.entity.js';

export function toVehicleDomain(record: Vehicle): VehicleEntity {
  return VehicleModel.create({
    id: record.id,
    companyId: record.companyId,
    plateNumber: record.plateNumber,
    description: record.description,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    deletedAt: record.deletedAt,
    createdByUserId: record.createdByUserId,
    updatedByUserId: record.updatedByUserId,
  });
}
