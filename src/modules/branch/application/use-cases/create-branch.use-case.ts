import { randomUUID } from 'node:crypto';
import { assertBranchNameAvailable } from '../../domain/branch-rules.js';
import type { BranchRepository } from '../../domain/branch.repository.js';
import type { CreateBranchRequestDto } from '../dto/create-branch.request.js';
import type { BranchResponseDto } from '../dto/branch.response.js';
import { logBranchAudit } from '../services/branch-audit.service.js';

function toResponse(branch: { toPrimitives(): BranchResponseDto }): BranchResponseDto {
  return branch.toPrimitives();
}

export class CreateBranchUseCase {
  constructor(private readonly branchRepository: BranchRepository) {}

  async execute(
    companyId: string,
    input: CreateBranchRequestDto,
    actorUserId?: string,
  ): Promise<BranchResponseDto> {
    const existing = await this.branchRepository.findByName(input.name, companyId);
    assertBranchNameAvailable(existing);

    const branch = await this.branchRepository.create({
      id: randomUUID(),
      companyId,
      name: input.name,
      address: input.address,
      contactNumber: input.contactNumber,
      status: input.status ?? 'ACTIVE',
      createdByUserId: actorUserId ?? null,
    });

    logBranchAudit({
      action: 'branch.created',
      companyId,
      resourceType: 'branch',
      resourceId: branch.id,
      actorUserId,
    });

    return toResponse(branch);
  }
}
