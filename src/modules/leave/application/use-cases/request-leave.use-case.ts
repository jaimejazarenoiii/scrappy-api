import { randomUUID } from 'node:crypto';
import {
  assertEmployeeCanRequestLeave,
  assertNoOverlappingLeave,
} from '../../domain/leave-rules.js';
import type { LeaveRecordRepository } from '../../domain/leave-record.repository.js';
import type { EmployeeRepository } from '../../../employee/domain/employee.repository.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import { resolveActingEmployeeId } from '../../../../shared/workforce/employee-context.js';
import {
  assertWorkforceTrackingRequired,
  canManageWorkforceOnBehalf,
} from '../../../../shared/workforce/workforce-role-policy.js';
import {
  ForbiddenError,
  ResourceNotFoundError,
  ValidationAppError,
} from '../../../../shared/errors/http-exceptions.js';
import type { RequestLeaveRequestDto } from '../dto/request-leave.request.js';
import type { LeaveResponseDto } from '../dto/leave.response.js';
import { logLeaveAudit } from '../services/leave-audit.service.js';
import type { UserEntity } from '../../../user/domain/user.entity.js';

function toResponse(record: { toPrimitives(): LeaveResponseDto }): LeaveResponseDto {
  return record.toPrimitives();
}

export class RequestLeaveUseCase {
  constructor(
    private readonly leaveRepository: LeaveRecordRepository,
    private readonly employeeRepository: EmployeeRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    companyId: string,
    userId: string,
    input: RequestLeaveRequestDto,
  ): Promise<LeaveResponseDto> {
    const user = await this.userRepository.findById(userId, companyId);
    if (!user) throw new ResourceNotFoundError('User not found');

    const employeeId = this.resolveTargetEmployeeId(user, input.employeeId);

    const employee = await this.employeeRepository.findById(employeeId, companyId);
    if (!employee) throw new ResourceNotFoundError('Employee not found');
    assertEmployeeCanRequestLeave(employee);

    const leaveDate = new Date(input.leaveDate);
    const overlapping = await this.leaveRepository.findOverlapping(
      employeeId,
      companyId,
      leaveDate,
    );
    assertNoOverlappingLeave(overlapping);

    const record = await this.leaveRepository.create({
      id: randomUUID(),
      companyId,
      employeeId,
      leaveType: input.leaveType,
      leaveDate,
      reason: input.reason ?? null,
      createdByUserId: userId,
    });

    logLeaveAudit({
      action: 'leave.requested',
      companyId,
      resourceType: 'leave_record',
      resourceId: record.id,
      actorUserId: userId,
      metadata: {
        onBehalf: input.employeeId !== undefined,
      },
    });

    return toResponse(record);
  }

  private resolveTargetEmployeeId(user: UserEntity, requestedEmployeeId?: string): string {
    if (requestedEmployeeId) {
      if (!canManageWorkforceOnBehalf(user.role)) {
        throw new ForbiddenError('You are not allowed to request leave for another employee.');
      }
      return requestedEmployeeId;
    }

    if (user.role === 'OWNER') {
      throw new ValidationAppError('employeeId is required when creating leave as an owner.');
    }

    assertWorkforceTrackingRequired(user);
    return resolveActingEmployeeId(user);
  }
}
