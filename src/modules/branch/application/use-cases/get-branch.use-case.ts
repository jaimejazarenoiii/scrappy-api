import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { BranchRepository } from '../../domain/branch.repository.js';
import type { BranchResponseDto } from '../dto/branch.response.js';

function toResponse(branch: { toPrimitives(): BranchResponseDto }): BranchResponseDto {
  return branch.toPrimitives();
}

export class GetBranchUseCase {
  constructor(private readonly branchRepository: BranchRepository) {}

  async execute(branchId: string, companyId: string): Promise<BranchResponseDto> {
    const branch = await this.branchRepository.findById(branchId, companyId);
    if (!branch) throw new ResourceNotFoundError('Branch not found');
    return toResponse(branch);
  }
}
