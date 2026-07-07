import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import { assertVehiclePlateNumberAvailable } from '../../domain/vehicle-rules.js';
import type { VehicleRepository } from '../../domain/vehicle.repository.js';
import type { UpdateVehicleRequestDto } from '../dto/update-vehicle.request.js';
import type { VehicleResponseDto } from '../dto/vehicle.response.js';
import { logVehicleAudit } from '../services/vehicle-audit.service.js';

function toResponse(vehicle: { toPrimitives(): VehicleResponseDto }): VehicleResponseDto {
  return vehicle.toPrimitives();
}

export class UpdateVehicleUseCase {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  async execute(
    vehicleId: string,
    companyId: string,
    input: UpdateVehicleRequestDto,
    actorUserId?: string,
  ): Promise<VehicleResponseDto> {
    const existing = await this.vehicleRepository.findById(vehicleId, companyId);
    if (!existing) throw new ResourceNotFoundError('Vehicle not found');

    if (input.plateNumber) {
      const duplicate = await this.vehicleRepository.findByPlateNumber(
        input.plateNumber,
        companyId,
      );
      assertVehiclePlateNumberAvailable(duplicate, vehicleId);
    }

    const vehicle = await this.vehicleRepository.update(vehicleId, companyId, {
      ...input,
      updatedByUserId: actorUserId ?? null,
    });

    logVehicleAudit({
      action: 'vehicle.updated',
      companyId,
      resourceType: 'vehicle',
      resourceId: vehicle.id,
      actorUserId,
    });

    return toResponse(vehicle);
  }
}
