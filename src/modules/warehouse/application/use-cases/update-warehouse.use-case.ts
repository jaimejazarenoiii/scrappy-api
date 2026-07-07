import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import { assertWarehouseNameAvailable } from '../../domain/warehouse-rules.js';
import type { WarehouseRepository } from '../../domain/warehouse.repository.js';
import type { UpdateWarehouseRequestDto } from '../dto/update-warehouse.request.js';
import type { WarehouseResponseDto } from '../dto/warehouse.response.js';
import { logWarehouseAudit } from '../services/warehouse-audit.service.js';

function toResponse(warehouse: { toPrimitives(): WarehouseResponseDto }): WarehouseResponseDto {
  return warehouse.toPrimitives();
}

export class UpdateWarehouseUseCase {
  constructor(private readonly warehouseRepository: WarehouseRepository) {}

  async execute(
    warehouseId: string,
    companyId: string,
    input: UpdateWarehouseRequestDto,
    actorUserId?: string,
  ): Promise<WarehouseResponseDto> {
    const existing = await this.warehouseRepository.findById(warehouseId, companyId);
    if (!existing) throw new ResourceNotFoundError('Warehouse not found');

    if (input.name) {
      const duplicate = await this.warehouseRepository.findByName(input.name, companyId);
      assertWarehouseNameAvailable(duplicate, warehouseId);
    }

    const warehouse = await this.warehouseRepository.update(warehouseId, companyId, {
      ...input,
      updatedByUserId: actorUserId ?? null,
    });

    logWarehouseAudit({
      action: 'warehouse.updated',
      companyId,
      resourceType: 'warehouse',
      resourceId: warehouse.id,
      actorUserId,
    });

    return toResponse(warehouse);
  }
}
