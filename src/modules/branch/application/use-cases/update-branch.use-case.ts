import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import { assertBranchNameAvailable } from '../../domain/branch-rules.js';
import type { BranchRepository } from '../../domain/branch.repository.js';
import type { UpdateBranchRequestDto } from '../dto/update-branch.request.js';
import type { BranchResponseDto } from '../dto/branch.response.js';
import { logBranchAudit } from '../services/branch-audit.service.js';

function toResponse(branch: { toPrimitives(): BranchResponseDto }): BranchResponseDto {
  return branch.toPrimitives();
}

export class UpdateBranchUseCase {
  constructor(private readonly branchRepository: BranchRepository) {}

  async execute(
    branchId: string,
    companyId: string,
    input: UpdateBranchRequestDto,
    actorUserId?: string,
  ): Promise<BranchResponseDto> {
    const existing = await this.branchRepository.findById(branchId, companyId);
    if (!existing) throw new ResourceNotFoundError('Branch not found');

    if (input.name) {
      const duplicate = await this.branchRepository.findByName(input.name, companyId);
      assertBranchNameAvailable(duplicate, branchId);
    }

    const branch = await this.branchRepository.update(branchId, companyId, {
      ...input,
      updatedByUserId: actorUserId ?? null,
    });

    logBranchAudit({
      action: 'branch.updated',
      companyId,
      resourceType: 'branch',
      resourceId: branch.id,
      actorUserId,
    });

    return toResponse(branch);
  }
}
