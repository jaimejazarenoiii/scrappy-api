import { buildPaginationMeta } from '../../../../shared/pagination/pagination.utils.js';
import type { PaginationMeta } from '../../../../shared/types/api-response.type.js';
import type { BranchRepository, ListBranchesQuery } from '../../domain/branch.repository.js';
import type { BranchResponseDto } from '../dto/branch.response.js';

export interface ListBranchesResponseDto {
  items: BranchResponseDto[];
  meta: PaginationMeta;
}

export class ListBranchesUseCase {
  constructor(private readonly branchRepository: BranchRepository) {}

  async execute(companyId: string, query: ListBranchesQuery): Promise<ListBranchesResponseDto> {
    const result = await this.branchRepository.list(companyId, query);
    return {
      items: result.items.map((branch) => branch.toPrimitives()),
      meta: buildPaginationMeta(query.page, query.limit, result.total),
    };
  }
}
