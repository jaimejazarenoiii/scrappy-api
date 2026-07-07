import { DuplicateResourceError } from '../../../shared/errors/http-exceptions.js';
import type { VehicleEntity } from './vehicle.entity.js';

export function assertVehiclePlateNumberAvailable(
  existing: VehicleEntity | null,
  excludeVehicleId?: string,
): void {
  if (existing && existing.id !== excludeVehicleId) {
    throw new DuplicateResourceError('Vehicle plate number already exists in this company');
  }
}
