import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { resolveActingEmployeeIdForUser } from '../../../transaction/application/services/transaction-access.service.js';
import type { TransactionRepository } from '../../../transaction/domain/transaction.repository.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import { normalizeMaterialName } from '../../domain/material-name.js';
import {
  calculateRemainingQuantity,
  materialUnitKey,
  sumOutboundByMaterial,
} from '../../domain/remaining-quantity.service.js';
import type { TripLoadRepository } from '../../domain/trip-load.repository.js';
import type { TripRepository } from '../../domain/trip.repository.js';
import { type TripLoadSummaryDto, type TripLoadSummaryItemDto } from '../dto/trip-load.response.js';
import { assertCanViewTrip } from '../policies/trip-authorization.policy.js';

export class GetTripLoadSummaryUseCase {
  constructor(
    private readonly tripRepository: TripRepository,
    private readonly tripLoadRepository: TripLoadRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(tripId: string, auth: AuthorizationContext): Promise<TripLoadSummaryDto> {
    const detail = await this.tripRepository.findDetailById(tripId, auth.companyId);
    if (!detail) throw new ResourceNotFoundError('Trip not found');

    let isMember = true;
    if (auth.role === 'EMPLOYEE') {
      const employeeId = await resolveActingEmployeeIdForUser(
        this.userRepository,
        auth.companyId,
        auth.userId,
      );
      isMember = detail.members.some((member) => member.employeeId === employeeId);
    }
    assertCanViewTrip(auth, { isMember });

    const load = await this.tripLoadRepository.findByTripId(tripId);
    if (!load) throw new ResourceNotFoundError('Trip load not found');

    const lines = await this.transactionRepository.listOutboundItemLinesByTrip(
      tripId,
      auth.companyId,
    );
    const outboundByKey = sumOutboundByMaterial(
      lines.map((line) => ({
        materialNameNorm: normalizeMaterialName(line.materialName),
        unit: line.unit,
        weight: line.weight,
      })),
    );

    const items: TripLoadSummaryItemDto[] = load.items.map((item) => {
      const outbound = outboundByKey.get(materialUnitKey(item.materialNameNorm, item.unit)) ?? 0;
      return {
        materialName: item.materialName,
        unit: item.unit,
        loadedQuantity: item.quantity,
        outboundQuantity: outbound,
        remainingQuantity: calculateRemainingQuantity(item.quantity, outbound),
      };
    });

    return {
      tripId,
      tripStatus: detail.status,
      loadEnabled: detail.loadEnabled,
      strictLoadValidation: detail.strictLoadValidation,
      notes: load.notes,
      items,
    };
  }
}
