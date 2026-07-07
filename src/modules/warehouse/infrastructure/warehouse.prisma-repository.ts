import type { Prisma } from '@prisma/client';
import { prisma } from '../../../database/prisma.client.js';
import { ResourceNotFoundError } from '../../../shared/errors/http-exceptions.js';
import type {
  WarehouseRepository,
  CreateWarehouseInput,
  ListWarehousesQuery,
  ListWarehousesResult,
  UpdateWarehouseInput,
} from '../domain/warehouse.repository.js';
import { toWarehouseDomain } from './mappers/warehouse.mapper.js';

function buildWhere(companyId: string, query: ListWarehousesQuery): Prisma.WarehouseWhereInput {
  const where: Prisma.WarehouseWhereInput = {
    companyId,
    deletedAt: null,
  };

  if (query.status) {
    where.status = query.status;
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { address: { contains: query.search, mode: 'insensitive' } },
      { contactNumber: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  return where;
}

function resolveOrderBy(query: ListWarehousesQuery): Prisma.WarehouseOrderByWithRelationInput {
  const sortBy = query.sortBy ?? 'createdAt';
  const sortOrder = query.sortOrder ?? 'asc';
  return { [sortBy]: sortOrder };
}

export class WarehousePrismaRepository implements WarehouseRepository {
  async create(input: CreateWarehouseInput) {
    const record = await prisma.warehouse.create({
      data: {
        id: input.id,
        companyId: input.companyId,
        name: input.name,
        address: input.address,
        contactNumber: input.contactNumber,
        status: input.status ?? 'ACTIVE',
        createdByUserId: input.createdByUserId ?? null,
      },
    });
    return toWarehouseDomain(record);
  }

  async findById(warehouseId: string, companyId: string) {
    const record = await prisma.warehouse.findFirst({
      where: { id: warehouseId, companyId, deletedAt: null },
    });
    return record ? toWarehouseDomain(record) : null;
  }

  async findByName(name: string, companyId: string) {
    const record = await prisma.warehouse.findFirst({
      where: { name, companyId, deletedAt: null },
    });
    return record ? toWarehouseDomain(record) : null;
  }

  async update(warehouseId: string, companyId: string, input: UpdateWarehouseInput) {
    const existing = await this.findById(warehouseId, companyId);
    if (!existing) throw new ResourceNotFoundError('Warehouse not found');
    const record = await prisma.warehouse.update({
      where: { id: warehouseId },
      data: input,
    });
    return toWarehouseDomain(record);
  }

  async softDelete(warehouseId: string, companyId: string) {
    const existing = await this.findById(warehouseId, companyId);
    if (!existing) throw new ResourceNotFoundError('Warehouse not found');
    const record = await prisma.warehouse.update({
      where: { id: warehouseId },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });
    return toWarehouseDomain(record);
  }

  async list(companyId: string, query: ListWarehousesQuery): Promise<ListWarehousesResult> {
    const where = buildWhere(companyId, query);
    const [records, total] = await Promise.all([
      prisma.warehouse.findMany({
        where,
        orderBy: resolveOrderBy(query),
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.warehouse.count({ where }),
    ]);

    return {
      items: records.map(toWarehouseDomain),
      total,
    };
  }
}
