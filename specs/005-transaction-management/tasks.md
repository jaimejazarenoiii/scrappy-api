---
description: 'Task list for Transaction Management (Foundation) feature'
---

# Tasks: P004 - Transaction Management (Foundation)

**Input**: Design documents from `/specs/005-transaction-management/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md; P001 (Company & Identity Foundation), P002 (Organization Management), and P003 (Workforce Management) implemented and passing

**Tests**: Included — the specification and plan require unit, integration, and API tests for transaction creation, draft editing/auto-save, listing/search/filter, items, photo attachments, suggestions, cancel/archive, authorization, validation, and tenant isolation.

**Organization**: Tasks are grouped by user story after P004 setup and foundational phases. Because `Transaction` is a single aggregate module, the foundational phase builds the aggregate root, repositories, and file storage that all stories depend on; each story then delivers an independently testable slice.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: `US1` = Create Draft, `US2` = Draft Edit/Auto-Save, `US3` = List/Search/Filter, `US4` = Items, `US5` = Photos, `US6` = Suggestions, `US7` = Cancel/Archive

## Path Conventions

P004 extends P001/P002/P003 modular Clean Architecture:

- **Module**: `src/modules/transaction/{domain,application,infrastructure,presentation}/`
- **Shared**: `src/shared/transactions/` (new), plus existing `src/shared/{workforce,tenant,policy,errors,http,pagination,audit}/`
- **Config**: `src/config/container.ts`, `src/modules/index.ts`
- **Middleware**: `src/middleware/` (reuse P001 auth, tenant, validation, authorization)
- **Validations**: `src/validations/`
- **Swagger**: `src/swagger/`
- **Tests**: `tests/unit/`, `tests/integration/`, `tests/api/`, `tests/factories/`, `tests/setup/`
- **Schema**: `prisma/schema.prisma`
- **Uploads**: `uploads/` (gitignored local attachment storage)

---

## Phase 1: Setup (P004 Module Structure)

**Purpose**: Prepare module-oriented directory structure and test scaffolding for Transaction Management without modifying P001/P002/P003 behavior.

- [x] T001 Create Clean Architecture subfolders for the transaction module in `src/modules/transaction/{domain,application,infrastructure,presentation}` with `application/{dto,use-cases,policies,services}` and `infrastructure/{mappers,file-storage}`, plus `src/shared/transactions/`
- [x] T002 [P] Create transaction test directories `tests/unit/transaction/`, `tests/integration/transaction/`, and `tests/api/transaction/`
- [x] T003 [P] Create transaction module index placeholder file in `src/modules/transaction/index.ts`
- [x] T004 [P] Add `uploads/` to `.gitignore` and document local attachment storage path referencing `specs/005-transaction-management/data-model.md` in `src/database/README.md`
- [x] T005 Install `multer` and `@types/multer` dependencies for multipart photo uploads in `package.json`

**Checkpoint**: Source tree supports the transaction aggregate module and matching test layout.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish Prisma models, the Transaction aggregate root domain, repositories, shared services, file storage, reusable validators, test factories, and in-memory repository support that all user stories depend on.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [x] T006 Add `TransactionDirection`, `TransactionStatus`, `TransactionLocationType`, `TransactionAttachmentType`, and `TransactionItemUnit` enums plus `Transaction`, `TransactionItem`, `TransactionAttachment`, and `TransactionEmployeeAssignment` models with Company, User, Branch, Warehouse, and Employee relations in `prisma/schema.prisma` per `data-model.md`
- [x] T007 Add reverse relations (`transactions`) to `Company`, `Branch`, `Warehouse`, and `Employee` models in `prisma/schema.prisma`
- [x] T008 Create Prisma migration for transaction resources with indexes `(companyId, status, deletedAt)`, `(companyId, transactionDate)`, `(companyId, direction, status)`, and the `(transactionId, employeeId)` composite key in `prisma/migrations/`
- [x] T009 [P] Create direction mapper (`toCanonicalDirection`, `toDirectionLabel` for BUY/SELL ↔ INBOUND/OUTBOUND) in `src/shared/transactions/direction-mapper.ts`
- [x] T010 [P] Create item total helper (`computeItemTotal(weight, price)` rounding to 2 dp) in `src/shared/transactions/item-total.ts`
- [x] T011 [P] Create transaction enums (`transaction-direction.ts`, `transaction-status.ts`, `transaction-location-type.ts`, `transaction-item-unit.ts`, `transaction-attachment-type.ts`) in `src/modules/transaction/domain/`
- [x] T012 Create `Transaction` aggregate root domain entity with `toPrimitives()`, `isDraft()`, `isCancelled()`, `isArchived()`, and location helpers in `src/modules/transaction/domain/transaction.entity.ts`
- [x] T013 [P] Create `TransactionItem` and `TransactionAttachment` child entities with `toPrimitives()` in `src/modules/transaction/domain/transaction-item.entity.ts` and `src/modules/transaction/domain/transaction-attachment.entity.ts`
- [x] T014 Create transaction business rules (`assertDraftEditable`, `assertNotArchived`, `assertLocationFields`, `assertOperationallyReady`, `assertItemTotal`) in `src/modules/transaction/domain/transaction-rules.ts`
- [x] T015 [P] Create repository interfaces `transaction.repository.ts`, `transaction-item.repository.ts`, and `transaction-attachment.repository.ts` (with tenant-scoped list, assignment filter, and suggestion query signatures) in `src/modules/transaction/domain/`
- [x] T016 [P] Create `FileStorage` interface (`save`, `delete`, `resolvePath`) in `src/modules/transaction/infrastructure/file-storage/file-storage.interface.ts`
- [x] T017 [P] Implement `LocalFileStorage` writing under `{UPLOAD_DIR}/transactions/{companyId}/{transactionId}/` in `src/modules/transaction/infrastructure/file-storage/local-file-storage.ts`
- [x] T018 [P] Create transaction authorization policy (`assertEmployeeAssigned`, `canViewTransaction`, `canManageDraft`, `canListCompany`) in `src/modules/transaction/application/policies/transaction-authorization.policy.ts`
- [x] T019 [P] Create transaction audit service (create, update, cancel, archive, item, attachment events) in `src/modules/transaction/application/services/transaction-audit.service.ts`
- [x] T020 [P] Create Prisma-to-domain mappers in `src/modules/transaction/infrastructure/mappers/transaction.mapper.ts`, `transaction-item.mapper.ts`, and `transaction-attachment.mapper.ts`
- [x] T021 Implement Prisma `TransactionRepository` with tenant-scoped queries, assignment join handling, archive filter, and detail aggregation in `src/modules/transaction/infrastructure/transaction.prisma-repository.ts`
- [x] T022 [P] Implement Prisma `TransactionItemRepository` and `TransactionAttachmentRepository` in `src/modules/transaction/infrastructure/transaction-item.prisma-repository.ts` and `src/modules/transaction/infrastructure/transaction-attachment.prisma-repository.ts`
- [x] T023 [P] Implement Prisma `TransactionSuggestionRepository` (material names, prices from Company history) in `src/modules/transaction/infrastructure/transaction-suggestion.prisma-repository.ts`
- [x] T024 [P] Create transaction Zod schemas (create, update discriminated by location type, cancel, item create/update, list/assigned query, suggestion query) in `src/modules/transaction/presentation/transaction.schemas.ts`
- [x] T025 [P] Configure multer upload middleware (memory storage, 5 MB limit, image MIME allowlist) in `src/modules/transaction/presentation/upload.middleware.ts`
- [x] T026 [P] Create transaction test factory (`buildTransaction`, `buildTransactionItem`, `buildTransactionAttachment`, `buildAssignment`) in `tests/factories/transaction.factory.ts`
- [x] T027 Add `InMemoryTransactionRepository`, `InMemoryTransactionItemRepository`, `InMemoryTransactionAttachmentRepository`, and `InMemoryTransactionSuggestionRepository` to `tests/setup/in-memory-repositories.ts`
- [x] T028 Register transaction in-memory repositories, a stub `FileStorage`, and empty transaction router in `tests/setup/test-app.ts` and `src/modules/index.ts` to verify wiring before story implementation

**Checkpoint**: Database schema, aggregate domain, repositories, file storage, validators, factories, and test scaffolding are ready for story-level implementation.

---

## Phase 3: User Story 1 - Employee Creates a Draft Transaction (Priority: P1) 🎯 MVP

**Goal**: Allow a timed-in Employee to create a Draft transaction with header fields, multiple assigned Employees, location context, and at least one item, scoped to their Company.

**Independent Test**: A timed-in Employee creates a Draft transaction with header and one item; it is retrievable with items and assignments. A not-timed-in Employee is rejected.

### Tests for User Story 1

- [x] T029 [P] [US1] Create unit tests for Transaction entity creation and direction mapping in `tests/unit/transaction/transaction.entity.test.ts`
- [x] T030 [P] [US1] Create unit tests for transaction rules (operational readiness, location field requirements, item total) in `tests/unit/transaction/transaction-rules.test.ts`
- [x] T031 [P] [US1] Create unit tests for `CreateTransactionUseCase` with readiness gate, assignment validation, and location validation using in-memory repositories in `tests/unit/transaction/create-transaction.use-case.test.ts`
- [x] T032 [P] [US1] Create repository integration tests for Transaction create with items and assignments plus tenant scoping in `tests/integration/transaction/transaction-create.persistence.test.ts`
- [x] T033 [P] [US1] Create API tests for `POST /api/v1/transactions` success, not-timed-in rejection, and invalid location in `tests/api/transaction/transaction-create.api.test.ts`

### Implementation for User Story 1

- [x] T034 [P] [US1] Create create-transaction request DTO and transaction detail/summary response DTOs in `src/modules/transaction/application/dto/create-transaction.request.ts`, `src/modules/transaction/application/dto/transaction.response.ts`, and `src/modules/transaction/application/dto/transaction-detail.response.ts`
- [x] T035 [US1] Implement `CreateTransactionUseCase` (resolve acting employee, operational readiness gate, location/branch/warehouse validation, assignment validation, initial items, audit emit) in `src/modules/transaction/application/use-cases/create-transaction.use-case.ts`
- [x] T036 [US1] Implement `GetTransactionUseCase` returning aggregate detail with items, attachments, and assignments in `src/modules/transaction/application/use-cases/get-transaction.use-case.ts`
- [x] T037 [US1] Implement transaction controller `create` and `getById` handlers in `src/modules/transaction/presentation/transaction.controller.ts`
- [x] T038 [US1] Register `POST /api/v1/transactions` and `GET /api/v1/transactions/{transactionId}` routes with auth, tenant, validation, and role guards in `src/modules/transaction/presentation/transaction.routes.ts`
- [x] T039 [US1] Register transaction module DI bindings (repositories, file storage, use cases, controller) and route wiring in `src/modules/transaction/index.ts`, `src/config/container.ts`, and `src/modules/index.ts`
- [x] T040 [US1] Add Transactions tag, aggregate schemas, and create/detail route definitions to Swagger in `src/modules/transaction/presentation/transaction.openapi.ts` and `src/swagger/openapi.builder.ts`

**Checkpoint**: Timed-in Employees can create Draft transactions with items and assignments and retrieve them; readiness and location rules enforced.

---

## Phase 4: User Story 2 - Draft Editing and Auto-Save (Priority: P2)

**Goal**: Allow assigned Employees and Managers/Owners to update Draft transactions (including client-driven auto-save PATCH) while blocking edits to Cancelled transactions.

**Independent Test**: A Draft transaction is updated via PATCH; changes persist with status still Draft. A Cancelled transaction rejects edits.

### Tests for User Story 2

- [x] T041 [P] [US2] Create unit tests for `UpdateTransactionUseCase` partial updates, assignment authorization, and draft-only enforcement in `tests/unit/transaction/update-transaction.use-case.test.ts`
- [x] T042 [P] [US2] Create API tests for `PATCH /api/v1/transactions/{transactionId}` partial/auto-save updates and cancelled-edit rejection in `tests/api/transaction/transaction-update.api.test.ts`
- [x] T043 [P] [US2] Create API tests for assigned-Employee edit allowed vs unassigned-Employee 403 and Manager company-draft edit in `tests/api/transaction/transaction-edit-authorization.api.test.ts`

### Implementation for User Story 2

- [x] T044 [P] [US2] Create update-transaction request DTO in `src/modules/transaction/application/dto/update-transaction.request.ts`
- [x] T045 [US2] Implement `UpdateTransactionUseCase` (draft/archive assertion, assignment authorization, location revalidation, assignment replacement, audit emit) in `src/modules/transaction/application/use-cases/update-transaction.use-case.ts`
- [x] T046 [US2] Implement controller `update` handler in `src/modules/transaction/presentation/transaction.controller.ts`
- [x] T047 [US2] Register `PATCH /api/v1/transactions/{transactionId}` route with validation and guards in `src/modules/transaction/presentation/transaction.routes.ts`
- [x] T048 [US2] Wire update use case DI in `src/modules/transaction/index.ts` and `src/config/container.ts`
- [x] T049 [US2] Add update route definition and `UpdateTransactionRequest` schema to Swagger in `src/modules/transaction/presentation/transaction.openapi.ts`

**Checkpoint**: Draft transactions are editable via PATCH (including auto-save) with assignment authorization; cancelled transactions reject edits.

---

## Phase 5: User Story 3 - View, List, Search, and Filter Transactions (Priority: P3)

**Goal**: Allow Employees to list transactions assigned to them and Managers/Owners to list all Company transactions with search, filters, sorting, and pagination.

**Independent Test**: An Employee retrieves only assigned transactions; a Manager lists Company transactions filtered by direction, status, location, and date range; Employee is forbidden from the company list.

### Tests for User Story 3

- [x] T050 [P] [US3] Create unit tests for `ListTransactionsUseCase` and `ListAssignedTransactionsUseCase` filter/scope logic in `tests/unit/transaction/list-transactions.use-cases.test.ts`
- [x] T051 [P] [US3] Create repository integration tests for list filters (direction, status, locationType, date range, search, includeArchived) and assignment scoping in `tests/integration/transaction/transaction-list.persistence.test.ts`
- [x] T052 [P] [US3] Create API tests for `GET /api/v1/transactions` company list with filters/pagination and Employee 403 in `tests/api/transaction/transaction-list.api.test.ts`
- [x] T053 [P] [US3] Create API tests for `GET /api/v1/transactions/assigned` employee-scoped list in `tests/api/transaction/transaction-assigned.api.test.ts`

### Implementation for User Story 3

- [x] T054 [P] [US3] Extend list query schemas (filters, sort allowlist, includeArchived) in `src/modules/transaction/presentation/transaction.schemas.ts` and add transaction list filters to `src/validations/common-query.schemas.ts`
- [x] T055 [US3] Implement `ListTransactionsUseCase` (company-scoped, filters, search, pagination) in `src/modules/transaction/application/use-cases/list-transactions.use-case.ts`
- [x] T056 [US3] Implement `ListAssignedTransactionsUseCase` (resolve acting employee, assignment-scoped list) in `src/modules/transaction/application/use-cases/list-assigned-transactions.use-case.ts`
- [x] T057 [US3] Implement controller `list` and `listAssigned` handlers in `src/modules/transaction/presentation/transaction.controller.ts`
- [x] T058 [US3] Register `GET /api/v1/transactions` and `GET /api/v1/transactions/assigned` routes (assigned before `/:transactionId`) with role guards in `src/modules/transaction/presentation/transaction.routes.ts`
- [x] T059 [US3] Wire list use cases DI in `src/modules/transaction/index.ts` and `src/config/container.ts`
- [x] T060 [US3] Add list and assigned route definitions with query parameters to Swagger in `src/modules/transaction/presentation/transaction.openapi.ts`

**Checkpoint**: Company and assigned transaction lists work with filters, search, sorting, pagination, and role scoping.

---

## Phase 6: User Story 4 - Transaction Items Management (Priority: P4)

**Goal**: Allow authorized users to add, update, remove, and list unlimited items on a Draft transaction with server-computed totals.

**Independent Test**: Items are added, updated, and removed on a Draft transaction; totals reflect weight × price; cancelled transactions reject item mutations.

### Tests for User Story 4

- [x] T061 [P] [US4] Create unit tests for item use cases (total computation, draft-only enforcement) in `tests/unit/transaction/transaction-item.use-cases.test.ts`
- [x] T062 [P] [US4] Create repository integration tests for TransactionItem CRUD and parent scoping in `tests/integration/transaction/transaction-item.persistence.test.ts`
- [x] T063 [P] [US4] Create API tests for item add, update, remove, list, and cancelled-transaction rejection in `tests/api/transaction/transaction-item.api.test.ts`

### Implementation for User Story 4

- [x] T064 [P] [US4] Create item request/response DTOs in `src/modules/transaction/application/dto/transaction-item.request.ts` and `src/modules/transaction/application/dto/transaction-item.response.ts`
- [x] T065 [US4] Implement `AddTransactionItemUseCase` and `UpdateTransactionItemUseCase` with total computation and draft assertion in `src/modules/transaction/application/use-cases/add-transaction-item.use-case.ts` and `src/modules/transaction/application/use-cases/update-transaction-item.use-case.ts`
- [x] T066 [US4] Implement `RemoveTransactionItemUseCase` and `ListTransactionItemsUseCase` in `src/modules/transaction/application/use-cases/remove-transaction-item.use-case.ts` and `src/modules/transaction/application/use-cases/list-transaction-items.use-case.ts`
- [x] T067 [US4] Implement controller item handlers in `src/modules/transaction/presentation/transaction.controller.ts`
- [x] T068 [US4] Register item routes (`GET`/`POST` `/items`, `PATCH`/`DELETE` `/items/{itemId}`) with validation and guards in `src/modules/transaction/presentation/transaction.routes.ts`
- [x] T069 [US4] Wire item use cases DI in `src/modules/transaction/index.ts` and `src/config/container.ts`
- [x] T070 [US4] Add Transaction Items tag, item schemas, and route definitions to Swagger in `src/modules/transaction/presentation/transaction.openapi.ts`

**Checkpoint**: Item add/update/remove/list works on Draft transactions with server-computed totals and lifecycle enforcement.

---

## Phase 7: User Story 5 - Transaction Photos (Priority: P5)

**Goal**: Allow authorized users to upload, list, and remove multiple photo attachments on a Draft transaction with file validation and storage.

**Independent Test**: Multiple photos are uploaded, listed, and removed on a Draft transaction; oversized/invalid files rejected; attachments cannot exist without a parent transaction.

### Tests for User Story 5

- [x] T071 [P] [US5] Create unit tests for attachment use cases (max-photo rule, draft-only enforcement) in `tests/unit/transaction/transaction-attachment.use-cases.test.ts`
- [x] T072 [P] [US5] Create integration tests for `LocalFileStorage` save/delete and attachment persistence in `tests/integration/transaction/transaction-attachment.persistence.test.ts`
- [x] T073 [P] [US5] Create API tests for photo upload (multipart), list, remove, oversized/invalid MIME rejection, and cancelled-transaction rejection in `tests/api/transaction/transaction-attachment.api.test.ts`

### Implementation for User Story 5

- [x] T074 [P] [US5] Create attachment response DTO in `src/modules/transaction/application/dto/transaction-attachment.response.ts`
- [x] T075 [US5] Implement `AddTransactionAttachmentUseCase` (draft assertion, max-20-photo rule, file storage save, metadata persist, audit emit) in `src/modules/transaction/application/use-cases/add-transaction-attachment.use-case.ts`
- [x] T076 [US5] Implement `ListTransactionAttachmentsUseCase` and `RemoveTransactionAttachmentUseCase` (file storage delete) in `src/modules/transaction/application/use-cases/list-transaction-attachments.use-case.ts` and `src/modules/transaction/application/use-cases/remove-transaction-attachment.use-case.ts`
- [x] T077 [US5] Implement controller attachment handlers using upload middleware in `src/modules/transaction/presentation/transaction.controller.ts`
- [x] T078 [US5] Register attachment routes (`GET`/`POST` `/attachments`, `DELETE` `/attachments/{attachmentId}`) with multer and guards in `src/modules/transaction/presentation/transaction.routes.ts`
- [x] T079 [US5] Wire attachment use cases and `FileStorage` DI in `src/modules/transaction/index.ts` and `src/config/container.ts`
- [x] T080 [US5] Add Transaction Attachments tag, multipart request body, and route definitions to Swagger in `src/modules/transaction/presentation/transaction.openapi.ts`

**Checkpoint**: Photo upload/list/remove works on Draft transactions with file validation and storage cleanup.

---

## Phase 8: User Story 6 - Material and Price Suggestions (Priority: P6)

**Goal**: Provide material name and price suggestions from Company transaction history while allowing free-form entry.

**Independent Test**: Material suggestions return prior Company material names matching a prefix; price suggestions return prior prices for a material; new values remain acceptable on save.

### Tests for User Story 6

- [x] T081 [P] [US6] Create unit tests for suggestion use cases (company scoping, ordering) in `tests/unit/transaction/transaction-suggestions.use-cases.test.ts`
- [x] T082 [P] [US6] Create repository integration tests for material/price suggestion queries excluding archived transactions in `tests/integration/transaction/transaction-suggestions.persistence.test.ts`
- [x] T083 [P] [US6] Create API tests for `GET /api/v1/transactions/suggestions/materials` and `GET /api/v1/transactions/suggestions/prices` in `tests/api/transaction/transaction-suggestions.api.test.ts`

### Implementation for User Story 6

- [x] T084 [P] [US6] Create suggestion response DTOs in `src/modules/transaction/application/dto/suggestion.response.ts`
- [x] T085 [US6] Implement `GetMaterialSuggestionsUseCase` and `GetPriceSuggestionsUseCase` (company-scoped, non-archived) in `src/modules/transaction/application/use-cases/get-material-suggestions.use-case.ts` and `src/modules/transaction/application/use-cases/get-price-suggestions.use-case.ts`
- [x] T086 [US6] Implement controller suggestion handlers in `src/modules/transaction/presentation/transaction.controller.ts`
- [x] T087 [US6] Register suggestion routes (mounted before `/:transactionId`) with validation in `src/modules/transaction/presentation/transaction.routes.ts`
- [x] T088 [US6] Wire suggestion use cases DI in `src/modules/transaction/index.ts` and `src/config/container.ts`
- [x] T089 [US6] Add Transaction Suggestions tag, suggestion schemas, and route definitions to Swagger in `src/modules/transaction/presentation/transaction.openapi.ts`

**Checkpoint**: Material and price suggestions return Company-scoped history and support free-form entry.

---

## Phase 9: User Story 7 - Cancel and Archive Transactions (Priority: P7)

**Goal**: Allow authorized users to cancel Draft transactions (making them read-only) and Managers/Owners to archive transactions (excluding them from default lists while retaining history).

**Independent Test**: A Draft transaction is cancelled and becomes read-only; a transaction is archived and excluded from default lists but retrievable via includeArchived.

### Tests for User Story 7

- [x] T090 [P] [US7] Create unit tests for `CancelTransactionUseCase` and `ArchiveTransactionUseCase` lifecycle transitions in `tests/unit/transaction/cancel-archive.use-cases.test.ts`
- [x] T091 [P] [US7] Create API tests for `POST /api/v1/transactions/{id}/cancel` immutability and `POST /api/v1/transactions/{id}/archive` list exclusion in `tests/api/transaction/transaction-cancel-archive.api.test.ts`

### Implementation for User Story 7

- [x] T092 [P] [US7] Create cancel request DTO in `src/modules/transaction/application/dto/cancel-transaction.request.ts`
- [x] T093 [US7] Implement `CancelTransactionUseCase` (draft assertion, set status/cancelledAt/reason, audit emit) in `src/modules/transaction/application/use-cases/cancel-transaction.use-case.ts`
- [x] T094 [US7] Implement `ArchiveTransactionUseCase` (soft delete, already-archived rejection, audit emit) in `src/modules/transaction/application/use-cases/archive-transaction.use-case.ts`
- [x] T095 [US7] Implement controller `cancel` and `archive` handlers in `src/modules/transaction/presentation/transaction.controller.ts`
- [x] T096 [US7] Register `/cancel` and `/archive` routes with role guards in `src/modules/transaction/presentation/transaction.routes.ts`
- [x] T097 [US7] Wire cancel/archive use cases DI in `src/modules/transaction/index.ts` and `src/config/container.ts`
- [x] T098 [US7] Add cancel/archive route definitions and `CancelTransactionRequest` schema to Swagger in `src/modules/transaction/presentation/transaction.openapi.ts`

**Checkpoint**: Cancel enforces immutability; archive excludes transactions from default lists while preserving retrievable history.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Cross-story validation, isolation coverage, and documentation.

- [x] T099 [P] Create cross-company tenant isolation API tests covering view, update, cancel, archive, items, and attachments in `tests/api/transaction/transaction-tenant-isolation.api.test.ts`
- [x] T100 [P] Add error-scenario API tests (validation failures, total mismatch, invalid location, max photos) in `tests/api/transaction/transaction-errors.api.test.ts`
- [x] T101 Verify OpenAPI builder aggregates transaction paths and schemas without conflicts in `src/swagger/openapi.builder.ts`
- [x] T102 Run `pnpm run build`, `pnpm test`, and `pnpm run lint`; fix any failures
- [x] T103 Execute `specs/005-transaction-management/quickstart.md` validation scenarios end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3–9)**: All depend on Foundational phase completion
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational - No dependency on other stories (MVP)
- **US2 (P2)**: Depends on US1 (create + get) for meaningful edits; independently testable via seeded drafts
- **US3 (P3)**: Depends on Foundational; benefits from US1 data but independently testable via seeded records
- **US4 (P4)**: Depends on US1 (draft exists); item endpoints independent of US2/US3
- **US5 (P5)**: Depends on US1 (draft exists) and Foundational file storage
- **US6 (P6)**: Depends on Foundational suggestion repository; independent of US2–US5
- **US7 (P7)**: Depends on US1 (draft exists); cancel/archive independent of US2–US6

### Within Each User Story

- Tests written first and expected to FAIL before implementation
- Domain/DTO before use cases; use cases before controller/routes; wiring and Swagger last
- Story complete and independently testable before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- Foundational tasks T009–T027 marked [P] can run in parallel after schema/migration (T006–T008)
- Once Foundational completes, US4, US5, US6, and US7 slices can be developed in parallel by different developers (distinct use-case/DTO files) provided controller/route/Swagger merge tasks are coordinated
- All test tasks within a story marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit tests for Transaction entity in tests/unit/transaction/transaction.entity.test.ts"
Task: "Unit tests for transaction rules in tests/unit/transaction/transaction-rules.test.ts"
Task: "Unit tests for CreateTransactionUseCase in tests/unit/transaction/create-transaction.use-case.test.ts"
Task: "Integration tests in tests/integration/transaction/transaction-create.persistence.test.ts"
Task: "API tests in tests/api/transaction/transaction-create.api.test.ts"

# Launch domain/DTO tasks for User Story 1 together:
Task: "Create create-transaction request/response DTOs in src/modules/transaction/application/dto/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (create + view Draft transaction)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → aggregate foundation ready
2. US1 (create/view) → Test → Deploy/Demo (MVP!)
3. US2 (draft edit/auto-save) → Test → Deploy/Demo
4. US3 (list/search/filter) → Test → Deploy/Demo
5. US4 (items) → US5 (photos) → US6 (suggestions) → US7 (cancel/archive)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 → US2 (transaction core + edit)
   - Developer B: US3 (list/search/filter) + US6 (suggestions)
   - Developer C: US4 (items) + US5 (photos) + US7 (cancel/archive)
3. Coordinate shared-file merges (controller, routes, Swagger, container) at story checkpoints

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- `Transaction` is the aggregate root; item/attachment/assignment mutations always load and validate the parent
- Route ordering: mount `/suggestions/*` and `/assigned` before `/:transactionId` to avoid path capture
- Reuse P003 `isOperationallyReady()` and `resolveActingEmployeeId()`; do not duplicate readiness logic
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
