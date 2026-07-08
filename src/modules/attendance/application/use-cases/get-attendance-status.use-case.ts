import type { AttendanceSessionRepository } from '../../domain/attendance-session.repository.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import { resolveActingEmployeeId } from '../../../../shared/workforce/employee-context.js';
import { isWorkforceTrackingRequired } from '../../../../shared/workforce/workforce-role-policy.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type {
  AttendanceStatusResponseDto,
  AttendanceResponseDto,
} from '../dto/attendance.response.js';

function toResponse(session: { toPrimitives(): AttendanceResponseDto }): AttendanceResponseDto {
  return session.toPrimitives();
}

export class GetAttendanceStatusUseCase {
  constructor(
    private readonly attendanceRepository: AttendanceSessionRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(companyId: string, userId: string): Promise<AttendanceStatusResponseDto> {
    const user = await this.userRepository.findById(userId, companyId);
    if (!user) throw new ResourceNotFoundError('User not found');

    if (!isWorkforceTrackingRequired(user.role)) {
      return {
        isTimedIn: false,
        openSession: null,
      };
    }

    const employeeId = resolveActingEmployeeId(user);
    const openSession = await this.attendanceRepository.findOpenSession(employeeId, companyId);
    return {
      isTimedIn: openSession !== null,
      openSession: openSession ? toResponse(openSession) : null,
    };
  }
}
