import type { EmployeeRepository } from '../employee/domain/employee.repository.js';
import type { UserRepository } from '../user/domain/user.repository.js';
import type { VehicleRepository } from '../vehicle/domain/vehicle.repository.js';
import type { TransactionRepository } from '../transaction/domain/transaction.repository.js';
import type { TripRepository } from './domain/trip.repository.js';
import type { TripNumberSequenceRepository } from './domain/trip-number-sequence.repository.js';
import { TripNumberService } from './application/services/trip-number.service.js';
import { ListTripsUseCase } from './application/use-cases/list-trips.use-case.js';
import { GetTripDashboardUseCase } from './application/use-cases/get-trip-dashboard.use-case.js';
import { CreateTripUseCase } from './application/use-cases/create-trip.use-case.js';
import { GetTripUseCase } from './application/use-cases/get-trip.use-case.js';
import { GetTripHistoryUseCase } from './application/use-cases/get-trip-history.use-case.js';
import { ListTripTransactionsUseCase } from './application/use-cases/list-trip-transactions.use-case.js';
import { TripController } from './presentation/trip.controller.js';

export { createTripRoutes } from './presentation/trip.routes.js';

export interface TripModuleDependencies {
  tripRepository: TripRepository;
  tripNumberSequenceRepository: TripNumberSequenceRepository;
  vehicleRepository: VehicleRepository;
  employeeRepository: EmployeeRepository;
  userRepository: UserRepository;
  transactionRepository: TransactionRepository;
}

export function buildTripController(deps: TripModuleDependencies): TripController {
  const tripNumberService = new TripNumberService(deps.tripNumberSequenceRepository);

  return new TripController(
    new ListTripsUseCase(deps.tripRepository),
    new GetTripDashboardUseCase(deps.tripRepository),
    new CreateTripUseCase(
      deps.tripRepository,
      tripNumberService,
      deps.vehicleRepository,
      deps.employeeRepository,
    ),
    new GetTripUseCase(deps.tripRepository, deps.userRepository),
    new GetTripHistoryUseCase(deps.tripRepository, deps.userRepository),
    new ListTripTransactionsUseCase(
      deps.tripRepository,
      deps.transactionRepository,
      deps.userRepository,
    ),
  );
}
