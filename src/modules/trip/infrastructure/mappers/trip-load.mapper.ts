import type {
  TripLoad as PrismaTripLoad,
  TripLoadItem as PrismaTripLoadItem,
} from '@prisma/client';
import { TripLoadEntity } from '../../domain/trip-load.entity.js';
import { TripLoadItemEntity } from '../../domain/trip-load-item.entity.js';

export function toTripLoadItemDomain(record: PrismaTripLoadItem): TripLoadItemEntity {
  return TripLoadItemEntity.create({
    id: record.id,
    tripLoadId: record.tripLoadId,
    materialName: record.materialName,
    materialNameNorm: record.materialNameNorm,
    quantity: Number(record.quantity),
    unit: record.unit,
    notes: record.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

export function toTripLoadDomain(
  record: PrismaTripLoad & { items: PrismaTripLoadItem[] },
): TripLoadEntity {
  return TripLoadEntity.create({
    id: record.id,
    tripId: record.tripId,
    notes: record.notes,
    createdByUserId: record.createdByUserId,
    updatedByUserId: record.updatedByUserId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    items: record.items.map(toTripLoadItemDomain),
  });
}
