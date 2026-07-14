import { BusinessRuleViolationError } from '../../../../shared/errors/http-exceptions.js';
import type { TransactionItemUnit } from '../../../transaction/domain/transaction-item-unit.js';
import type { TransactionRepository } from '../../../transaction/domain/transaction.repository.js';
import { materialUnitKey, sumOutboundByMaterial } from '../../domain/remaining-quantity.service.js';
import { normalizeMaterialName } from '../../domain/material-name.js';
import type { TripLoadRepository } from '../../domain/trip-load.repository.js';

export interface OutboundValidationLine {
  materialName: string;
  unit: TransactionItemUnit;
  weight: number;
}

export interface TripLoadWarning {
  materialName: string;
  unit: TransactionItemUnit;
  loadedQuantity: number;
  outboundQuantity: number;
  attemptedQuantity: number;
  remainingQuantity: number;
  message: string;
}

export interface ValidateOutboundInput {
  companyId: string;
  tripId: string;
  strictLoadValidation: boolean;
  items: OutboundValidationLine[];
}

export class TripLoadValidationService {
  constructor(
    private readonly tripLoadRepository: TripLoadRepository,
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async validateOutbound(input: ValidateOutboundInput): Promise<TripLoadWarning[]> {
    const load = await this.tripLoadRepository.findByTripId(input.tripId);
    if (!load || load.items.length === 0) return [];

    const loadedByKey = new Map<
      string,
      { quantity: number; materialName: string; unit: TransactionItemUnit }
    >();
    for (const item of load.items) {
      loadedByKey.set(materialUnitKey(item.materialNameNorm, item.unit), {
        quantity: item.quantity,
        materialName: item.materialName,
        unit: item.unit,
      });
    }

    const existingLines = await this.transactionRepository.listOutboundItemLinesByTrip(
      input.tripId,
      input.companyId,
    );
    const outboundByKey = sumOutboundByMaterial(
      existingLines.map((line) => ({
        materialNameNorm: normalizeMaterialName(line.materialName),
        unit: line.unit,
        weight: line.weight,
      })),
    );

    const attemptedByKey = new Map<string, number>();
    for (const item of input.items) {
      const key = materialUnitKey(normalizeMaterialName(item.materialName), item.unit);
      attemptedByKey.set(key, (attemptedByKey.get(key) ?? 0) + item.weight);
    }

    const warnings: TripLoadWarning[] = [];
    for (const [key, attempted] of attemptedByKey.entries()) {
      const loaded = loadedByKey.get(key);
      if (!loaded) continue;
      const outbound = outboundByKey.get(key) ?? 0;
      const total = outbound + attempted;
      if (total > loaded.quantity) {
        warnings.push({
          materialName: loaded.materialName,
          unit: loaded.unit,
          loadedQuantity: loaded.quantity,
          outboundQuantity: outbound,
          attemptedQuantity: attempted,
          remainingQuantity: loaded.quantity - total,
          message: `Outbound quantity for ${loaded.materialName} exceeds the loaded amount by ${
            total - loaded.quantity
          } ${loaded.unit}.`,
        });
      }
    }

    if (warnings.length > 0 && input.strictLoadValidation) {
      throw new BusinessRuleViolationError(
        'Outbound quantity exceeds the trip load for one or more materials.',
        warnings.map((warning) => ({ path: 'items', message: warning.message })),
      );
    }

    return warnings;
  }
}
