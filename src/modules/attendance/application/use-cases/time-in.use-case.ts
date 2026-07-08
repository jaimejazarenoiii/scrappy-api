import { randomUUID } from 'node:crypto';
import { assertEmployeeCanTimeIn, assertNoOpenSession } from '../../domain/attendance-rules.js';
import type { AttendanceSessionRepository } from '../../domain/attendance-session.repository.js';
import type { EmployeeRepository } from '../../../employee/domain/employee.repository.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import { resolveActingEmployeeId } from '../../../../shared/workforce/employee-context.js';
import { assertWorkforceTrackingRequired } from '../../../../shared/workforce/workforce-role-policy.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { TimeInRequestDto } from '../dto/time-in.request.js';
import type { AttendanceResponseDto } from '../dto/attendance.response.js';
import { logAttendanceAudit } from '../services/attendance-audit.service.js';

function toResponse(session: { toPrimitives(): AttendanceResponseDto }): AttendanceResponseDto {
  return session.toPrimitives();
}

export class TimeInUseCase {
  constructor(
    private readonly attendanceRepository: AttendanceSessionRepository,
    private readonly employeeRepository: EmployeeRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    companyId: string,
    userId: string,
    input: TimeInRequestDto,
  ): Promise<AttendanceResponseDto> {
    const user = await this.userRepository.findById(userId, companyId);
    if (!user) throw new ResourceNotFoundError('User not found');
    assertWorkforceTrackingRequired(user);
    const employeeId = resolveActingEmployeeId(user);
    const employee = await this.employeeRepository.findById(employeeId, companyId);
    if (!employee) throw new ResourceNotFoundError('Employee not found');
    assertEmployeeCanTimeIn(employee);
    const openSession = await this.attendanceRepository.findOpenSession(employeeId, companyId);
    assertNoOpenSession(openSession);

    const session = await this.attendanceRepository.create({
      id: randomUUID(),
      companyId,
      employeeId,
      note: input.note ?? null,
      createdByUserId: userId,
    });

    logAttendanceAudit({
      action: 'attendance.time_in',
      companyId,
      resourceType: 'attendance_session',
      resourceId: session.id,
      actorUserId: userId,
    });

    return toResponse(session);
  }
}
