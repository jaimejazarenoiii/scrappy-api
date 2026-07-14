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
import { toTripLoadDto, type TripLoadDto } from '../dto/trip-load.response.js';
import { assertCanViewTrip } from '../policies/trip-authorization.policy.js';

export class GetTripLoadUseCase {
  constructor(
    private readonly tripRepository: TripRepository,
    private readonly tripLoadRepository: TripLoadRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(tripId: string, auth: AuthorizationContext): Promise<TripLoadDto> {
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

    let remainingByItemId: Map<string, number> | null = null;
    if (detail.status !== 'DRAFT') {
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
      remainingByItemId = new Map<string, number>();
      for (const item of load.items) {
        const key = materialUnitKey(item.materialNameNorm, item.unit);
        remainingByItemId.set(
          item.id,
          calculateRemainingQuantity(item.quantity, outboundByKey.get(key) ?? 0),
        );
      }
    }

    return toTripLoadDto(load, remainingByItemId);
  }
}
