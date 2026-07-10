import type { TripMember as PrismaTripMember } from '@prisma/client';
import { TripMemberEntity } from '../../domain/trip-member.entity.js';
import type { TripMemberRole } from '../../domain/trip-member-role.js';

type TripMemberWithEmployee = PrismaTripMember & {
  employee: {
    firstName: string;
    lastName: string;
    employeeNumber: string | null;
  };
};

export function toTripMemberDomain(record: PrismaTripMember): TripMemberEntity {
  return TripMemberEntity.create({
    id: record.id,
    tripId: record.tripId,
    employeeId: record.employeeId,
    role: record.role as TripMemberRole,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

export function mapTripMemberDetail(record: TripMemberWithEmployee) {
  return {
    id: record.id,
    tripId: record.tripId,
    employeeId: record.employeeId,
    role: record.role,
    firstName: record.employee.firstName,
    lastName: record.employee.lastName,
    employeeNumber: record.employee.employeeNumber,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
