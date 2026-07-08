import { prisma } from '../../../database/prisma.client.js';
import type {
  AllocateTransactionNumberSequenceInput,
  TransactionNumberSequenceRepository,
} from '../domain/transaction-number-sequence.repository.js';

export class TransactionNumberSequencePrismaRepository implements TransactionNumberSequenceRepository {
  async allocateNext(input: AllocateTransactionNumberSequenceInput): Promise<number> {
    const record = await prisma.transactionNumberSequence.upsert({
      where: {
        companyId_direction_sequenceDate: {
          companyId: input.companyId,
          direction: input.direction,
          sequenceDate: input.sequenceDate,
        },
      },
      update: {
        lastSequence: { increment: 1 },
      },
      create: {
        companyId: input.companyId,
        direction: input.direction,
        sequenceDate: input.sequenceDate,
        lastSequence: 1,
      },
    });
    return record.lastSequence;
  }
}
