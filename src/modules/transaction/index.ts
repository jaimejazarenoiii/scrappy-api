import type { AttendanceSessionRepository } from '../attendance/domain/attendance-session.repository.js';
import type { BranchRepository } from '../branch/domain/branch.repository.js';
import type { EmployeeRepository } from '../employee/domain/employee.repository.js';
import type { UserRepository } from '../user/domain/user.repository.js';
import type { WarehouseRepository } from '../warehouse/domain/warehouse.repository.js';
import type { TransactionRepository } from './domain/transaction.repository.js';
import type { TransactionItemRepository } from './domain/transaction-item.repository.js';
import type { TransactionAttachmentRepository } from './domain/transaction-attachment.repository.js';
import type { TransactionSuggestionRepository } from './domain/transaction-suggestion.repository.js';
import type { FileStorage } from './infrastructure/file-storage/file-storage.interface.js';
import { CreateTransactionUseCase } from './application/use-cases/create-transaction.use-case.js';
import { GetTransactionUseCase } from './application/use-cases/get-transaction.use-case.js';
import { UpdateTransactionUseCase } from './application/use-cases/update-transaction.use-case.js';
import { ListTransactionsUseCase } from './application/use-cases/list-transactions.use-case.js';
import { ListAssignedTransactionsUseCase } from './application/use-cases/list-assigned-transactions.use-case.js';
import { AddTransactionItemUseCase } from './application/use-cases/add-transaction-item.use-case.js';
import { UpdateTransactionItemUseCase } from './application/use-cases/update-transaction-item.use-case.js';
import { RemoveTransactionItemUseCase } from './application/use-cases/remove-transaction-item.use-case.js';
import { ListTransactionItemsUseCase } from './application/use-cases/list-transaction-items.use-case.js';
import { AddTransactionAttachmentUseCase } from './application/use-cases/add-transaction-attachment.use-case.js';
import { ListTransactionAttachmentsUseCase } from './application/use-cases/list-transaction-attachments.use-case.js';
import { RemoveTransactionAttachmentUseCase } from './application/use-cases/remove-transaction-attachment.use-case.js';
import { GetMaterialSuggestionsUseCase } from './application/use-cases/get-material-suggestions.use-case.js';
import { GetPriceSuggestionsUseCase } from './application/use-cases/get-price-suggestions.use-case.js';
import { CancelTransactionUseCase } from './application/use-cases/cancel-transaction.use-case.js';
import { ArchiveTransactionUseCase } from './application/use-cases/archive-transaction.use-case.js';
import { TransactionController } from './presentation/transaction.controller.js';

export { createTransactionRoutes } from './presentation/transaction.routes.js';

export interface TransactionModuleDependencies {
  transactionRepository: TransactionRepository;
  transactionItemRepository: TransactionItemRepository;
  transactionAttachmentRepository: TransactionAttachmentRepository;
  transactionSuggestionRepository: TransactionSuggestionRepository;
  fileStorage: FileStorage;
  userRepository: UserRepository;
  employeeRepository: EmployeeRepository;
  attendanceRepository: AttendanceSessionRepository;
  branchRepository: BranchRepository;
  warehouseRepository: WarehouseRepository;
}

export function buildTransactionController(
  deps: TransactionModuleDependencies,
): TransactionController {
  return new TransactionController(
    new CreateTransactionUseCase(
      deps.transactionRepository,
      deps.userRepository,
      deps.employeeRepository,
      deps.attendanceRepository,
      deps.branchRepository,
      deps.warehouseRepository,
    ),
    new GetTransactionUseCase(deps.transactionRepository, deps.userRepository),
    new UpdateTransactionUseCase(
      deps.transactionRepository,
      deps.userRepository,
      deps.employeeRepository,
      deps.branchRepository,
      deps.warehouseRepository,
    ),
    new ListTransactionsUseCase(deps.transactionRepository),
    new ListAssignedTransactionsUseCase(deps.transactionRepository, deps.userRepository),
    new AddTransactionItemUseCase(
      deps.transactionRepository,
      deps.transactionItemRepository,
      deps.userRepository,
    ),
    new UpdateTransactionItemUseCase(
      deps.transactionRepository,
      deps.transactionItemRepository,
      deps.userRepository,
    ),
    new RemoveTransactionItemUseCase(
      deps.transactionRepository,
      deps.transactionItemRepository,
      deps.userRepository,
    ),
    new ListTransactionItemsUseCase(
      deps.transactionRepository,
      deps.transactionItemRepository,
      deps.userRepository,
    ),
    new AddTransactionAttachmentUseCase(
      deps.transactionRepository,
      deps.transactionAttachmentRepository,
      deps.fileStorage,
      deps.userRepository,
    ),
    new ListTransactionAttachmentsUseCase(
      deps.transactionRepository,
      deps.transactionAttachmentRepository,
      deps.userRepository,
    ),
    new RemoveTransactionAttachmentUseCase(
      deps.transactionRepository,
      deps.transactionAttachmentRepository,
      deps.fileStorage,
      deps.userRepository,
    ),
    new GetMaterialSuggestionsUseCase(deps.transactionSuggestionRepository),
    new GetPriceSuggestionsUseCase(deps.transactionSuggestionRepository),
    new CancelTransactionUseCase(deps.transactionRepository, deps.userRepository),
    new ArchiveTransactionUseCase(deps.transactionRepository),
  );
}
