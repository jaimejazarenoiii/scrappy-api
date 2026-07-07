import type { Prisma } from '@prisma/client';
import { prisma } from '../../../database/prisma.client.js';
import { ResourceNotFoundError } from '../../../shared/errors/http-exceptions.js';
import type {
  LeaveRecordRepository,
  CreateLeaveRecordInput,
  ListLeaveQuery,
  ManageLeaveInput,
} from '../domain/leave-record.repository.js';
import { toLeaveDomain } from './mappers/leave-record.mapper.js';

function buildWhere(companyId: string, query: ListLeaveQuery): Prisma.LeaveRecordWhereInput {
  const where: Prisma.LeaveRecordWhereInput = { companyId };
  if (query.employeeId) where.employeeId = query.employeeId;
  if (query.status) where.status = query.status;
  if (query.fromDate || query.toDate) {
    where.leaveDate = {};
    if (query.fromDate) where.leaveDate.gte = query.fromDate;
    if (query.toDate) where.leaveDate.lte = query.toDate;
  }
  return where;
}

function resolveOrderBy(query: ListLeaveQuery): Prisma.LeaveRecordOrderByWithRelationInput {
  const sortBy = query.sortBy ?? 'leaveDate';
  const sortOrder = query.sortOrder ?? 'desc';
  return { [sortBy]: sortOrder };
}

export class LeaveRecordPrismaRepository implements LeaveRecordRepository {
  async create(input: CreateLeaveRecordInput) {
    const record = await prisma.leaveRecord.create({
      data: {
        id: input.id,
        companyId: input.companyId,
        employeeId: input.employeeId,
        leaveType: input.leaveType,
        leaveDate: input.leaveDate,
        reason: input.reason ?? null,
        createdByUserId: input.createdByUserId ?? null,
      },
    });
    return toLeaveDomain(record);
  }

  async findById(leaveId: string, companyId: string) {
    const record = await prisma.leaveRecord.findFirst({
      where: { id: leaveId, companyId },
    });
    return record ? toLeaveDomain(record) : null;
  }

  async findOverlapping(employeeId: string, companyId: string, leaveDate: Date) {
    const record = await prisma.leaveRecord.findFirst({
      where: {
        employeeId,
        companyId,
        leaveDate,
        status: { not: 'CANCELLED' },
      },
    });
    return record ? toLeaveDomain(record) : null;
  }

  async update(leaveId: string, companyId: string, input: ManageLeaveInput) {
    const existing = await this.findById(leaveId, companyId);
    if (!existing) throw new ResourceNotFoundError('Leave record not found');
    const record = await prisma.leaveRecord.update({
      where: { id: leaveId },
      data: {
        ...(input.status !== undefined && { status: input.status }),
        ...(input.managerNote !== undefined && { managerNote: input.managerNote }),
        updatedByUserId: input.updatedByUserId ?? null,
      },
    });
    return toLeaveDomain(record);
  }

  async listByEmployee(employeeId: string, companyId: string, query: ListLeaveQuery) {
    const where = buildWhere(companyId, { ...query, employeeId });
    const [records, total] = await Promise.all([
      prisma.leaveRecord.findMany({
        where,
        orderBy: resolveOrderBy(query),
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.leaveRecord.count({ where }),
    ]);
    return { items: records.map(toLeaveDomain), total };
  }

  async listByCompany(companyId: string, query: ListLeaveQuery) {
    const where = buildWhere(companyId, query);
    const [records, total] = await Promise.all([
      prisma.leaveRecord.findMany({
        where,
        orderBy: resolveOrderBy(query),
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.leaveRecord.count({ where }),
    ]);
    return { items: records.map(toLeaveDomain), total };
  }
}
