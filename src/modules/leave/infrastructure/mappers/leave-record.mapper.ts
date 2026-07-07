import type { LeaveRecord as PrismaLeaveRecord } from '@prisma/client';
import { LeaveRecordEntity } from '../../domain/leave-record.entity.js';

export function toLeaveDomain(record: PrismaLeaveRecord): LeaveRecordEntity {
  return LeaveRecordEntity.create({
    id: record.id,
    companyId: record.companyId,
    employeeId: record.employeeId,
    leaveType: record.leaveType,
    leaveDate: record.leaveDate,
    status: record.status,
    reason: record.reason,
    managerNote: record.managerNote,
    createdByUserId: record.createdByUserId,
    updatedByUserId: record.updatedByUserId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}
