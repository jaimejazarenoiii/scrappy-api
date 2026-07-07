import type { AttendanceSession as PrismaAttendanceSession } from '@prisma/client';
import { AttendanceSessionEntity } from '../../domain/attendance-session.entity.js';

export function toAttendanceDomain(record: PrismaAttendanceSession): AttendanceSessionEntity {
  return AttendanceSessionEntity.create({
    id: record.id,
    companyId: record.companyId,
    employeeId: record.employeeId,
    status: record.status,
    timeInAt: record.timeInAt,
    timeOutAt: record.timeOutAt,
    note: record.note,
    correctionNote: record.correctionNote,
    adjustedTimeInAt: record.adjustedTimeInAt,
    adjustedTimeOutAt: record.adjustedTimeOutAt,
    createdByUserId: record.createdByUserId,
    updatedByUserId: record.updatedByUserId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}
