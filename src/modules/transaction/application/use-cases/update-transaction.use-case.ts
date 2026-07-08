import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import {
  ResourceNotFoundError,
  ValidationAppError,
} from '../../../../shared/errors/http-exceptions.js';
import { toCanonicalDirection } from '../../../../shared/transactions/direction-mapper.js';
import type { BranchRepository } from '../../../branch/domain/branch.repository.js';
import type { EmployeeRepository } from '../../../employee/domain/employee.repository.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { WarehouseRepository } from '../../../warehouse/domain/warehouse.repository.js';
import type {
  TransactionRepository,
  UpdateTransactionInput,
} from '../../domain/transaction.repository.js';
import type { TransactionLocationType } from '../../domain/transaction-location-type.js';
import { assertEditable, assertLocationFields } from '../../domain/transaction-rules.js';
import { assertCanEditTransaction } from '../policies/transaction-authorization.policy.js';
import {
  buildTransactionDetailResponse,
  type TransactionDetailResponseDto,
} from '../dto/transaction-detail.response.js';
import type { UpdateTransactionRequestDto } from '../dto/update-transaction.request.js';
import { resolveIsAssigned } from '../services/transaction-access.service.js';
import { logTransactionAudit } from '../services/transaction-audit.service.js';

export class UpdateTransactionUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly userRepository: UserRepository,
    private readonly employeeRepository: EmployeeRepository,
    private readonly branchRepository: BranchRepository,
    private readonly warehouseRepository: WarehouseRepository,
  ) {}

  async execute(
    transactionId: string,
    auth: AuthorizationContext,
    input: UpdateTransactionRequestDto,
  ): Promise<TransactionDetailResponseDto> {
    const existing = await this.transactionRepository.findById(transactionId, auth.companyId);
    if (!existing) throw new ResourceNotFoundError('Transaction not found');

    const isAssigned = await resolveIsAssigned(
      { userRepository: this.userRepository, transactionRepository: this.transactionRepository },
      auth,
      transactionId,
    );
    assertCanEditTransaction(auth, { isAssigned });
    assertEditable(existing, auth.role, isAssigned);

    const current = existing.toPrimitives();
    const mergedLocationType = (input.locationType ??
      current.locationType) as TransactionLocationType;
    const mergedBranchId = input.branchId !== undefined ? input.branchId : current.branchId;
    const mergedWarehouseId =
      input.warehouseId !== undefined ? input.warehouseId : current.warehouseId;
    const mergedOutsideName =
      input.outsideLocationName !== undefined
        ? input.outsideLocationName
        : current.outsideLocationName;
    const mergedOutsideAddress =
      input.outsideAddress !== undefined ? input.outsideAddress : current.outsideAddress;

    assertLocationFields({
      locationType: mergedLocationType,
      branchId: mergedBranchId,
      warehouseId: mergedWarehouseId,
      outsideLocationName: mergedOutsideName,
      outsideAddress: mergedOutsideAddress,
    });
    await this.validateLocationReferences(auth.companyId, mergedLocationType, {
      branchId: mergedBranchId,
      warehouseId: mergedWarehouseId,
    });

    if (input.assignedEmployeeIds) {
      await this.validateAssignedEmployees(auth.companyId, input.assignedEmployeeIds);
    }

    const update: UpdateTransactionInput = {
      updatedByUserId: auth.userId,
      partyName: input.partyName,
      partyContactNumber: input.partyContactNumber,
      transactionDate: input.transactionDate,
      tripId: input.tripId,
      notes: input.notes,
      assignedEmployeeIds: input.assignedEmployeeIds,
    };
    if (input.direction !== undefined) update.direction = toCanonicalDirection(input.direction);
    if (input.locationType !== undefined) {
      update.locationType = mergedLocationType;
      update.branchId = mergedLocationType === 'BRANCH' ? (mergedBranchId ?? null) : null;
      update.warehouseId = mergedLocationType === 'WAREHOUSE' ? (mergedWarehouseId ?? null) : null;
      update.outsideLocationName =
        mergedLocationType === 'OUTSIDE' ? (mergedOutsideName ?? null) : null;
      update.outsideAddress =
        mergedLocationType === 'OUTSIDE' ? (mergedOutsideAddress ?? null) : null;
    } else {
      if (input.branchId !== undefined) update.branchId = input.branchId;
      if (input.warehouseId !== undefined) update.warehouseId = input.warehouseId;
      if (input.outsideLocationName !== undefined)
        update.outsideLocationName = input.outsideLocationName;
      if (input.outsideAddress !== undefined) update.outsideAddress = input.outsideAddress;
    }

    const detail = await this.transactionRepository.update(transactionId, auth.companyId, update);

    logTransactionAudit({
      action: 'transaction.updated',
      companyId: auth.companyId,
      resourceType: 'transaction',
      resourceId: transactionId,
      actorUserId: auth.userId,
    });

    return buildTransactionDetailResponse(detail);
  }

  private async validateLocationReferences(
    companyId: string,
    locationType: TransactionLocationType,
    refs: { branchId?: string | null; warehouseId?: string | null },
  ): Promise<void> {
    if (locationType === 'BRANCH' && refs.branchId) {
      const branch = await this.branchRepository.findById(refs.branchId, companyId);
      if (!branch) throw new ResourceNotFoundError('Branch not found');
    }
    if (locationType === 'WAREHOUSE' && refs.warehouseId) {
      const warehouse = await this.warehouseRepository.findById(refs.warehouseId, companyId);
      if (!warehouse) throw new ResourceNotFoundError('Warehouse not found');
    }
  }

  private async validateAssignedEmployees(companyId: string, employeeIds: string[]): Promise<void> {
    for (const employeeId of employeeIds) {
      const employee = await this.employeeRepository.findById(employeeId, companyId);
      if (!employee) {
        throw new ValidationAppError('Assigned employee not found in company.', [
          { path: 'assignedEmployeeIds', message: `Employee ${employeeId} not found.` },
        ]);
      }
      if (!employee.isActive()) {
        throw new ValidationAppError('Assigned employee is not active.', [
          { path: 'assignedEmployeeIds', message: `Employee ${employeeId} is not active.` },
        ]);
      }
    }
  }
}
