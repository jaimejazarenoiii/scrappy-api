import { buildPaginationMeta } from '../../../../shared/pagination/pagination.utils.js';
import type { PaginationMeta } from '../../../../shared/types/api-response.type.js';
import type {
  WarehouseRepository,
  ListWarehousesQuery,
} from '../../domain/warehouse.repository.js';
import type { WarehouseResponseDto } from '../dto/warehouse.response.js';

export interface ListWarehousesResponseDto {
  items: WarehouseResponseDto[];
  meta: PaginationMeta;
}

export class ListWarehousesUseCase {
  constructor(private readonly warehouseRepository: WarehouseRepository) {}

  async execute(companyId: string, query: ListWarehousesQuery): Promise<ListWarehousesResponseDto> {
    const result = await this.warehouseRepository.list(companyId, query);
    return {
      items: result.items.map((warehouse) => warehouse.toPrimitives()),
      meta: buildPaginationMeta(query.page, query.limit, result.total),
    };
  }
}
