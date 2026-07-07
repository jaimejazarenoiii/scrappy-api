import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { VehicleRepository } from '../../domain/vehicle.repository.js';
import type { VehicleResponseDto } from '../dto/vehicle.response.js';

function toResponse(vehicle: { toPrimitives(): VehicleResponseDto }): VehicleResponseDto {
  return vehicle.toPrimitives();
}

export class GetVehicleUseCase {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  async execute(vehicleId: string, companyId: string): Promise<VehicleResponseDto> {
    const vehicle = await this.vehicleRepository.findById(vehicleId, companyId);
    if (!vehicle) throw new ResourceNotFoundError('Vehicle not found');
    return toResponse(vehicle);
  }
}
