import { randomUUID } from 'node:crypto';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import {
  BusinessRuleViolationError,
  ResourceNotFoundError,
  ValidationAppError,
} from '../../../../shared/errors/http-exceptions.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { ExpenseRepository } from '../../domain/expense.repository.js';
import type { ExpenseAttachmentRepository } from '../../domain/expense-attachment.repository.js';
import {
  ALLOWED_PHOTO_MIME_TYPES,
  MAX_PHOTO_SIZE_BYTES,
} from '../../../transaction/domain/attachment-constraints.js';
import { assertAttachmentsEditable, MAX_EXPENSE_PHOTOS } from '../../domain/expense-rules.js';
import type { ExpenseFileStorage } from '../../infrastructure/file-storage/expense-file-storage.js';
import {
  buildExpenseAttachmentResponse,
  type ExpenseAttachmentResponseDto,
} from '../dto/expense-attachment.response.js';
import { assertCanManageAttachments } from '../policies/expense-authorization.policy.js';
import { EXPENSE_AUDIT_ACTIONS, logExpenseAudit } from '../services/expense-audit.service.js';
import {
  isExpenseOwner,
  resolveExpenseOwnershipContext,
} from '../services/expense-access.service.js';

export interface UploadedExpenseFileInput {
  originalName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

export class AddExpenseAttachmentUseCase {
  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly attachmentRepository: ExpenseAttachmentRepository,
    private readonly fileStorage: ExpenseFileStorage,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    expenseId: string,
    auth: AuthorizationContext,
    file: UploadedExpenseFileInput | undefined,
  ): Promise<ExpenseAttachmentResponseDto> {
    if (!file) {
      throw new ValidationAppError('A photo file is required.', [
        { path: 'file', message: 'Provide a photo in the multipart "file" field.' },
      ]);
    }
    if (!ALLOWED_PHOTO_MIME_TYPES.includes(file.mimeType)) {
      throw new ValidationAppError('Unsupported file type. Allowed types: JPEG, PNG, WEBP.');
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      throw new ValidationAppError('File exceeds the 5 MB size limit.');
    }

    const expense = await this.expenseRepository.findById(expenseId, auth.companyId);
    if (!expense) throw new ResourceNotFoundError('Expense not found');

    const { actingEmployeeId } = await resolveExpenseOwnershipContext(this.userRepository, auth);
    const isOwner = isExpenseOwner(expense, actingEmployeeId);
    assertCanManageAttachments(auth, { isOwner });
    assertAttachmentsEditable(expense, auth.role, isOwner);

    const existingCount = await this.attachmentRepository.countByExpense(expenseId);
    if (existingCount >= MAX_EXPENSE_PHOTOS) {
      throw new BusinessRuleViolationError(
        `An expense can have at most ${MAX_EXPENSE_PHOTOS} photos.`,
      );
    }

    const saved = await this.fileStorage.save({
      companyId: auth.companyId,
      expenseId,
      fileName: file.originalName,
      mimeType: file.mimeType,
      content: file.buffer,
    });

    const attachment = await this.attachmentRepository.create({
      id: randomUUID(),
      expenseId,
      attachmentType: 'PHOTO',
      fileName: file.originalName,
      filePath: saved.filePath,
      mimeType: file.mimeType,
      fileSize: saved.fileSize,
      uploadedByUserId: auth.userId,
    });

    logExpenseAudit({
      action: EXPENSE_AUDIT_ACTIONS.ATTACHMENT_ADDED,
      companyId: auth.companyId,
      resourceType: 'expense_attachment',
      resourceId: attachment.id,
      actorUserId: auth.userId,
      metadata: { expenseId },
    });

    return buildExpenseAttachmentResponse(attachment);
  }
}
