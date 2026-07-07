import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { WarehouseRepository } from '../../domain/warehouse.repository.js';
import type { WarehouseResponseDto } from '../dto/warehouse.response.js';

function toResponse(warehouse: { toPrimitives(): WarehouseResponseDto }): WarehouseResponseDto {
  return warehouse.toPrimitives();
}

export class GetWarehouseUseCase {
  constructor(private readonly warehouseRepository: WarehouseRepository) {}

  async execute(warehouseId: string, companyId: string): Promise<WarehouseResponseDto> {
    const warehouse = await this.warehouseRepository.findById(warehouseId, companyId);
    if (!warehouse) throw new ResourceNotFoundError('Warehouse not found');
    return toResponse(warehouse);
  }
}
