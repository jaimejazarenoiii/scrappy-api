import { DuplicateResourceError } from '../../../shared/errors/http-exceptions.js';
import type { WarehouseEntity } from './warehouse.entity.js';

export function assertWarehouseNameAvailable(
  existing: WarehouseEntity | null,
  excludeWarehouseId?: string,
): void {
  if (existing && existing.id !== excludeWarehouseId) {
    throw new DuplicateResourceError('Warehouse name already exists in this company');
  }
}
