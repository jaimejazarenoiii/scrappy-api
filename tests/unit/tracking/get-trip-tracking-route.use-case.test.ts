import { describe, expect, it } from 'vitest';
import { GetTripTrackingRouteUseCase } from '../../../src/modules/tracking/application/use-cases/get-trip-tracking-route.use-case.js';
import { InMemoryLocationHistoryRepository } from '../../setup/in-memory-location-history-repository.js';
import { InMemoryTripRepository } from '../../setup/in-memory-trip-repository.js';
import { InMemoryEmployeeRepository } from '../../setup/in-memory-repositories.js';
import { InMemoryVehicleRepository } from '../../setup/in-memory-repositories.js';
import { randomUUID } from 'node:crypto';

describe('GetTripTrackingRouteUseCase', () => {
  it('returns ordered route points per trip member', async () => {
    const employeeRepository = new InMemoryEmployeeRepository(new Map());
    const vehicleRepository = new InMemoryVehicleRepository();
    const tripRepository = new InMemoryTripRepository(vehicleRepository, employeeRepository);
    const historyRepository = new InMemoryLocationHistoryRepository();

    const companyId = randomUUID();
    const employeeId = randomUUID();
    await employeeRepository.create({
      id: employeeId,
      companyId,
      firstName: 'Juan',
      lastName: 'Cruz',
      weeklySalary: 1000,
    });

    const vehicle = await vehicleRepository.create({
      id: randomUUID(),
      companyId,
      plateNumber: 'ABC-123',
      description: null,
    });

    const trip = await tripRepository.create({
      id: randomUUID(),
      companyId,
      tripNumber: 'TRP-001',
      vehicleId: vehicle.id,
      status: 'STARTED',
      scheduledStart: new Date(),
      origin: 'A',
      destination: 'B',
      notes: null,
      createdByUserId: null,
      updatedByUserId: null,
      members: [{ employeeId, role: 'DRIVER' }],
    });
    await tripRepository.start(trip.id, companyId, {
      actualStart: new Date(),
      startedByUserId: randomUUID(),
    });

    await historyRepository.append({
      id: randomUUID(),
      companyId,
      employeeId,
      tripId: trip.id,
      latitude: 14.5,
      longitude: 120.9,
      capturedAt: new Date('2026-07-24T10:00:00Z'),
      accuracy: 10,
      speed: null,
      heading: null,
      batteryLevel: null,
    });
    await historyRepository.append({
      id: randomUUID(),
      companyId,
      employeeId,
      tripId: trip.id,
      latitude: 14.6,
      longitude: 121.0,
      capturedAt: new Date('2026-07-24T10:00:20Z'),
      accuracy: 8,
      speed: null,
      heading: null,
      batteryLevel: null,
    });

    const useCase = new GetTripTrackingRouteUseCase(tripRepository, historyRepository);
    const result = await useCase.execute(
      { companyId, userId: randomUUID(), role: 'OWNER' },
      trip.id,
      { page: 1, limit: 500, sortOrder: 'asc' },
    );

    expect(result.tripId).toBe(trip.id);
    expect(result.employees).toHaveLength(1);
    expect(result.employees[0]?.points).toHaveLength(2);
    expect(result.employees[0]?.points[0]?.latitude).toBe(14.5);
    expect(result.employees[0]?.meta.total).toBe(2);
  });
});
