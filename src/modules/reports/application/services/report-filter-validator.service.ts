import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { BranchRepository } from '../../../branch/domain/branch.repository.js';
import type { WarehouseRepository } from '../../../warehouse/domain/warehouse.repository.js';
import type { VehicleRepository } from '../../../vehicle/domain/vehicle.repository.js';
import type { EmployeeRepository } from '../../../employee/domain/employee.repository.js';
import type { ReportFilter } from '../../domain/report-filter.js';

export interface TripReferenceChecker {
  exists(tripId: string, companyId: string): Promise<boolean>;
}

export class ReportFilterValidatorService {
  constructor(
    private readonly branchRepository: BranchRepository,
    private readonly warehouseRepository: WarehouseRepository,
    private readonly vehicleRepository: VehicleRepository,
    private readonly employeeRepository: EmployeeRepository,
    private readonly tripReferenceChecker: TripReferenceChecker,
  ) {}

  async validateReferences(filter: ReportFilter): Promise<void> {
    if (filter.branchId) {
      const branch = await this.branchRepository.findByIdIncludingArchived(
        filter.branchId,
        filter.companyId,
      );
      if (!branch) throw new ResourceNotFoundError('Branch not found');
    }
    if (filter.warehouseId) {
      const warehouse = await this.warehouseRepository.findById(
        filter.warehouseId,
        filter.companyId,
      );
      if (!warehouse) throw new ResourceNotFoundError('Warehouse not found');
    }
    if (filter.vehicleId) {
      const vehicle = await this.vehicleRepository.findById(filter.vehicleId, filter.companyId);
      if (!vehicle) throw new ResourceNotFoundError('Vehicle not found');
    }
    if (filter.employeeId) {
      const employee = await this.employeeRepository.findById(filter.employeeId, filter.companyId);
      if (!employee) throw new ResourceNotFoundError('Employee not found');
    }
    if (filter.tripId) {
      const exists = await this.tripReferenceChecker.exists(filter.tripId, filter.companyId);
      if (!exists) throw new ResourceNotFoundError('Trip not found');
    }
  }
}
