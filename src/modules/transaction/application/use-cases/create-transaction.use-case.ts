import { randomUUID } from 'node:crypto';
import {
  ResourceNotFoundError,
  ValidationAppError,
} from '../../../../shared/errors/http-exceptions.js';
import { computeItemTotal } from '../../../../shared/transactions/item-total.js';
import { toCanonicalDirection } from '../../../../shared/transactions/direction-mapper.js';
import type { AttendanceSessionRepository } from '../../../attendance/domain/attendance-session.repository.js';
import type { BranchRepository } from '../../../branch/domain/branch.repository.js';
import type { EmployeeRepository } from '../../../employee/domain/employee.repository.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { WarehouseRepository } from '../../../warehouse/domain/warehouse.repository.js';
import type {
  CreateTransactionInput,
  TransactionRepository,
} from '../../domain/transaction.repository.js';
import {
  assertLocationFields,
  assertItemTotal,
  assertOperationallyReady,
} from '../../domain/transaction-rules.js';
import {
  buildTransactionDetailResponse,
  type TransactionDetailResponseDto,
} from '../dto/transaction-detail.response.js';
import type { CreateTransactionRequestDto } from '../dto/create-transaction.request.js';
import { resolveActingEmployeeIdForUser } from '../services/transaction-access.service.js';
import { logTransactionAudit } from '../services/transaction-audit.service.js';
import type { TransactionNumberService } from '../services/transaction-number.service.js';

export class CreateTransactionUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly userRepository: UserRepository,
    private readonly employeeRepository: EmployeeRepository,
    private readonly attendanceRepository: AttendanceSessionRepository,
    private readonly branchRepository: BranchRepository,
    private readonly warehouseRepository: WarehouseRepository,
    private readonly transactionNumberService: TransactionNumberService,
  ) {}

  async execute(
    companyId: string,
    userId: string,
    input: CreateTransactionRequestDto,
  ): Promise<TransactionDetailResponseDto> {
    const actingEmployeeId = await resolveActingEmployeeIdForUser(
      this.userRepository,
      companyId,
      userId,
    );
    const actingEmployee = await this.employeeRepository.findById(actingEmployeeId, companyId);
    if (!actingEmployee) throw new ResourceNotFoundError('Employee not found');

    const openSession = await this.attendanceRepository.findOpenSession(
      actingEmployeeId,
      companyId,
    );
    assertOperationallyReady(openSession);

    const direction = toCanonicalDirection(input.direction);

    assertLocationFields({
      locationType: input.locationType,
      branchId: input.branchId,
      warehouseId: input.warehouseId,
      outsideLocationName: input.outsideLocationName,
      outsideAddress: input.outsideAddress,
    });
    await this.validateLocationReferences(companyId, input);

    const assignedEmployeeIds = await this.resolveAssignedEmployees(
      companyId,
      input.assignedEmployeeIds,
      actingEmployeeId,
    );

    const items: CreateTransactionInput['items'] = input.items.map((item) => {
      assertItemTotal(item.weight, item.price, item.total);
      return {
        id: randomUUID(),
        materialName: item.materialName,
        weight: item.weight,
        unit: item.unit,
        price: item.price,
        total: computeItemTotal(item.weight, item.price),
        notes: item.notes ?? null,
      };
    });

    const transactionDate = input.transactionDate ?? new Date();
    const transactionNumber = await this.transactionNumberService.allocate(
      companyId,
      direction,
      transactionDate,
    );

    const detail = await this.transactionRepository.create({
      id: randomUUID(),
      companyId,
      createdByUserId: userId,
      transactionNumber,
      direction,
      partyName: input.partyName,
      partyContactNumber: input.partyContactNumber ?? null,
      transactionDate,
      locationType: input.locationType,
      branchId: input.locationType === 'BRANCH' ? (input.branchId ?? null) : null,
      warehouseId: input.locationType === 'WAREHOUSE' ? (input.warehouseId ?? null) : null,
      outsideLocationName:
        input.locationType === 'OUTSIDE' ? (input.outsideLocationName ?? null) : null,
      outsideAddress: input.locationType === 'OUTSIDE' ? (input.outsideAddress ?? null) : null,
      tripId: input.tripId ?? null,
      notes: input.notes ?? null,
      assignedEmployeeIds,
      items,
    });

    logTransactionAudit({
      action: 'transaction.created',
      companyId,
      resourceType: 'transaction',
      resourceId: detail.transaction.id,
      actorUserId: userId,
    });

    return buildTransactionDetailResponse(detail);
  }

  private async validateLocationReferences(
    companyId: string,
    input: { locationType: string; branchId?: string; warehouseId?: string },
  ): Promise<void> {
    if (input.locationType === 'BRANCH' && input.branchId) {
      const branch = await this.branchRepository.findById(input.branchId, companyId);
      if (!branch) throw new ResourceNotFoundError('Branch not found');
    }
    if (input.locationType === 'WAREHOUSE' && input.warehouseId) {
      const warehouse = await this.warehouseRepository.findById(input.warehouseId, companyId);
      if (!warehouse) throw new ResourceNotFoundError('Warehouse not found');
    }
  }

  private async resolveAssignedEmployees(
    companyId: string,
    requestedIds: string[],
    actingEmployeeId: string,
  ): Promise<string[]> {
    const uniqueIds = Array.from(new Set([...requestedIds, actingEmployeeId]));
    for (const employeeId of uniqueIds) {
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
    return uniqueIds;
  }
}
