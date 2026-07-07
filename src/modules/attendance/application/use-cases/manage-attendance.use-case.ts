import type { AttendanceSessionRepository } from '../../domain/attendance-session.repository.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { ManageAttendanceRequestDto } from '../dto/time-in.request.js';
import type { AttendanceResponseDto } from '../dto/attendance.response.js';
import { logAttendanceAudit } from '../services/attendance-audit.service.js';

function toResponse(session: { toPrimitives(): AttendanceResponseDto }): AttendanceResponseDto {
  return session.toPrimitives();
}

export class ManageAttendanceUseCase {
  constructor(private readonly attendanceRepository: AttendanceSessionRepository) {}

  async execute(
    attendanceId: string,
    companyId: string,
    input: ManageAttendanceRequestDto,
    actorUserId?: string,
  ): Promise<AttendanceResponseDto> {
    const existing = await this.attendanceRepository.findById(attendanceId, companyId);
    if (!existing) throw new ResourceNotFoundError('Attendance record not found');

    const session = await this.attendanceRepository.update(attendanceId, companyId, {
      correctionNote: input.correctionNote,
      adjustedTimeInAt: input.adjustedTimeInAt ? new Date(input.adjustedTimeInAt) : undefined,
      adjustedTimeOutAt: input.adjustedTimeOutAt ? new Date(input.adjustedTimeOutAt) : undefined,
      updatedByUserId: actorUserId ?? null,
    });

    logAttendanceAudit({
      action: 'attendance.managed',
      companyId,
      resourceType: 'attendance_session',
      resourceId: session.id,
      actorUserId,
    });

    return toResponse(session);
  }
}
