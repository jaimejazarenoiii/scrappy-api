import type { ExpenseAttachmentType } from './expense-attachment-type.js';

export interface ExpenseAttachmentProps {
  id: string;
  expenseId: string;
  attachmentType: ExpenseAttachmentType;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  uploadedByUserId: string;
  createdAt: Date;
}

export class ExpenseAttachmentEntity {
  private constructor(private readonly props: ExpenseAttachmentProps) {}

  static create(props: ExpenseAttachmentProps): ExpenseAttachmentEntity {
    return new ExpenseAttachmentEntity(props);
  }

  get id(): string {
    return this.props.id;
  }
  get expenseId(): string {
    return this.props.expenseId;
  }
  get filePath(): string {
    return this.props.filePath;
  }

  toPrimitives(): ExpenseAttachmentProps {
    return { ...this.props };
  }
}
