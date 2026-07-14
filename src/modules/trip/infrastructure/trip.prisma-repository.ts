import type { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { prisma } from '../../../database/prisma.client.js';
import {
  BusinessRuleViolationError,
  DuplicateResourceError,
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
  UpdateTripLoadFlagsInput,
  ArchiveTripInput,
  StartTripInput,
  CompleteTripInput,
  UpdateTripMemberInput,
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
    loadEnabled: record.loadEnabled,
    strictLoadValidation: record.strictLoadValidation,
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
  async updateLoadFlags(
    tripId: string,
    companyId: string,
    input: UpdateTripLoadFlagsInput,
  ): Promise<TripEntity> {
    const existing = await this.findById(tripId, companyId);
    if (!existing) throw new ResourceNotFoundError('Trip not found');
    const data: Prisma.TripUpdateInput = {};
    if (input.loadEnabled !== undefined) data.loadEnabled = true;
    if (input.strictLoadValidation !== undefined) {
      data.strictLoadValidation = input.strictLoadValidation;
    }
    if (input.updatedByUserId !== undefined) data.updatedByUserId = input.updatedByUserId;
    const record = await prisma.trip.update({ where: { id: tripId }, data });
    return toTripDomain(record);
  }
  async start(tripId: string, companyId: string, input: StartTripInput): Promise<TripEntity> {
    const existing = await this.findById(tripId, companyId);
    if (!existing) throw new ResourceNotFoundError('Trip not found');

    const record = await prisma.$transaction(async (tx) => {
      return tx.trip.update({
        where: { id: tripId },
        data: {
          status: 'STARTED',
          actualStart: input.actualStart,
          startedByUserId: input.startedByUserId,
          updatedByUserId: input.startedByUserId,
        },
      });
    });

    return toTripDomain(record);
  }
  async complete(tripId: string, companyId: string, input: CompleteTripInput): Promise<TripEntity> {
    const existing = await this.findById(tripId, companyId);
    if (!existing) throw new ResourceNotFoundError('Trip not found');

    const record = await prisma.trip.update({
      where: { id: tripId },
      data: {
        status: 'COMPLETED',
        actualEnd: input.actualEnd,
        completedByUserId: input.completedByUserId,
        updatedByUserId: input.completedByUserId,
      },
    });

    return toTripDomain(record);
  }
  async cancel(): Promise<never> {
    throw new BusinessRuleViolationError(NOT_IMPLEMENTED);
  }
  async archive(_tripId: string, _companyId: string, _input: ArchiveTripInput): Promise<never> {
    throw new BusinessRuleViolationError(NOT_IMPLEMENTED);
  }
  async findMemberByTripAndEmployee(
    tripId: string,
    companyId: string,
    employeeId: string,
  ): Promise<TripMemberEntity | null> {
    const trip = await this.findById(tripId, companyId);
    if (!trip) return null;
    const record = await prisma.tripMember.findUnique({
      where: { tripId_employeeId: { tripId, employeeId } },
    });
    return record ? toTripMemberDomain(record) : null;
  }

  async addMember(
    tripId: string,
    companyId: string,
    input: TripMemberInput,
  ): Promise<TripMemberEntity> {
    const trip = await this.findById(tripId, companyId);
    if (!trip) throw new ResourceNotFoundError('Trip not found');

    const existing = await prisma.tripMember.findUnique({
      where: { tripId_employeeId: { tripId, employeeId: input.employeeId } },
    });
    if (existing) {
      throw new DuplicateResourceError('Employee is already assigned to this trip.');
    }

    const record = await prisma.tripMember.create({
      data: {
        id: randomUUID(),
        tripId,
        employeeId: input.employeeId,
        role: input.role,
      },
    });
    return toTripMemberDomain(record);
  }

  async updateMember(
    tripId: string,
    companyId: string,
    memberId: string,
    input: UpdateTripMemberInput,
  ): Promise<TripMemberEntity> {
    const trip = await this.findById(tripId, companyId);
    if (!trip) throw new ResourceNotFoundError('Trip not found');

    const existing = await prisma.tripMember.findFirst({ where: { id: memberId, tripId } });
    if (!existing) throw new ResourceNotFoundError('Trip member not found');

    const record = await prisma.tripMember.update({
      where: { id: memberId },
      data: { role: input.role },
    });
    return toTripMemberDomain(record);
  }

  async removeMember(tripId: string, companyId: string, memberId: string): Promise<void> {
    const trip = await this.findById(tripId, companyId);
    if (!trip) throw new ResourceNotFoundError('Trip not found');

    const existing = await prisma.tripMember.findFirst({ where: { id: memberId, tripId } });
    if (!existing) throw new ResourceNotFoundError('Trip member not found');

    await prisma.tripMember.delete({ where: { id: memberId } });
  }
  async findStartedTripByVehicle(vehicleId: string, companyId: string): Promise<TripEntity | null> {
    const record = await prisma.trip.findFirst({
      where: { companyId, vehicleId, status: 'STARTED', deletedAt: null },
    });
    return record ? toTripDomain(record) : null;
  }

  async findStartedTripByEmployee(
    employeeId: string,
    companyId: string,
  ): Promise<TripEntity | null> {
    const record = await prisma.trip.findFirst({
      where: {
        companyId,
        status: 'STARTED',
        deletedAt: null,
        members: { some: { employeeId } },
      },
    });
    return record ? toTripDomain(record) : null;
  }

  async findStartedTripIdsByEmployeeId(employeeId: string, companyId: string): Promise<string[]> {
    const records = await prisma.trip.findMany({
      where: {
        companyId,
        status: 'STARTED',
        deletedAt: null,
        members: { some: { employeeId } },
      },
      select: { id: true },
    });
    return records.map((record) => record.id);
  }
}
