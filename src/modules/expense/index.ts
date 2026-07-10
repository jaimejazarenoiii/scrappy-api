import type { AttendanceSessionRepository } from '../attendance/domain/attendance-session.repository.js';
import type { BranchRepository } from '../branch/domain/branch.repository.js';
import type { UserRepository } from '../user/domain/user.repository.js';
import type { WarehouseRepository } from '../warehouse/domain/warehouse.repository.js';
import type { VehicleRepository } from '../vehicle/domain/vehicle.repository.js';
import type { TripRepository } from '../trip/domain/trip.repository.js';
import type { ExpenseRepository } from './domain/expense.repository.js';
import type { ExpenseCategoryRepository } from './domain/expense-category.repository.js';
import type { ExpenseAttachmentRepository } from './domain/expense-attachment.repository.js';
import type { ExpenseNumberSequenceRepository } from './domain/expense-number-sequence.repository.js';
import type { ExpenseFileStorage } from './infrastructure/file-storage/expense-file-storage.js';
import { CreateExpenseUseCase } from './application/use-cases/create-expense.use-case.js';
import { UpdateExpenseUseCase } from './application/use-cases/update-expense.use-case.js';
import { GetExpenseUseCase } from './application/use-cases/get-expense.use-case.js';
import { GetExpenseByNumberUseCase } from './application/use-cases/get-expense-by-number.use-case.js';
import { ListExpensesUseCase } from './application/use-cases/list-expenses.use-case.js';
import { ListMyExpensesUseCase } from './application/use-cases/list-my-expenses.use-case.js';
import { RecordExpenseUseCase } from './application/use-cases/record-expense.use-case.js';
import { CancelExpenseUseCase } from './application/use-cases/cancel-expense.use-case.js';
import { ArchiveExpenseUseCase } from './application/use-cases/archive-expense.use-case.js';
import { AddExpenseAttachmentUseCase } from './application/use-cases/add-expense-attachment.use-case.js';
import { ListExpenseAttachmentsUseCase } from './application/use-cases/list-expense-attachments.use-case.js';
import { RemoveExpenseAttachmentUseCase } from './application/use-cases/remove-expense-attachment.use-case.js';
import { GetExpenseAttachmentContentUseCase } from './application/use-cases/get-expense-attachment-content.use-case.js';
import { ListExpenseCategoriesUseCase } from './application/use-cases/list-expense-categories.use-case.js';
import { ExpenseNumberService } from './application/services/expense-number.service.js';
import { ExpenseContextValidationService } from './application/services/expense-context-validation.service.js';
import { ExpenseController } from './presentation/expense.controller.js';

export { createExpenseRoutes } from './presentation/expense.routes.js';

export interface ExpenseModuleDependencies {
  expenseRepository: ExpenseRepository;
  expenseCategoryRepository: ExpenseCategoryRepository;
  expenseAttachmentRepository: ExpenseAttachmentRepository;
  expenseNumberSequenceRepository: ExpenseNumberSequenceRepository;
  expenseFileStorage: ExpenseFileStorage;
  userRepository: UserRepository;
  attendanceRepository: AttendanceSessionRepository;
  branchRepository: BranchRepository;
  warehouseRepository: WarehouseRepository;
  vehicleRepository: VehicleRepository;
  tripRepository: TripRepository;
}

export function buildExpenseController(deps: ExpenseModuleDependencies): ExpenseController {
  const expenseNumberService = new ExpenseNumberService(deps.expenseNumberSequenceRepository);
  const contextValidationService = new ExpenseContextValidationService(
    deps.branchRepository,
    deps.warehouseRepository,
    deps.vehicleRepository,
    deps.tripRepository,
  );

  return new ExpenseController(
    new CreateExpenseUseCase(
      deps.expenseRepository,
      deps.userRepository,
      deps.attendanceRepository,
      expenseNumberService,
      contextValidationService,
    ),
    new UpdateExpenseUseCase(deps.expenseRepository, deps.userRepository, contextValidationService),
    new GetExpenseUseCase(deps.expenseRepository, deps.userRepository),
    new GetExpenseByNumberUseCase(deps.expenseRepository, deps.userRepository),
    new ListExpensesUseCase(deps.expenseRepository),
    new ListMyExpensesUseCase(deps.expenseRepository, deps.userRepository),
    new RecordExpenseUseCase(deps.expenseRepository, deps.userRepository),
    new CancelExpenseUseCase(deps.expenseRepository, deps.userRepository),
    new ArchiveExpenseUseCase(deps.expenseRepository),
    new AddExpenseAttachmentUseCase(
      deps.expenseRepository,
      deps.expenseAttachmentRepository,
      deps.expenseFileStorage,
      deps.userRepository,
    ),
    new ListExpenseAttachmentsUseCase(
      deps.expenseRepository,
      deps.expenseAttachmentRepository,
      deps.userRepository,
    ),
    new RemoveExpenseAttachmentUseCase(
      deps.expenseRepository,
      deps.expenseAttachmentRepository,
      deps.expenseFileStorage,
      deps.userRepository,
    ),
    new GetExpenseAttachmentContentUseCase(
      deps.expenseRepository,
      deps.expenseAttachmentRepository,
      deps.expenseFileStorage,
      deps.userRepository,
    ),
    new ListExpenseCategoriesUseCase(deps.expenseCategoryRepository, deps.expenseRepository),
  );
}
