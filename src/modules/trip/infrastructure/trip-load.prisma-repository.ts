import { prisma } from '../../../database/prisma.client.js';
import { ResourceNotFoundError } from '../../../shared/errors/http-exceptions.js';
import type { TripLoadEntity } from '../domain/trip-load.entity.js';
import type { TripLoadItemEntity } from '../domain/trip-load-item.entity.js';
import type {
  CreateTripLoadInput,
  CreateTripLoadItemInput,
  TripLoadRepository,
  UpdateTripLoadItemInput,
  UpdateTripLoadNotesInput,
} from '../domain/trip-load.repository.js';
import { toTripLoadDomain, toTripLoadItemDomain } from './mappers/trip-load.mapper.js';

async function loadWithItems(tripLoadId: string): Promise<TripLoadEntity> {
  const record = await prisma.tripLoad.findUnique({
    where: { id: tripLoadId },
    include: { items: { orderBy: { createdAt: 'asc' } } },
  });
  if (!record) throw new ResourceNotFoundError('Trip load not found');
  return toTripLoadDomain(record);
}

export class TripLoadPrismaRepository implements TripLoadRepository {
  async create(input: CreateTripLoadInput): Promise<TripLoadEntity> {
    const record = await prisma.tripLoad.create({
      data: {
        id: input.id,
        tripId: input.tripId,
        notes: input.notes ?? null,
        createdByUserId: input.createdByUserId,
        updatedByUserId: input.createdByUserId,
        items: {
          create: input.items.map((item) => ({
            id: item.id,
            materialName: item.materialName,
            materialNameNorm: item.materialNameNorm,
            quantity: item.quantity,
            unit: item.unit,
            notes: item.notes ?? null,
          })),
        },
      },
      include: { items: { orderBy: { createdAt: 'asc' } } },
    });
    return toTripLoadDomain(record);
  }

  async findByTripId(tripId: string): Promise<TripLoadEntity | null> {
    const record = await prisma.tripLoad.findUnique({
      where: { tripId },
      include: { items: { orderBy: { createdAt: 'asc' } } },
    });
    return record ? toTripLoadDomain(record) : null;
  }

  async updateNotes(tripLoadId: string, input: UpdateTripLoadNotesInput): Promise<TripLoadEntity> {
    await prisma.tripLoad.update({
      where: { id: tripLoadId },
      data: {
        notes: input.notes ?? null,
        updatedByUserId: input.updatedByUserId,
      },
    });
    return loadWithItems(tripLoadId);
  }

  async deleteByTripId(tripId: string): Promise<void> {
    await prisma.tripLoad.deleteMany({ where: { tripId } });
  }

  async addItem(tripLoadId: string, input: CreateTripLoadItemInput): Promise<TripLoadItemEntity> {
    const record = await prisma.tripLoadItem.create({
      data: {
        id: input.id,
        tripLoadId,
        materialName: input.materialName,
        materialNameNorm: input.materialNameNorm,
        quantity: input.quantity,
        unit: input.unit,
        notes: input.notes ?? null,
      },
    });
    await prisma.tripLoad.update({
      where: { id: tripLoadId },
      data: { updatedByUserId: input.updatedByUserId },
    });
    return toTripLoadItemDomain(record);
  }

  async updateItem(
    tripLoadId: string,
    itemId: string,
    input: UpdateTripLoadItemInput,
  ): Promise<TripLoadItemEntity> {
    const existing = await prisma.tripLoadItem.findFirst({
      where: { id: itemId, tripLoadId },
    });
    if (!existing) throw new ResourceNotFoundError('Trip load item not found');
    const record = await prisma.tripLoadItem.update({
      where: { id: itemId },
      data: {
        materialName: input.materialName,
        materialNameNorm: input.materialNameNorm,
        quantity: input.quantity,
        unit: input.unit,
        notes: input.notes,
      },
    });
    await prisma.tripLoad.update({
      where: { id: tripLoadId },
      data: { updatedByUserId: input.updatedByUserId },
    });
    return toTripLoadItemDomain(record);
  }

  async removeItem(tripLoadId: string, itemId: string): Promise<void> {
    const existing = await prisma.tripLoadItem.findFirst({
      where: { id: itemId, tripLoadId },
    });
    if (!existing) throw new ResourceNotFoundError('Trip load item not found');
    await prisma.tripLoadItem.delete({ where: { id: itemId } });
  }
}
