import type { TransactionItemUnit } from '../../../transaction/domain/transaction-item-unit.js';
import type { TripStatus } from '../../domain/trip-status.js';
import type { TripLoadEntity } from '../../domain/trip-load.entity.js';
import type { TripLoadItemEntity } from '../../domain/trip-load-item.entity.js';

export interface TripLoadItemDto {
  id: string;
  tripLoadId: string;
  materialName: string;
  quantity: number;
  unit: TransactionItemUnit;
  notes: string | null;
  remainingQuantity: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TripLoadDto {
  id: string;
  tripId: string;
  notes: string | null;
  items: TripLoadItemDto[];
  createdByUserId: string;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TripLoadFlagsDto {
  tripId: string;
  loadEnabled: boolean;
  strictLoadValidation: boolean;
}

export interface TripLoadSummaryItemDto {
  materialName: string;
  unit: TransactionItemUnit;
  loadedQuantity: number;
  outboundQuantity: number;
  remainingQuantity: number;
}

export interface TripLoadSummaryDto {
  tripId: string;
  tripStatus: TripStatus;
  loadEnabled: boolean;
  strictLoadValidation: boolean;
  notes: string | null;
  items: TripLoadSummaryItemDto[];
}

export interface TripLoadSettingsDto {
  defaultStrictLoadValidation: boolean;
}

export function toTripLoadItemDto(
  item: TripLoadItemEntity,
  remainingQuantity: number | null = null,
): TripLoadItemDto {
  return {
    id: item.id,
    tripLoadId: item.tripLoadId,
    materialName: item.materialName,
    quantity: item.quantity,
    unit: item.unit,
    notes: item.notes,
    remainingQuantity,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export function toTripLoadDto(
  load: TripLoadEntity,
  remainingByItemId: Map<string, number> | null = null,
): TripLoadDto {
  return {
    id: load.id,
    tripId: load.tripId,
    notes: load.notes,
    items: load.items.map((item) =>
      toTripLoadItemDto(item, remainingByItemId ? (remainingByItemId.get(item.id) ?? null) : null),
    ),
    createdByUserId: load.createdByUserId,
    updatedByUserId: load.updatedByUserId,
    createdAt: load.createdAt,
    updatedAt: load.updatedAt,
  };
}
