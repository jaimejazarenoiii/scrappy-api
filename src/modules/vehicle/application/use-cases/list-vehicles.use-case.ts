import { buildPaginationMeta } from '../../../../shared/pagination/pagination.utils.js';
import type { PaginationMeta } from '../../../../shared/types/api-response.type.js';
import type { ListVehiclesQuery, VehicleRepository } from '../../domain/vehicle.repository.js';
import type { VehicleResponseDto } from '../dto/vehicle.response.js';

export interface ListVehiclesResponseDto {
  items: VehicleResponseDto[];
  meta: PaginationMeta;
}

export class ListVehiclesUseCase {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  async execute(companyId: string, query: ListVehiclesQuery): Promise<ListVehiclesResponseDto> {
    const result = await this.vehicleRepository.list(companyId, query);
    return {
      items: result.items.map((vehicle) => vehicle.toPrimitives()),
      meta: buildPaginationMeta(query.page, query.limit, result.total),
    };
  }
}
