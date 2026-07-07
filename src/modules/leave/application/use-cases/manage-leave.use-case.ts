import type { LeaveRecordRepository } from '../../domain/leave-record.repository.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { ManageLeaveRequestDto } from '../dto/request-leave.request.js';
import type { LeaveResponseDto } from '../dto/leave.response.js';
import { logLeaveAudit } from '../services/leave-audit.service.js';

function toResponse(record: { toPrimitives(): LeaveResponseDto }): LeaveResponseDto {
  return record.toPrimitives();
}

export class ManageLeaveUseCase {
  constructor(private readonly leaveRepository: LeaveRecordRepository) {}

  async execute(
    leaveId: string,
    companyId: string,
    input: ManageLeaveRequestDto,
    actorUserId?: string,
  ): Promise<LeaveResponseDto> {
    const existing = await this.leaveRepository.findById(leaveId, companyId);
    if (!existing) throw new ResourceNotFoundError('Leave record not found');

    const record = await this.leaveRepository.update(leaveId, companyId, {
      status: input.status,
      managerNote: input.managerNote,
      updatedByUserId: actorUserId ?? null,
    });

    logLeaveAudit({
      action: 'leave.managed',
      companyId,
      resourceType: 'leave_record',
      resourceId: record.id,
      actorUserId,
      metadata: {
        status: input.status,
      },
    });

    return toResponse(record);
  }
}
