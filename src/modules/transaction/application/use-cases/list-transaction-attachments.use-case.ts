import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { TransactionRepository } from '../../domain/transaction.repository.js';
import type { TransactionAttachmentRepository } from '../../domain/transaction-attachment.repository.js';
import { assertCanViewTransaction } from '../policies/transaction-authorization.policy.js';
import {
  buildTransactionAttachmentResponse,
  type TransactionAttachmentResponseDto,
} from '../dto/transaction-attachment.response.js';
import { resolveActingEmployeeIdForUser } from '../services/transaction-access.service.js';

export class ListTransactionAttachmentsUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly attachmentRepository: TransactionAttachmentRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    transactionId: string,
    auth: AuthorizationContext,
  ): Promise<TransactionAttachmentResponseDto[]> {
    const detail = await this.transactionRepository.findDetailById(transactionId, auth.companyId, {
      includeArchived: true,
    });
    if (!detail) throw new ResourceNotFoundError('Transaction not found');

    let isAssigned = true;
    if (auth.role === 'EMPLOYEE') {
      const employeeId = await resolveActingEmployeeIdForUser(
        this.userRepository,
        auth.companyId,
        auth.userId,
      );
      isAssigned = detail.assignments.some((assignment) => assignment.employeeId === employeeId);
    }
    assertCanViewTransaction(auth, { isAssigned });

    const attachments = await this.attachmentRepository.listByTransaction(transactionId);
    return attachments.map(buildTransactionAttachmentResponse);
  }
}
