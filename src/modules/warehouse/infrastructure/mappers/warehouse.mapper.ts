import type { Warehouse } from '@prisma/client';
import { WarehouseEntity as WarehouseModel } from '../../domain/warehouse.entity.js';
import type { WarehouseEntity } from '../../domain/warehouse.entity.js';

export function toWarehouseDomain(record: Warehouse): WarehouseEntity {
  return WarehouseModel.create({
    id: record.id,
    companyId: record.companyId,
    name: record.name,
    address: record.address,
    contactNumber: record.contactNumber,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    deletedAt: record.deletedAt,
    createdByUserId: record.createdByUserId,
    updatedByUserId: record.updatedByUserId,
  });
}
