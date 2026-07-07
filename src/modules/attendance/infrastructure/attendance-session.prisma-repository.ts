import type { Prisma } from '@prisma/client';
import { prisma } from '../../../database/prisma.client.js';
import { ResourceNotFoundError } from '../../../shared/errors/http-exceptions.js';
import type {
  AttendanceSessionRepository,
  CreateAttendanceSessionInput,
  ListAttendanceQuery,
  ManageAttendanceInput,
} from '../domain/attendance-session.repository.js';
import { toAttendanceDomain } from './mappers/attendance-session.mapper.js';

function buildWhere(
  companyId: string,
  query: ListAttendanceQuery,
): Prisma.AttendanceSessionWhereInput {
  const where: Prisma.AttendanceSessionWhereInput = { companyId };
  if (query.employeeId) where.employeeId = query.employeeId;
  if (query.fromDate || query.toDate) {
    where.timeInAt = {};
    if (query.fromDate) where.timeInAt.gte = query.fromDate;
    if (query.toDate) where.timeInAt.lte = query.toDate;
  }
  return where;
}

function resolveOrderBy(
  query: ListAttendanceQuery,
): Prisma.AttendanceSessionOrderByWithRelationInput {
  const sortBy = query.sortBy ?? 'timeInAt';
  const sortOrder = query.sortOrder ?? 'desc';
  return { [sortBy]: sortOrder };
}

export class AttendanceSessionPrismaRepository implements AttendanceSessionRepository {
  async create(input: CreateAttendanceSessionInput) {
    const record = await prisma.attendanceSession.create({
      data: {
        id: input.id,
        companyId: input.companyId,
        employeeId: input.employeeId,
        timeInAt: input.timeInAt ?? new Date(),
        note: input.note ?? null,
        createdByUserId: input.createdByUserId ?? null,
      },
    });
    return toAttendanceDomain(record);
  }

  async findOpenSession(employeeId: string, companyId: string) {
    const record = await prisma.attendanceSession.findFirst({
      where: { employeeId, companyId, status: 'OPEN' },
    });
    return record ? toAttendanceDomain(record) : null;
  }

  async findById(attendanceId: string, companyId: string) {
    const record = await prisma.attendanceSession.findFirst({
      where: { id: attendanceId, companyId },
    });
    return record ? toAttendanceDomain(record) : null;
  }

  async update(attendanceId: string, companyId: string, input: ManageAttendanceInput) {
    const existing = await this.findById(attendanceId, companyId);
    if (!existing) throw new ResourceNotFoundError('Attendance record not found');
    const record = await prisma.attendanceSession.update({
      where: { id: attendanceId },
      data: {
        correctionNote: input.correctionNote,
        adjustedTimeInAt: input.adjustedTimeInAt,
        adjustedTimeOutAt: input.adjustedTimeOutAt,
        updatedByUserId: input.updatedByUserId ?? null,
      },
    });
    return toAttendanceDomain(record);
  }

  async close(attendanceId: string, companyId: string, timeOutAt: Date, note?: string | null) {
    const existing = await this.findById(attendanceId, companyId);
    if (!existing) throw new ResourceNotFoundError('Attendance record not found');
    const record = await prisma.attendanceSession.update({
      where: { id: attendanceId },
      data: {
        status: 'CLOSED',
        timeOutAt,
        note: note ?? existing.toPrimitives().note,
      },
    });
    return toAttendanceDomain(record);
  }

  async listByEmployee(employeeId: string, companyId: string, query: ListAttendanceQuery) {
    const where = buildWhere(companyId, { ...query, employeeId });
    const [records, total] = await Promise.all([
      prisma.attendanceSession.findMany({
        where,
        orderBy: resolveOrderBy(query),
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.attendanceSession.count({ where }),
    ]);
    return { items: records.map(toAttendanceDomain), total };
  }

  async listByCompany(companyId: string, query: ListAttendanceQuery) {
    const where = buildWhere(companyId, query);
    const [records, total] = await Promise.all([
      prisma.attendanceSession.findMany({
        where,
        orderBy: resolveOrderBy(query),
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.attendanceSession.count({ where }),
    ]);
    return { items: records.map(toAttendanceDomain), total };
  }
}
