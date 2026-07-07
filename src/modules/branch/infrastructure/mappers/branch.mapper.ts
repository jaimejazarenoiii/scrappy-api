import type { Branch } from '@prisma/client';
import { BranchEntity as BranchModel } from '../../domain/branch.entity.js';
import type { BranchEntity } from '../../domain/branch.entity.js';

export function toBranchDomain(record: Branch): BranchEntity {
  return BranchModel.create({
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
