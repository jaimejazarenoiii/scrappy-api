import type { TransactionItemUnit } from '../../../transaction/domain/transaction-item-unit.js';

export interface TripLoadItemInputDto {
  materialName: string;
  quantity: number;
  unit: TransactionItemUnit;
  notes?: string | null;
}

export interface CreateTripLoadRequestDto {
  notes?: string | null;
  items: TripLoadItemInputDto[];
}

export interface UpdateTripLoadRequestDto {
  notes?: string | null;
}

export interface CreateTripLoadItemRequestDto {
  materialName: string;
  quantity: number;
  unit: TransactionItemUnit;
  notes?: string | null;
}

export interface UpdateTripLoadItemRequestDto {
  materialName?: string;
  quantity?: number;
  unit?: TransactionItemUnit;
  notes?: string | null;
}

export interface EnableTripLoadRequestDto {
  strictLoadValidation?: boolean;
}

export interface UpdateTripLoadSettingsRequestDto {
  defaultStrictLoadValidation?: boolean;
}
