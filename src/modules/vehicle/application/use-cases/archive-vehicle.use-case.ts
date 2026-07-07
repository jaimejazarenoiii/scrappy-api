import {
  LifecycleConflictError,
  ResourceNotFoundError,
} from '../../../../shared/errors/http-exceptions.js';
import type { VehicleRepository } from '../../domain/vehicle.repository.js';
import type { VehicleResponseDto } from '../dto/vehicle.response.js';
import { logVehicleAudit } from '../services/vehicle-audit.service.js';

function toResponse(vehicle: { toPrimitives(): VehicleResponseDto }): VehicleResponseDto {
  return vehicle.toPrimitives();
}

export class ArchiveVehicleUseCase {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  async execute(
    vehicleId: string,
    companyId: string,
    actorUserId?: string,
  ): Promise<VehicleResponseDto> {
    const existing = await this.vehicleRepository.findById(vehicleId, companyId);
    if (!existing) throw new ResourceNotFoundError('Vehicle not found');
    if (existing.isDeleted()) {
      throw new LifecycleConflictError('Vehicle is already archived');
    }

    const vehicle = await this.vehicleRepository.softDelete(vehicleId, companyId);

    logVehicleAudit({
      action: 'vehicle.archived',
      companyId,
      resourceType: 'vehicle',
      resourceId: vehicle.id,
      actorUserId,
    });

    return toResponse(vehicle);
  }
}
