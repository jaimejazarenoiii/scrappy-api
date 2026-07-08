import { TransactionNumber } from '../../domain/transaction-number.js';
import type { TransactionDirection } from '../../domain/transaction-direction.js';
import type { TransactionNumberSequenceRepository } from '../../domain/transaction-number-sequence.repository.js';

export class TransactionNumberService {
  constructor(
    private readonly transactionNumberSequenceRepository: TransactionNumberSequenceRepository,
  ) {}

  async allocate(
    companyId: string,
    direction: TransactionDirection,
    transactionDate: Date,
  ): Promise<string> {
    const sequenceDate = new Date(
      Date.UTC(
        transactionDate.getUTCFullYear(),
        transactionDate.getUTCMonth(),
        transactionDate.getUTCDate(),
      ),
    );
    const sequence = await this.transactionNumberSequenceRepository.allocateNext({
      companyId,
      direction,
      sequenceDate,
    });
    return TransactionNumber.fromParts(direction, transactionDate, sequence).toString();
  }
}
