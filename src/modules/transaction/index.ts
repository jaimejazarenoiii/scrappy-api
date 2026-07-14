import type { CompanyRepository } from '../company/domain/company.repository.js';
import type { AttendanceSessionRepository } from '../attendance/domain/attendance-session.repository.js';
import type { BranchRepository } from '../branch/domain/branch.repository.js';
import type { EmployeeRepository } from '../employee/domain/employee.repository.js';
import type { UserRepository } from '../user/domain/user.repository.js';
import type { WarehouseRepository } from '../warehouse/domain/warehouse.repository.js';
import type { TripRepository } from '../trip/domain/trip.repository.js';
import type { TransactionRepository } from './domain/transaction.repository.js';
import type { TransactionItemRepository } from './domain/transaction-item.repository.js';
import type { TransactionAttachmentRepository } from './domain/transaction-attachment.repository.js';
import type { TransactionSuggestionRepository } from './domain/transaction-suggestion.repository.js';
import type { TransactionNumberSequenceRepository } from './domain/transaction-number-sequence.repository.js';
import type { FileStorage } from './infrastructure/file-storage/file-storage.interface.js';
import type { TripLoadValidationService } from '../trip/application/services/trip-load-validation.service.js';
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
import { GetTransactionAttachmentContentUseCase } from './application/use-cases/get-transaction-attachment-content.use-case.js';
import { GetMaterialSuggestionsUseCase } from './application/use-cases/get-material-suggestions.use-case.js';
import { GetPriceSuggestionsUseCase } from './application/use-cases/get-price-suggestions.use-case.js';
import { CancelTransactionUseCase } from './application/use-cases/cancel-transaction.use-case.js';
import { ArchiveTransactionUseCase } from './application/use-cases/archive-transaction.use-case.js';
import { FinishTransactionUseCase } from './application/use-cases/finish-transaction.use-case.js';
import { ReturnToDraftUseCase } from './application/use-cases/return-to-draft.use-case.js';
import { SettleTransactionUseCase } from './application/use-cases/settle-transaction.use-case.js';
import { ReopenTransactionUseCase } from './application/use-cases/reopen-transaction.use-case.js';
import { GetReceiptUseCase } from './application/use-cases/get-receipt.use-case.js';
import { GetTransactionByNumberUseCase } from './application/use-cases/get-transaction-by-number.use-case.js';
import { TransactionNumberService } from './application/services/transaction-number.service.js';
import { ReceiptAssemblerService } from './application/services/receipt-assembler.service.js';
import { TransactionController } from './presentation/transaction.controller.js';

export { createTransactionRoutes } from './presentation/transaction.routes.js';

export interface TransactionModuleDependencies {
  transactionRepository: TransactionRepository;
  transactionItemRepository: TransactionItemRepository;
  transactionAttachmentRepository: TransactionAttachmentRepository;
  transactionSuggestionRepository: TransactionSuggestionRepository;
  transactionNumberSequenceRepository: TransactionNumberSequenceRepository;
  companyRepository: CompanyRepository;
  fileStorage: FileStorage;
  userRepository: UserRepository;
  employeeRepository: EmployeeRepository;
  attendanceRepository: AttendanceSessionRepository;
  branchRepository: BranchRepository;
  warehouseRepository: WarehouseRepository;
  tripRepository: TripRepository;
  tripLoadValidationService?: TripLoadValidationService;
}

export function buildTransactionController(
  deps: TransactionModuleDependencies,
): TransactionController {
  const transactionNumberService = new TransactionNumberService(
    deps.transactionNumberSequenceRepository,
  );
  const receiptAssemblerService = new ReceiptAssemblerService(
    deps.companyRepository,
    deps.userRepository,
    deps.employeeRepository,
  );
  return new TransactionController(
    new CreateTransactionUseCase(
      deps.transactionRepository,
      deps.userRepository,
      deps.employeeRepository,
      deps.attendanceRepository,
      deps.branchRepository,
      deps.warehouseRepository,
      deps.tripRepository,
      transactionNumberService,
      deps.tripLoadValidationService,
    ),
    new GetTransactionUseCase(deps.transactionRepository, deps.userRepository),
    new GetTransactionByNumberUseCase(deps.transactionRepository, deps.userRepository),
    new UpdateTransactionUseCase(
      deps.transactionRepository,
      deps.userRepository,
      deps.employeeRepository,
      deps.branchRepository,
      deps.warehouseRepository,
      deps.tripRepository,
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
    new GetTransactionAttachmentContentUseCase(
      deps.transactionRepository,
      deps.transactionAttachmentRepository,
      deps.fileStorage,
      deps.userRepository,
    ),
    new GetMaterialSuggestionsUseCase(deps.transactionSuggestionRepository),
    new GetPriceSuggestionsUseCase(deps.transactionSuggestionRepository),
    new FinishTransactionUseCase(deps.transactionRepository, deps.userRepository),
    new ReturnToDraftUseCase(deps.transactionRepository),
    new SettleTransactionUseCase(deps.transactionRepository),
    new CancelTransactionUseCase(deps.transactionRepository, deps.userRepository),
    new ReopenTransactionUseCase(deps.transactionRepository),
    new GetReceiptUseCase(deps.transactionRepository, deps.userRepository, receiptAssemblerService),
    new ArchiveTransactionUseCase(deps.transactionRepository),
  );
}
