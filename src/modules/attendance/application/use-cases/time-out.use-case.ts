import { assertOpenSessionExists } from '../../domain/attendance-rules.js';
import type { AttendanceSessionRepository } from '../../domain/attendance-session.repository.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import { resolveActingEmployeeId } from '../../../../shared/workforce/employee-context.js';
import { assertWorkforceTrackingRequired } from '../../../../shared/workforce/workforce-role-policy.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { TimeOutRequestDto } from '../dto/time-in.request.js';
import type { AttendanceResponseDto } from '../dto/attendance.response.js';
import { logAttendanceAudit } from '../services/attendance-audit.service.js';

function toResponse(session: { toPrimitives(): AttendanceResponseDto }): AttendanceResponseDto {
  return session.toPrimitives();
}

export class TimeOutUseCase {
  constructor(
    private readonly attendanceRepository: AttendanceSessionRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    companyId: string,
    userId: string,
    input: TimeOutRequestDto,
  ): Promise<AttendanceResponseDto> {
    const user = await this.userRepository.findById(userId, companyId);
    if (!user) throw new ResourceNotFoundError('User not found');
    assertWorkforceTrackingRequired(user);
    const employeeId = resolveActingEmployeeId(user);
    const openSession = await this.attendanceRepository.findOpenSession(employeeId, companyId);
    assertOpenSessionExists(openSession);

    const session = await this.attendanceRepository.close(
      openSession!.id,
      companyId,
      new Date(),
      input.note ?? null,
    );

    logAttendanceAudit({
      action: 'attendance.time_out',
      companyId,
      resourceType: 'attendance_session',
      resourceId: session.id,
      actorUserId: userId,
    });

    return toResponse(session);
  }
}
