import { prisma } from '../../../database/prisma.client.js';
import type { TripNumberSequenceRepository } from '../domain/trip-number-sequence.repository.js';

export class TripNumberSequencePrismaRepository implements TripNumberSequenceRepository {
  async allocateNext(companyId: string, sequenceDate: Date): Promise<number> {
    const record = await prisma.tripNumberSequence.upsert({
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
