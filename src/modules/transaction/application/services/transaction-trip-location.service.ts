import {
  ResourceNotFoundError,
  ValidationAppError,
} from '../../../../shared/errors/http-exceptions.js';
import type { TripRepository } from '../../../trip/domain/trip.repository.js';

export async function validateTripLocationReference(
  tripRepository: TripRepository,
  companyId: string,
  tripId: string,
  assignedEmployeeIds: string[],
): Promise<void> {
  const trip = await tripRepository.findById(tripId, companyId);
  if (!trip) throw new ResourceNotFoundError('Trip not found');

  const detail = await tripRepository.findDetailById(tripId, companyId);
  if (!detail) throw new ResourceNotFoundError('Trip not found');

  const memberIds = new Set(detail.members.map((member) => member.employeeId));
  for (const employeeId of assignedEmployeeIds) {
    if (!memberIds.has(employeeId)) {
      throw new ValidationAppError(
        'Assigned employee must be a trip member for TRIP transactions.',
        [
          {
            path: 'assignedEmployeeIds',
            message: `Employee ${employeeId} is not assigned to this trip.`,
          },
        ],
      );
    }
  }
}
