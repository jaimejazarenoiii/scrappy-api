import type { CompanyRepository } from '../../../company/domain/company.repository.js';
import type { EmployeeRepository } from '../../../employee/domain/employee.repository.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { TransactionDetail } from '../../domain/transaction.repository.js';
import {
  buildTransactionItemResponse,
  type TransactionItemResponseDto,
} from '../dto/transaction-item.response.js';
import type { ReceiptResponseDto } from '../dto/receipt.response.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import { toDirectionLabel } from '../../../../shared/transactions/direction-mapper.js';

export class ReceiptAssemblerService {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly userRepository: UserRepository,
    private readonly employeeRepository: EmployeeRepository,
  ) {}

  async build(detail: TransactionDetail): Promise<ReceiptResponseDto> {
    const props = detail.transaction.toPrimitives();
    if (!props.paidAt || !props.paidByUserId) {
      throw new ResourceNotFoundError('Receipt is only available for paid transactions');
    }

    const company = await this.companyRepository.findById(props.companyId);
    if (!company) throw new ResourceNotFoundError('Company not found');

    const paidByUser = await this.userRepository.findById(props.paidByUserId, props.companyId);
    if (!paidByUser) throw new ResourceNotFoundError('Settling user not found');

    const items = detail.items.map(buildTransactionItemResponse);
    const grandTotal = roundCurrency(items);
    const paidByDisplayName = await this.resolvePaidByDisplayName(
      props.companyId,
      paidByUser.id,
      paidByUser.employeeId,
      paidByUser.email,
    );

    return {
      transactionNumber: props.transactionNumber,
      company: {
        name: company.name,
        contactNumber: company.contactNumber,
        email: company.email,
        address: company.address,
      },
      direction: props.direction,
      directionLabel: toDirectionLabel(props.direction),
      partyName: props.partyName,
      transactionDate: props.transactionDate,
      items,
      grandTotal,
      paidByDisplayName,
      paidAt: props.paidAt,
    };
  }

  private async resolvePaidByDisplayName(
    companyId: string,
    userId: string,
    employeeId: string | null,
    fallbackEmail: string,
  ): Promise<string> {
    if (employeeId) {
      const employee = await this.employeeRepository.findById(employeeId, companyId);
      if (employee) return employee.fullName;
    }
    const user = await this.userRepository.findById(userId, companyId);
    return user?.email ?? fallbackEmail;
  }
}

function roundCurrency(items: TransactionItemResponseDto[]): number {
  return Math.round(items.reduce((sum, item) => sum + item.total, 0) * 100) / 100;
}
