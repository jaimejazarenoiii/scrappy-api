import { randomUUID } from 'node:crypto';
import { ResourceNotFoundError } from '../../src/shared/errors/http-exceptions.js';
import { TripLoadEntity } from '../../src/modules/trip/domain/trip-load.entity.js';
import { TripLoadItemEntity } from '../../src/modules/trip/domain/trip-load-item.entity.js';
import type {
  CreateTripLoadInput,
  CreateTripLoadItemInput,
  TripLoadRepository,
  UpdateTripLoadItemInput,
  UpdateTripLoadNotesInput,
} from '../../src/modules/trip/domain/trip-load.repository.js';

interface StoredItem {
  id: string;
  tripLoadId: string;
  materialName: string;
  materialNameNorm: string;
  quantity: number;
  unit: TripLoadItemEntity['unit'];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface StoredLoad {
  id: string;
  tripId: string;
  notes: string | null;
  createdByUserId: string;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class InMemoryTripLoadRepository implements TripLoadRepository {
  public loads = new Map<string, StoredLoad>();
  public items = new Map<string, StoredItem>();

  private build(load: StoredLoad): TripLoadEntity {
    const items = [...this.items.values()]
      .filter((item) => item.tripLoadId === load.id)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((item) =>
        TripLoadItemEntity.create({
          id: item.id,
          tripLoadId: item.tripLoadId,
          materialName: item.materialName,
          materialNameNorm: item.materialNameNorm,
          quantity: item.quantity,
          unit: item.unit,
          notes: item.notes,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }),
      );
    return TripLoadEntity.create({
      id: load.id,
      tripId: load.tripId,
      notes: load.notes,
      createdByUserId: load.createdByUserId,
      updatedByUserId: load.updatedByUserId,
      createdAt: load.createdAt,
      updatedAt: load.updatedAt,
      items,
    });
  }

  private findLoadByTripId(tripId: string): StoredLoad | undefined {
    return [...this.loads.values()].find((load) => load.tripId === tripId);
  }

  async create(input: CreateTripLoadInput): Promise<TripLoadEntity> {
    const now = new Date();
    const load: StoredLoad = {
      id: input.id,
      tripId: input.tripId,
      notes: input.notes ?? null,
      createdByUserId: input.createdByUserId,
      updatedByUserId: input.createdByUserId,
      createdAt: now,
      updatedAt: now,
    };
    this.loads.set(load.id, load);
    let offset = 0;
    for (const item of input.items) {
      this.items.set(item.id, {
        id: item.id,
        tripLoadId: load.id,
        materialName: item.materialName,
        materialNameNorm: item.materialNameNorm,
        quantity: item.quantity,
        unit: item.unit,
        notes: item.notes ?? null,
        createdAt: new Date(now.getTime() + offset),
        updatedAt: new Date(now.getTime() + offset),
      });
      offset += 1;
    }
    return this.build(load);
  }

  async findByTripId(tripId: string): Promise<TripLoadEntity | null> {
    const load = this.findLoadByTripId(tripId);
    return load ? this.build(load) : null;
  }

  async updateNotes(tripLoadId: string, input: UpdateTripLoadNotesInput): Promise<TripLoadEntity> {
    const load = this.loads.get(tripLoadId);
    if (!load) throw new ResourceNotFoundError('Trip load not found');
    load.notes = input.notes ?? null;
    load.updatedByUserId = input.updatedByUserId;
    load.updatedAt = new Date();
    this.loads.set(tripLoadId, load);
    return this.build(load);
  }

  async deleteByTripId(tripId: string): Promise<void> {
    const load = this.findLoadByTripId(tripId);
    if (!load) return;
    for (const item of [...this.items.values()]) {
      if (item.tripLoadId === load.id) this.items.delete(item.id);
    }
    this.loads.delete(load.id);
  }

  async addItem(tripLoadId: string, input: CreateTripLoadItemInput): Promise<TripLoadItemEntity> {
    const load = this.loads.get(tripLoadId);
    if (!load) throw new ResourceNotFoundError('Trip load not found');
    const now = new Date();
    const stored: StoredItem = {
      id: input.id ?? randomUUID(),
      tripLoadId,
      materialName: input.materialName,
      materialNameNorm: input.materialNameNorm,
      quantity: input.quantity,
      unit: input.unit,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.items.set(stored.id, stored);
    load.updatedByUserId = input.updatedByUserId;
    load.updatedAt = now;
    return TripLoadItemEntity.create({ ...stored });
  }

  async updateItem(
    tripLoadId: string,
    itemId: string,
    input: UpdateTripLoadItemInput,
  ): Promise<TripLoadItemEntity> {
    const item = this.items.get(itemId);
    if (!item || item.tripLoadId !== tripLoadId) {
      throw new ResourceNotFoundError('Trip load item not found');
    }
    if (input.materialName !== undefined) item.materialName = input.materialName;
    if (input.materialNameNorm !== undefined) item.materialNameNorm = input.materialNameNorm;
    if (input.quantity !== undefined) item.quantity = input.quantity;
    if (input.unit !== undefined) item.unit = input.unit;
    if (input.notes !== undefined) item.notes = input.notes;
    item.updatedAt = new Date();
    this.items.set(itemId, item);
    const load = this.loads.get(tripLoadId);
    if (load) {
      load.updatedByUserId = input.updatedByUserId;
      load.updatedAt = new Date();
    }
    return TripLoadItemEntity.create({ ...item });
  }

  async removeItem(tripLoadId: string, itemId: string): Promise<void> {
    const item = this.items.get(itemId);
    if (!item || item.tripLoadId !== tripLoadId) {
      throw new ResourceNotFoundError('Trip load item not found');
    }
    this.items.delete(itemId);
  }
}
