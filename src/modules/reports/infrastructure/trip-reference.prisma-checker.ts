import { prisma } from '../../../database/prisma.client.js';
import type { TripReferenceChecker } from '../application/services/report-filter-validator.service.js';

export class TripReferencePrismaChecker implements TripReferenceChecker {
  async exists(tripId: string, companyId: string): Promise<boolean> {
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, companyId },
      select: { id: true },
    });
    return trip !== null;
  }
}
