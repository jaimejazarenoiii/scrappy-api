import type { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { prisma } from '../../../database/prisma.client.js';
import {
  BusinessRuleViolationError,
  ResourceNotFoundError,
} from '../../../shared/errors/http-exceptions.js';
import type {
  CreateTripInput,
  TripDashboardCounts,
  TripRepository,
  ListTripQuery,
  ListTripResult,
  ListTripSummariesResult,
  TripSummaryProjection,
  TripDetailProjection,
  TripMemberInput,
  UpdateTripInput,
  ArchiveTripInput,
} from '../domain/trip.repository.js';
import { toTripDomain } from './mappers/trip.mapper.js';
import { mapTripMemberDetail, toTripMemberDomain } from './mappers/trip-member.mapper.js';
import type { TripMemberEntity } from '../domain/trip-member.entity.js';
import type { TripEntity } from '../domain/trip.entity.js';

const NOT_IMPLEMENTED = 'Trip operation not implemented yet';

function buildListWhere(companyId: string, query: ListTripQuery): Prisma.TripWhereInput {
  const where: Prisma.TripWhereInput = { companyId };
  if (!query.includeArchived) {
    where.deletedAt = null;
  }
  if (query.status) {
    where.status = query.status;
  }
  if (query.vehicleId) {
    where.vehicleId = query.vehicleId;
  }
  if (query.employeeId) {
    where.members = { some: { employeeId: query.employeeId } };
  }
  if (query.fromDate || query.toDate) {
    where.scheduledStart = {};
    if (query.fromDate) where.scheduledStart.gte = query.fromDate;
    if (query.toDate) where.scheduledStart.lte = query.toDate;
  }
  if (query.tripNumber) {
    where.tripNumber = { contains: query.tripNumber, mode: 'insensitive' };
  }
  return where;
}

function resolveOrderBy(query: ListTripQuery): Prisma.TripOrderByWithRelationInput[] {
  const sortBy = query.sortBy ?? 'scheduledStart';
  const sortOrder = query.sortOrder ?? 'desc';
  return [{ [sortBy]: sortOrder }, { id: sortOrder }];
}

function mapTripSummary(
  record: Prisma.TripGetPayload<{ include: { vehicle: true } }>,
): TripSummaryProjection {
  return {
    id: record.id,
    companyId: record.companyId,
    tripNumber: record.tripNumber,
    status: record.status,
    scheduledStart: record.scheduledStart,
    actualStart: record.actualStart,
    actualEnd: record.actualEnd,
    origin: record.origin,
    destination: record.destination,
    notes: record.notes,
    vehicle: {
      id: record.vehicle.id,
      plateNumber: record.vehicle.plateNumber,
      description: record.vehicle.description,
      status: record.vehicle.status,
    },
  };
}

export class TripPrismaRepository implements TripRepository {
  async listByCompany(companyId: string, query: ListTripQuery): Promise<ListTripResult> {
    const where = buildListWhere(companyId, query);
    const skip = (query.page - 1) * query.limit;
    const [records, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        include: { vehicle: true },
        orderBy: resolveOrderBy(query),
        skip,
        take: query.limit,
      }),
      prisma.trip.count({ where }),
    ]);
    return {
      items: records.map((record) => toTripDomain(record)),
      total,
    };
  }

  async listSummariesByCompany(
    companyId: string,
    query: ListTripQuery,
  ): Promise<ListTripSummariesResult> {
    const where = buildListWhere(companyId, query);
    const skip = (query.page - 1) * query.limit;
    const [records, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        include: { vehicle: true },
        orderBy: resolveOrderBy(query),
        skip,
        take: query.limit,
      }),
      prisma.trip.count({ where }),
    ]);
    return { items: records.map(mapTripSummary), total };
  }

  async getDashboardCounts(companyId: string): Promise<TripDashboardCounts> {
    const now = new Date();
    const baseWhere: Prisma.TripWhereInput = { companyId, deletedAt: null };

    const [startedCount, completedCount, cancelledCount, scheduledCount, draftCount] =
      await Promise.all([
        prisma.trip.count({ where: { ...baseWhere, status: 'STARTED' } }),
        prisma.trip.count({ where: { ...baseWhere, status: 'COMPLETED' } }),
        prisma.trip.count({ where: { ...baseWhere, status: 'CANCELLED' } }),
        prisma.trip.count({
          where: { ...baseWhere, status: 'DRAFT', scheduledStart: { gt: now } },
        }),
        prisma.trip.count({
          where: { ...baseWhere, status: 'DRAFT', scheduledStart: { lte: now } },
        }),
      ]);

    return { draftCount, scheduledCount, startedCount, completedCount, cancelledCount };
  }

  async listMine(
    companyId: string,
    employeeId: string,
    query: ListTripQuery,
  ): Promise<ListTripResult> {
    return this.listByCompany(companyId, { ...query, employeeId });
  }

  async create(input: CreateTripInput): Promise<TripEntity> {
    const record = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.create({
        data: {
          id: input.id,
          companyId: input.companyId,
          tripNumber: input.tripNumber,
          vehicleId: input.vehicleId,
          status: input.status,
          scheduledStart: input.scheduledStart,
          origin: input.origin,
          destination: input.destination,
          notes: input.notes,
          createdByUserId: input.createdByUserId,
          updatedByUserId: input.updatedByUserId,
        },
      });

      if (input.members?.length) {
        await tx.tripMember.createMany({
          data: input.members.map((member: TripMemberInput) => ({
            id: randomUUID(),
            tripId: trip.id,
            employeeId: member.employeeId,
            role: member.role,
          })),
        });
      }

      return trip;
    });

    return toTripDomain(record);
  }

  async findById(tripId: string, companyId: string): Promise<TripEntity | null> {
    const record = await prisma.trip.findFirst({
      where: { id: tripId, companyId, deletedAt: null },
    });
    return record ? toTripDomain(record) : null;
  }

  async findByTripNumber(tripNumber: string, companyId: string): Promise<TripEntity | null> {
    const record = await prisma.trip.findFirst({
      where: { tripNumber, companyId, deletedAt: null },
    });
    return record ? toTripDomain(record) : null;
  }

  async findDetailById(tripId: string, companyId: string): Promise<TripDetailProjection | null> {
    const record = await prisma.trip.findFirst({
      where: { id: tripId, companyId, deletedAt: null },
      include: {
        vehicle: true,
        members: { include: { employee: true } },
        _count: { select: { transactions: true } },
      },
    });
    if (!record) return null;

    const summary = mapTripSummary(record);
    return {
      ...summary,
      members: record.members.map(mapTripMemberDetail),
      linkedTransactionCount: record._count.transactions,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async listMembers(tripId: string, companyId: string): Promise<TripMemberEntity[]> {
    const trip = await this.findById(tripId, companyId);
    if (!trip) throw new ResourceNotFoundError('Trip not found');
    const records = await prisma.tripMember.findMany({ where: { tripId } });
    return records.map(toTripMemberDomain);
  }

  async update(_tripId: string, _companyId: string, _input: UpdateTripInput): Promise<never> {
    throw new BusinessRuleViolationError(NOT_IMPLEMENTED);
  }
  async start(): Promise<never> {
    throw new BusinessRuleViolationError(NOT_IMPLEMENTED);
  }
  async complete(): Promise<never> {
    throw new BusinessRuleViolationError(NOT_IMPLEMENTED);
  }
  async cancel(): Promise<never> {
    throw new BusinessRuleViolationError(NOT_IMPLEMENTED);
  }
  async archive(_tripId: string, _companyId: string, _input: ArchiveTripInput): Promise<never> {
    throw new BusinessRuleViolationError(NOT_IMPLEMENTED);
  }
  async findMemberByTripAndEmployee(): Promise<never> {
    throw new BusinessRuleViolationError(NOT_IMPLEMENTED);
  }
  async addMember(): Promise<never> {
    throw new BusinessRuleViolationError(NOT_IMPLEMENTED);
  }
  async updateMember(): Promise<never> {
    throw new BusinessRuleViolationError(NOT_IMPLEMENTED);
  }
  async removeMember(): Promise<never> {
    throw new BusinessRuleViolationError(NOT_IMPLEMENTED);
  }
  async findStartedTripByVehicle(): Promise<never> {
    throw new BusinessRuleViolationError(NOT_IMPLEMENTED);
  }
  async findStartedTripByEmployee(): Promise<never> {
    throw new BusinessRuleViolationError(NOT_IMPLEMENTED);
  }
  async findStartedTripIdsByEmployeeId(): Promise<never> {
    throw new BusinessRuleViolationError(NOT_IMPLEMENTED);
  }
}
