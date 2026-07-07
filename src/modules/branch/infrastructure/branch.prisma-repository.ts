import type { Prisma } from '@prisma/client';
import { prisma } from '../../../database/prisma.client.js';
import { ResourceNotFoundError } from '../../../shared/errors/http-exceptions.js';
import type {
  BranchRepository,
  CreateBranchInput,
  ListBranchesQuery,
  ListBranchesResult,
  UpdateBranchInput,
} from '../domain/branch.repository.js';
import { toBranchDomain } from './mappers/branch.mapper.js';

function buildWhere(companyId: string, query: ListBranchesQuery): Prisma.BranchWhereInput {
  const where: Prisma.BranchWhereInput = {
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

function resolveOrderBy(query: ListBranchesQuery): Prisma.BranchOrderByWithRelationInput {
  const sortBy = query.sortBy ?? 'createdAt';
  const sortOrder = query.sortOrder ?? 'asc';
  return { [sortBy]: sortOrder };
}

export class BranchPrismaRepository implements BranchRepository {
  async create(input: CreateBranchInput) {
    const record = await prisma.branch.create({
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
    return toBranchDomain(record);
  }

  async findById(branchId: string, companyId: string) {
    const record = await prisma.branch.findFirst({
      where: { id: branchId, companyId, deletedAt: null },
    });
    return record ? toBranchDomain(record) : null;
  }

  async findByIdIncludingArchived(branchId: string, companyId: string) {
    const record = await prisma.branch.findFirst({
      where: { id: branchId, companyId },
    });
    return record ? toBranchDomain(record) : null;
  }

  async findByName(name: string, companyId: string) {
    const record = await prisma.branch.findFirst({
      where: { name, companyId, deletedAt: null },
    });
    return record ? toBranchDomain(record) : null;
  }

  async update(branchId: string, companyId: string, input: UpdateBranchInput) {
    const existing = await this.findById(branchId, companyId);
    if (!existing) throw new ResourceNotFoundError('Branch not found');
    const record = await prisma.branch.update({
      where: { id: branchId },
      data: input,
    });
    return toBranchDomain(record);
  }

  async softDelete(branchId: string, companyId: string) {
    const existing = await this.findById(branchId, companyId);
    if (!existing) throw new ResourceNotFoundError('Branch not found');
    const record = await prisma.branch.update({
      where: { id: branchId },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });
    return toBranchDomain(record);
  }

  async list(companyId: string, query: ListBranchesQuery): Promise<ListBranchesResult> {
    const where = buildWhere(companyId, query);
    const [records, total] = await Promise.all([
      prisma.branch.findMany({
        where,
        orderBy: resolveOrderBy(query),
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.branch.count({ where }),
    ]);

    return {
      items: records.map(toBranchDomain),
      total,
    };
  }
}
