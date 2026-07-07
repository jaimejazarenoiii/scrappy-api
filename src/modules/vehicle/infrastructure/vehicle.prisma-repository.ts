import type { Prisma } from '@prisma/client';
import { prisma } from '../../../database/prisma.client.js';
import { ResourceNotFoundError } from '../../../shared/errors/http-exceptions.js';
import type {
  CreateVehicleInput,
  ListVehiclesQuery,
  ListVehiclesResult,
  UpdateVehicleInput,
  VehicleRepository,
} from '../domain/vehicle.repository.js';
import { toVehicleDomain } from './mappers/vehicle.mapper.js';

function buildWhere(companyId: string, query: ListVehiclesQuery): Prisma.VehicleWhereInput {
  const where: Prisma.VehicleWhereInput = {
    companyId,
    deletedAt: null,
  };

  if (query.status) {
    where.status = query.status;
  }

  if (query.search) {
    where.OR = [
      { plateNumber: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  return where;
}

function resolveOrderBy(query: ListVehiclesQuery): Prisma.VehicleOrderByWithRelationInput {
  const sortBy = query.sortBy ?? 'createdAt';
  const sortOrder = query.sortOrder ?? 'asc';
  return { [sortBy]: sortOrder };
}

export class VehiclePrismaRepository implements VehicleRepository {
  async create(input: CreateVehicleInput) {
    const record = await prisma.vehicle.create({
      data: {
        id: input.id,
        companyId: input.companyId,
        plateNumber: input.plateNumber,
        description: input.description,
        status: input.status ?? 'AVAILABLE',
        createdByUserId: input.createdByUserId ?? null,
      },
    });
    return toVehicleDomain(record);
  }

  async findById(vehicleId: string, companyId: string) {
    const record = await prisma.vehicle.findFirst({
      where: { id: vehicleId, companyId, deletedAt: null },
    });
    return record ? toVehicleDomain(record) : null;
  }

  async findByPlateNumber(plateNumber: string, companyId: string) {
    const record = await prisma.vehicle.findFirst({
      where: { plateNumber, companyId, deletedAt: null },
    });
    return record ? toVehicleDomain(record) : null;
  }

  async update(vehicleId: string, companyId: string, input: UpdateVehicleInput) {
    const existing = await this.findById(vehicleId, companyId);
    if (!existing) throw new ResourceNotFoundError('Vehicle not found');
    const record = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: input,
    });
    return toVehicleDomain(record);
  }

  async softDelete(vehicleId: string, companyId: string) {
    const existing = await this.findById(vehicleId, companyId);
    if (!existing) throw new ResourceNotFoundError('Vehicle not found');
    const record = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });
    return toVehicleDomain(record);
  }

  async list(companyId: string, query: ListVehiclesQuery): Promise<ListVehiclesResult> {
    const where = buildWhere(companyId, query);
    const [records, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        orderBy: resolveOrderBy(query),
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.vehicle.count({ where }),
    ]);

    return {
      items: records.map(toVehicleDomain),
      total,
    };
  }
}
