import { randomUUID } from 'node:crypto';
import { assertWarehouseNameAvailable } from '../../domain/warehouse-rules.js';
import type { WarehouseRepository } from '../../domain/warehouse.repository.js';
import type { CreateWarehouseRequestDto } from '../dto/create-warehouse.request.js';
import type { WarehouseResponseDto } from '../dto/warehouse.response.js';
import { logWarehouseAudit } from '../services/warehouse-audit.service.js';

function toResponse(warehouse: { toPrimitives(): WarehouseResponseDto }): WarehouseResponseDto {
  return warehouse.toPrimitives();
}

export class CreateWarehouseUseCase {
  constructor(private readonly warehouseRepository: WarehouseRepository) {}

  async execute(
    companyId: string,
    input: CreateWarehouseRequestDto,
    actorUserId?: string,
  ): Promise<WarehouseResponseDto> {
    const existing = await this.warehouseRepository.findByName(input.name, companyId);
    assertWarehouseNameAvailable(existing);

    const warehouse = await this.warehouseRepository.create({
      id: randomUUID(),
      companyId,
      name: input.name,
      address: input.address,
      contactNumber: input.contactNumber,
      status: input.status ?? 'ACTIVE',
      createdByUserId: actorUserId ?? null,
    });

    logWarehouseAudit({
      action: 'warehouse.created',
      companyId,
      resourceType: 'warehouse',
      resourceId: warehouse.id,
      actorUserId,
    });

    return toResponse(warehouse);
  }
}
