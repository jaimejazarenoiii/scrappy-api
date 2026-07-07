import { randomUUID } from 'node:crypto';
import {
  assertEmployeeCanRequestLeave,
  assertNoOverlappingLeave,
} from '../../domain/leave-rules.js';
import type { LeaveRecordRepository } from '../../domain/leave-record.repository.js';
import type { EmployeeRepository } from '../../../employee/domain/employee.repository.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import { resolveActingEmployeeId } from '../../../../shared/workforce/employee-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { RequestLeaveRequestDto } from '../dto/request-leave.request.js';
import type { LeaveResponseDto } from '../dto/leave.response.js';
import { logLeaveAudit } from '../services/leave-audit.service.js';

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
    const employeeId = resolveActingEmployeeId(user);
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
    });

    return toResponse(record);
  }
}
