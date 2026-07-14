import type { TransactionItemUnit } from '../../transaction/domain/transaction-item-unit.js';
import type { TripLoadEntity } from './trip-load.entity.js';
import type { TripLoadItemEntity } from './trip-load-item.entity.js';

export interface CreateTripLoadInput {
  id: string;
  tripId: string;
  notes?: string | null;
  createdByUserId: string;
  items: Array<{
    id: string;
    materialName: string;
    materialNameNorm: string;
    quantity: number;
    unit: TransactionItemUnit;
    notes?: string | null;
  }>;
}

export interface UpdateTripLoadNotesInput {
  notes?: string | null;
  updatedByUserId: string;
}

export interface CreateTripLoadItemInput {
  id: string;
  materialName: string;
  materialNameNorm: string;
  quantity: number;
  unit: TransactionItemUnit;
  notes?: string | null;
  updatedByUserId: string;
}

export interface UpdateTripLoadItemInput {
  materialName?: string;
  materialNameNorm?: string;
  quantity?: number;
  unit?: TransactionItemUnit;
  notes?: string | null;
  updatedByUserId: string;
}

export interface TripLoadRepository {
  create(input: CreateTripLoadInput): Promise<TripLoadEntity>;
  findByTripId(tripId: string): Promise<TripLoadEntity | null>;
  updateNotes(tripLoadId: string, input: UpdateTripLoadNotesInput): Promise<TripLoadEntity>;
  deleteByTripId(tripId: string): Promise<void>;
  addItem(tripLoadId: string, input: CreateTripLoadItemInput): Promise<TripLoadItemEntity>;
  updateItem(
    tripLoadId: string,
    itemId: string,
    input: UpdateTripLoadItemInput,
  ): Promise<TripLoadItemEntity>;
  removeItem(tripLoadId: string, itemId: string): Promise<void>;
}
