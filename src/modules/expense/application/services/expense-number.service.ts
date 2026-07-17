import { ExpenseNumber } from '../../domain/expense-number.js';
import type { ExpenseNumberSequenceRepository } from '../../domain/expense-number-sequence.repository.js';
import { toPhSequenceDate } from '../../../../shared/datetime/philippine-time.js';

export class ExpenseNumberService {
  constructor(private readonly expenseNumberSequenceRepository: ExpenseNumberSequenceRepository) {}

  async allocate(companyId: string, expenseDate: Date): Promise<string> {
    const sequenceDate = toPhSequenceDate(expenseDate);
    const sequence = await this.expenseNumberSequenceRepository.allocateNext(
      companyId,
      sequenceDate,
    );
    return ExpenseNumber.fromParts(expenseDate, sequence).toString();
  }
}
