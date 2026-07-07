import {
  LifecycleConflictError,
  ResourceNotFoundError,
} from '../../../../shared/errors/http-exceptions.js';
import type { BranchRepository } from '../../domain/branch.repository.js';
import type { BranchResponseDto } from '../dto/branch.response.js';
import { logBranchAudit } from '../services/branch-audit.service.js';

function toResponse(branch: { toPrimitives(): BranchResponseDto }): BranchResponseDto {
  return branch.toPrimitives();
}

export class ArchiveBranchUseCase {
  constructor(private readonly branchRepository: BranchRepository) {}

  async execute(
    branchId: string,
    companyId: string,
    actorUserId?: string,
  ): Promise<BranchResponseDto> {
    const existing = await this.branchRepository.findByIdIncludingArchived(branchId, companyId);
    if (!existing) throw new ResourceNotFoundError('Branch not found');
    if (existing.isDeleted()) {
      throw new LifecycleConflictError('Branch is already archived');
    }

    const branch = await this.branchRepository.softDelete(branchId, companyId);

    logBranchAudit({
      action: 'branch.archived',
      companyId,
      resourceType: 'branch',
      resourceId: branch.id,
      actorUserId,
    });

    return toResponse(branch);
  }
}
