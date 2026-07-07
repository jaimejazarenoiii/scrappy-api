import {
  LifecycleConflictError,
  ResourceNotFoundError,
} from '../../../../shared/errors/http-exceptions.js';
import type { WarehouseRepository } from '../../domain/warehouse.repository.js';
import type { WarehouseResponseDto } from '../dto/warehouse.response.js';
import { logWarehouseAudit } from '../services/warehouse-audit.service.js';

function toResponse(warehouse: { toPrimitives(): WarehouseResponseDto }): WarehouseResponseDto {
  return warehouse.toPrimitives();
}

export class ArchiveWarehouseUseCase {
  constructor(private readonly warehouseRepository: WarehouseRepository) {}

  async execute(
    warehouseId: string,
    companyId: string,
    actorUserId?: string,
  ): Promise<WarehouseResponseDto> {
    const existing = await this.warehouseRepository.findById(warehouseId, companyId);
    if (!existing) throw new ResourceNotFoundError('Warehouse not found');
    if (existing.isDeleted()) {
      throw new LifecycleConflictError('Warehouse is already archived');
    }

    const warehouse = await this.warehouseRepository.softDelete(warehouseId, companyId);

    logWarehouseAudit({
      action: 'warehouse.archived',
      companyId,
      resourceType: 'warehouse',
      resourceId: warehouse.id,
      actorUserId,
    });

    return toResponse(warehouse);
  }
}
