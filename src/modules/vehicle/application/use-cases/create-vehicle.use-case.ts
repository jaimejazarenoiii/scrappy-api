import { randomUUID } from 'node:crypto';
import { assertVehiclePlateNumberAvailable } from '../../domain/vehicle-rules.js';
import type { VehicleRepository } from '../../domain/vehicle.repository.js';
import type { CreateVehicleRequestDto } from '../dto/create-vehicle.request.js';
import type { VehicleResponseDto } from '../dto/vehicle.response.js';
import { logVehicleAudit } from '../services/vehicle-audit.service.js';

function toResponse(vehicle: { toPrimitives(): VehicleResponseDto }): VehicleResponseDto {
  return vehicle.toPrimitives();
}

export class CreateVehicleUseCase {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  async execute(
    companyId: string,
    input: CreateVehicleRequestDto,
    actorUserId?: string,
  ): Promise<VehicleResponseDto> {
    const existing = await this.vehicleRepository.findByPlateNumber(input.plateNumber, companyId);
    assertVehiclePlateNumberAvailable(existing);

    const vehicle = await this.vehicleRepository.create({
      id: randomUUID(),
      companyId,
      plateNumber: input.plateNumber,
      description: input.description,
      status: input.status ?? 'AVAILABLE',
      createdByUserId: actorUserId ?? null,
    });

    logVehicleAudit({
      action: 'vehicle.created',
      companyId,
      resourceType: 'vehicle',
      resourceId: vehicle.id,
      actorUserId,
    });

    return toResponse(vehicle);
  }
}
