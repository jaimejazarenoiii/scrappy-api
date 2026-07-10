import { prisma } from '../../../database/prisma.client.js';
import type { ExpenseNumberSequenceRepository } from '../domain/expense-number-sequence.repository.js';

export class ExpenseNumberSequencePrismaRepository implements ExpenseNumberSequenceRepository {
  async allocateNext(companyId: string, sequenceDate: Date): Promise<number> {
    const record = await prisma.expenseNumberSequence.upsert({
      where: {
        companyId_sequenceDate: {
          companyId,
          sequenceDate,
        },
      },
      update: {
        lastSequence: { increment: 1 },
      },
      create: {
        companyId,
        sequenceDate,
        lastSequence: 1,
      },
    });
    return record.lastSequence;
  }
}
