import {
  BusinessRuleViolationError,
  ResourceNotFoundError,
} from '../../../../shared/errors/http-exceptions.js';
import type { BranchRepository } from '../../../branch/domain/branch.repository.js';
import type { WarehouseRepository } from '../../../warehouse/domain/warehouse.repository.js';
import type { VehicleRepository } from '../../../vehicle/domain/vehicle.repository.js';
import type { TripRepository } from '../../../trip/domain/trip.repository.js';
import { TripEligibilityService } from '../../../trip/application/services/trip-eligibility.service.js';
import type { ExpenseContextType } from '../../domain/expense-context-type.js';
import { assertContextFields } from '../../domain/expense-rules.js';

export interface ExpenseContextInput {
  contextType: ExpenseContextType;
  branchId?: string | null;
  warehouseId?: string | null;
  vehicleId?: string | null;
  tripId?: string | null;
}

export class ExpenseContextValidationService {
  private readonly tripEligibilityService = new TripEligibilityService();

  constructor(
    private readonly branchRepository: BranchRepository,
    private readonly warehouseRepository: WarehouseRepository,
    private readonly vehicleRepository: VehicleRepository,
    private readonly tripRepository: TripRepository,
  ) {}

  validateShape(input: ExpenseContextInput): void {
    assertContextFields(input);
  }

  async validateReferences(companyId: string, input: ExpenseContextInput): Promise<void> {
    this.validateShape(input);

    if (input.contextType === 'BRANCH' && input.branchId) {
      const branch = await this.branchRepository.findById(input.branchId, companyId);
      if (!branch) throw new ResourceNotFoundError('Branch not found');
      const props = branch.toPrimitives();
      if (props.deletedAt) {
        throw new BusinessRuleViolationError('Archived branches cannot be referenced.');
      }
    }

    if (input.contextType === 'WAREHOUSE' && input.warehouseId) {
      const warehouse = await this.warehouseRepository.findById(input.warehouseId, companyId);
      if (!warehouse) throw new ResourceNotFoundError('Warehouse not found');
      const props = warehouse.toPrimitives();
      if (props.deletedAt) {
        throw new BusinessRuleViolationError('Archived warehouses cannot be referenced.');
      }
    }

    if (input.contextType === 'VEHICLE' && input.vehicleId) {
      const vehicle = await this.vehicleRepository.findById(input.vehicleId, companyId);
      if (!vehicle) throw new ResourceNotFoundError('Vehicle not found');
      const props = vehicle.toPrimitives();
      if (props.deletedAt) {
        throw new BusinessRuleViolationError('Archived vehicles cannot be referenced.');
      }
    }

    if (input.contextType === 'TRIP' && input.tripId) {
      const trip = await this.tripRepository.findById(input.tripId, companyId);
      if (!trip) throw new ResourceNotFoundError('Trip not found');
      this.tripEligibilityService.assertTripAcceptsExpense(trip);
    }
  }

  resolveContextForeignKeys(input: ExpenseContextInput): {
    branchId: string | null;
    warehouseId: string | null;
    vehicleId: string | null;
    tripId: string | null;
  } {
    return {
      branchId: input.contextType === 'BRANCH' ? (input.branchId ?? null) : null,
      warehouseId: input.contextType === 'WAREHOUSE' ? (input.warehouseId ?? null) : null,
      vehicleId: input.contextType === 'VEHICLE' ? (input.vehicleId ?? null) : null,
      tripId: input.contextType === 'TRIP' ? (input.tripId ?? null) : null,
    };
  }
}
