import type { TransactionDirection } from '../../domain/transaction-direction.js';
import type { TransactionItemResponseDto } from './transaction-item.response.js';
import type { TransactionDirectionLabel } from '../../../../shared/transactions/direction-mapper.js';

export interface ReceiptCompanyDto {
  name: string;
  contactNumber: string | null;
  email: string | null;
  address: string | null;
}

export interface ReceiptResponseDto {
  transactionNumber: string;
  company: ReceiptCompanyDto;
  direction: TransactionDirection;
  directionLabel: TransactionDirectionLabel;
  partyName: string;
  transactionDate: Date;
  items: TransactionItemResponseDto[];
  grandTotal: number;
  paidByDisplayName: string;
  paidAt: Date;
}
