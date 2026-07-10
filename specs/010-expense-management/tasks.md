---
description: 'Task list for Expense Management (P007) feature'
---

# Tasks: P007 - Expense Management

**Input**: Design documents from `/specs/010-expense-management/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md; P001–P006 implemented and passing

**Tests**: Included — the specification and plan explicitly require unit, integration, API, workflow, authorization, validation, expense number, attachment, context, and concurrency coverage using Vitest and Supertest.

**Organization**: Tasks introduce a new `expense` module and targeted extensions to `reports`, `analytics`, Prisma schema, Swagger, docs, and test support. Foundational work blocks all stories. Each user story phase is independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: `US1` = Employee Records Expense, `US2` = Employee Finalizes Draft, `US3` = Manager Oversees Company Expenses, `US4` = Trip-Linked Field Expenses, `US5` = Search & Filter by Expense Number

## Path Conventions

P007 follows Scrappy API Clean Architecture:

- **Module**: `src/modules/expense/{domain,application,infrastructure,presentation}/`
- **Cross-module extensions**: `src/modules/reports/`, `src/modules/analytics/`, `src/modules/index.ts`, `src/config/container.ts`
- **Shared**: `src/shared/expenses/`
- **Swagger**: `src/swagger/common-schemas.ts`, `src/modules/expense/presentation/expense.openapi.ts`, `docs/api-reference.md`
- **Tests**: `tests/unit/expense/`, `tests/integration/expense/`, `tests/api/expense/`, `tests/setup/`
- **Schema**: `prisma/schema.prisma`

---

## Phase 1: Setup (Shared Scaffolding)

**Purpose**: Create the Expense module skeleton, shared helpers, and dedicated test areas.

- [x] T001 Create the Expense module directory structure and `src/modules/expense/index.ts`
- [x] T002 [P] Create Expense domain file placeholders in `src/modules/expense/domain/expense.entity.ts`, `src/modules/expense/domain/expense-attachment.entity.ts`, `src/modules/expense/domain/expense-status.ts`, `src/modules/expense/domain/expense-context-type.ts`, `src/modules/expense/domain/expense-attachment-type.ts`, `src/modules/expense/domain/expense-rules.ts`, `src/modules/expense/domain/expense-lifecycle.ts`, `src/modules/expense/domain/expense-number.ts`, `src/modules/expense/domain/expense.repository.ts`, `src/modules/expense/domain/expense-attachment.repository.ts`, and `src/modules/expense/domain/expense-number-sequence.repository.ts`
- [x] T003 [P] Create Expense application file placeholders in `src/modules/expense/application/dto/create-expense.request.ts`, `src/modules/expense/application/dto/update-expense.request.ts`, `src/modules/expense/application/dto/expense.response.ts`, `src/modules/expense/application/dto/expense-attachment.response.ts`, `src/modules/expense/application/policies/expense-authorization.policy.ts`, and `src/modules/expense/application/services/expense-number.service.ts`, `src/modules/expense/application/services/expense-audit.service.ts`, `src/modules/expense/application/services/expense-context-validation.service.ts`
- [x] T004 [P] Create Expense use-case placeholders in `src/modules/expense/application/use-cases/` for create, update, get, get-by-number, list, list-mine, record, cancel, archive, add-attachment, list-attachments, remove-attachment, and get-attachment-content
- [x] T005 [P] Create Expense infrastructure and presentation file placeholders in `src/modules/expense/infrastructure/expense.prisma-repository.ts`, `src/modules/expense/infrastructure/expense-attachment.prisma-repository.ts`, `src/modules/expense/infrastructure/expense-number-sequence.prisma-repository.ts`, `src/modules/expense/infrastructure/mappers/expense.mapper.ts`, `src/modules/expense/infrastructure/mappers/expense-attachment.mapper.ts`, `src/modules/expense/presentation/expense.controller.ts`, `src/modules/expense/presentation/expense.routes.ts`, `src/modules/expense/presentation/expense.schemas.ts`, `src/modules/expense/presentation/expense.openapi.ts`, and `src/modules/expense/presentation/upload.middleware.ts`
- [x] T006 [P] Create shared Expense helper placeholder in `src/shared/expenses/expense-number-format.ts`
- [x] T007 [P] Create Expense test directories and stub files under `tests/unit/expense/`, `tests/integration/expense/`, and `tests/api/expense/`

**Checkpoint**: Module scaffolding exists for implementation and testing.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add schema, repositories, domain rules, DI wiring, OpenAPI base support, and test infrastructure required by all user stories.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [x] T008 Add `ExpenseStatus`, `ExpenseContextType`, `ExpenseAttachmentType`, `Expense`, `ExpenseAttachment`, and `ExpenseNumberSequence` models plus Company/Branch/Warehouse/Vehicle/Trip relations in `prisma/schema.prisma`
- [x] T009 Create Prisma migration for Expense tables and expense number sequence in `prisma/migrations/`
- [x] T010 [P] Implement `ExpenseStatus`, `ExpenseContextType`, and `ExpenseAttachmentType` enums in `src/modules/expense/domain/expense-status.ts`, `src/modules/expense/domain/expense-context-type.ts`, and `src/modules/expense/domain/expense-attachment-type.ts`
- [x] T011 [P] Implement `ExpenseNumber` value object and parser/formatter helpers in `src/modules/expense/domain/expense-number.ts` and `src/shared/expenses/expense-number-format.ts`
- [x] T012 [P] Implement `ExpenseEntity` with status helpers and lifecycle assertions in `src/modules/expense/domain/expense.entity.ts`
- [x] T013 [P] Implement `ExpenseAttachmentEntity` in `src/modules/expense/domain/expense-attachment.entity.ts`
- [x] T014 Implement `expense-lifecycle.ts` transition matrix and lifecycle assertion helpers in `src/modules/expense/domain/expense-lifecycle.ts`
- [x] T015 Implement foundational expense business rules (amount, context mutual exclusion, editability) in `src/modules/expense/domain/expense-rules.ts`
- [x] T016 [P] Define `ExpenseRepository` query/update contract in `src/modules/expense/domain/expense.repository.ts`
- [x] T017 [P] Define `ExpenseAttachmentRepository` contract in `src/modules/expense/domain/expense-attachment.repository.ts`
- [x] T018 [P] Define `ExpenseNumberSequenceRepository.allocateNext(companyId, sequenceDate)` in `src/modules/expense/domain/expense-number-sequence.repository.ts`
- [x] T019 Implement `ExpenseNumberService` for atomic `EXP-YYYYMMDD-000001` generation in `src/modules/expense/application/services/expense-number.service.ts`
- [x] T020 [P] Implement `expense-audit.service.ts` event helpers for create/record/cancel/archive/attachment actions in `src/modules/expense/application/services/expense-audit.service.ts`
- [x] T021 [P] Implement `ExpenseContextValidationService` skeleton for org entity existence checks in `src/modules/expense/application/services/expense-context-validation.service.ts`
- [x] T022 [P] Implement `expense-authorization.policy.ts` for manager/owner mutating access and employee own-scope reads in `src/modules/expense/application/policies/expense-authorization.policy.ts`
- [x] T023 [P] Implement Prisma mappers in `src/modules/expense/infrastructure/mappers/expense.mapper.ts` and `src/modules/expense/infrastructure/mappers/expense-attachment.mapper.ts`
- [x] T024 Implement `ExpenseNumberSequencePrismaRepository` with atomic allocation in `src/modules/expense/infrastructure/expense-number-sequence.prisma-repository.ts`
- [x] T025 Implement `ExpensePrismaRepository` base CRUD/find/list skeleton in `src/modules/expense/infrastructure/expense.prisma-repository.ts`
- [x] T026 Implement `ExpenseAttachmentPrismaRepository` in `src/modules/expense/infrastructure/expense-attachment.prisma-repository.ts`
- [x] T027 [P] Implement shared response DTOs in `src/modules/expense/application/dto/expense.response.ts` and `src/modules/expense/application/dto/expense-attachment.response.ts`
- [x] T028 [P] Implement create/update request DTOs in `src/modules/expense/application/dto/create-expense.request.ts` and `src/modules/expense/application/dto/update-expense.request.ts`
- [x] T029 [P] Add Expense schemas/components to `src/swagger/common-schemas.ts`
- [x] T030 [P] Implement base Expense OpenAPI path declarations in `src/modules/expense/presentation/expense.openapi.ts`
- [x] T031 [P] Add `expenseListQuerySchema` and shared list query fields in `src/validations/common-query.schemas.ts`
- [x] T032 Implement Expense Zod schemas and query param validation in `src/modules/expense/presentation/expense.schemas.ts`
- [x] T033 Implement `upload.middleware.ts` for receipt photo multipart upload in `src/modules/expense/presentation/upload.middleware.ts`
- [x] T034 Implement `ExpenseController` method signatures and route handlers in `src/modules/expense/presentation/expense.controller.ts`
- [x] T035 Implement `createExpenseRoutes()` with correct route ordering (`/mine`, `/by-number/:expenseNumber` before `/:expenseId`) in `src/modules/expense/presentation/expense.routes.ts`
- [x] T036 Wire Expense dependencies, controller builder, and container exports in `src/modules/expense/index.ts` and `src/config/container.ts`
- [x] T037 Register Expense routes in `src/modules/index.ts`
- [x] T038 [P] Add expense-related error codes if needed in `src/shared/errors/error-codes.ts`
- [x] T039 [P] Extend in-memory expense repository support in `tests/setup/in-memory-expense-repository.ts`
- [x] T040 [P] Extend auth/test helpers for timed-in employee expense scenarios in `tests/setup/auth-helpers.ts` and `tests/setup/test-app.ts`
- [x] T041 [P] Add foundational unit coverage for `expense-number.ts`, `expense-lifecycle.ts`, and `expense.entity.ts` in `tests/unit/expense/expense-number.test.ts`, `tests/unit/expense/expense-lifecycle.test.ts`, and `tests/unit/expense/expense.entity.test.ts`
- [x] T042 [P] Add foundational integration coverage for Expense number allocation and persistence in `tests/integration/expense/expense-number-sequence.persistence.test.ts` and `tests/integration/expense/expense.persistence.test.ts`

**Checkpoint**: Expense schema, repositories, shared services, routes, DI, and test infrastructure are ready.

---

## Phase 3: User Story 1 - Employee Records an Operational Expense (Priority: P1) 🎯 MVP

**Goal**: Allow timed-in Employees to create Draft expenses with Expense Number, header fields, and optional context.

**Independent Test**: A timed-in Employee creates a Draft expense with required fields; receives unique Expense Number; non-timed-in create is rejected; Employee can view own expense detail.

### Tests for User Story 1

- [x] T043 [P] [US1] Create API tests for Draft expense creation in `tests/api/expense/expense-create.api.test.ts`
- [x] T044 [P] [US1] Create API tests for timed-in gate and validation errors in `tests/api/expense/expense-create-validation.api.test.ts`
- [x] T045 [P] [US1] Create unit tests for create rules and context shape in `tests/unit/expense/expense-rules.test.ts`

### Implementation for User Story 1

- [x] T046 [US1] Complete `ExpenseContextValidationService` for `COMPANY`, `BRANCH`, `WAREHOUSE`, and `VEHICLE` contexts in `src/modules/expense/application/services/expense-context-validation.service.ts`
- [x] T047 [US1] Implement `CreateExpenseUseCase` with Expense Number allocation, timed-in gate, context validation, and audit logging in `src/modules/expense/application/use-cases/create-expense.use-case.ts`
- [x] T048 [US1] Implement `GetExpenseUseCase` with employee own-scope authorization in `src/modules/expense/application/use-cases/get-expense.use-case.ts`
- [x] T049 [US1] Complete repository create/findById persistence in `src/modules/expense/infrastructure/expense.prisma-repository.ts`
- [x] T050 [US1] Complete controller handlers and route bindings for `POST /expenses` and `GET /expenses/{expenseId}` in `src/modules/expense/presentation/expense.controller.ts` and `src/modules/expense/presentation/expense.routes.ts`
- [x] T051 [US1] Update Expense OpenAPI and shared Swagger schemas for create and get detail in `src/modules/expense/presentation/expense.openapi.ts` and `src/swagger/common-schemas.ts`

**Checkpoint**: Employees can create and view own Draft expenses with Expense Numbers.

---

## Phase 4: User Story 2 - Employee Finalizes and Manages Own Draft Expenses (Priority: P2)

**Goal**: Allow Employees to edit own Draft expenses, attach receipt photos, record expenses, and list own expenses.

**Independent Test**: Employee edits Draft, uploads receipt, records expense, cannot edit Recorded; `GET /expenses/mine` returns own rows.

### Tests for User Story 2

- [x] T052 [P] [US2] Create API tests for Draft update and record workflow in `tests/api/expense/expense-update-record.api.test.ts`
- [x] T053 [P] [US2] Create API tests for attachment upload/list/remove in `tests/api/expense/expense-attachments.api.test.ts`
- [x] T054 [P] [US2] Create API tests for `GET /expenses/mine` in `tests/api/expense/expense-mine.api.test.ts`

### Implementation for User Story 2

- [x] T055 [US2] Implement `UpdateExpenseUseCase` for employee own Draft edits in `src/modules/expense/application/use-cases/update-expense.use-case.ts`
- [x] T056 [US2] Implement `RecordExpenseUseCase` for Draft → Recorded transition in `src/modules/expense/application/use-cases/record-expense.use-case.ts`
- [x] T057 [US2] Implement `AddExpenseAttachmentUseCase`, `ListExpenseAttachmentsUseCase`, `RemoveExpenseAttachmentUseCase`, and `GetExpenseAttachmentContentUseCase` in `src/modules/expense/application/use-cases/add-expense-attachment.use-case.ts`, `list-expense-attachments.use-case.ts`, `remove-expense-attachment.use-case.ts`, and `get-expense-attachment-content.use-case.ts`
- [x] T058 [US2] Implement `ListMyExpensesUseCase` in `src/modules/expense/application/use-cases/list-my-expenses.use-case.ts`
- [x] T059 [US2] Complete repository update/record and attachment persistence in `src/modules/expense/infrastructure/expense.prisma-repository.ts` and `src/modules/expense/infrastructure/expense-attachment.prisma-repository.ts`
- [x] T060 [US2] Complete controller handlers and routes for update, record, mine, and attachment endpoints in `src/modules/expense/presentation/expense.controller.ts` and `src/modules/expense/presentation/expense.routes.ts`
- [x] T061 [US2] Update Expense OpenAPI for update, record, mine, and attachment endpoints in `src/modules/expense/presentation/expense.openapi.ts`

**Checkpoint**: Employees can manage own Draft expenses end-to-end including record and receipts.

---

## Phase 5: User Story 3 - Manager Oversees Company Expenses (Priority: P3)

**Goal**: Allow Managers and Owners to list company expenses, edit Recorded expenses, cancel, and archive.

**Independent Test**: Manager lists `GET /expenses` with pagination/sort; edits Recorded expense; cancels with reason; archives Recorded/Cancelled; Employee cannot access company list.

### Tests for User Story 3

- [x] T062 [P] [US3] Create API tests for company list pagination and default sort in `tests/api/expense/expense-list.api.test.ts`
- [x] T063 [P] [US3] Create API tests for manager edit recorded, cancel, and archive in `tests/api/expense/expense-manager-actions.api.test.ts`
- [x] T064 [P] [US3] Create authorization matrix API tests in `tests/api/expense/expense-authorization.api.test.ts`

### Implementation for User Story 3

- [x] T065 [US3] Implement `ListExpensesUseCase` with pagination, default `expenseDate desc`, and role gate in `src/modules/expense/application/use-cases/list-expenses.use-case.ts`
- [x] T066 [US3] Extend `UpdateExpenseUseCase` for Manager/Owner Recorded edits in `src/modules/expense/application/use-cases/update-expense.use-case.ts`
- [x] T067 [US3] Implement `CancelExpenseUseCase` for Draft/Recorded → Cancelled in `src/modules/expense/application/use-cases/cancel-expense.use-case.ts`
- [x] T068 [US3] Implement `ArchiveExpenseUseCase` for Recorded/Cancelled soft archive in `src/modules/expense/application/use-cases/archive-expense.use-case.ts`
- [x] T069 [US3] Complete repository list/cancel/archive query methods in `src/modules/expense/infrastructure/expense.prisma-repository.ts`
- [x] T070 [US3] Complete controller handlers and routes for list, cancel, and archive in `src/modules/expense/presentation/expense.controller.ts` and `src/modules/expense/presentation/expense.routes.ts`
- [x] T071 [US3] Update Expense OpenAPI for list, cancel, and archive in `src/modules/expense/presentation/expense.openapi.ts`

**Checkpoint**: Managers can oversee company expenses; frontend `GET /api/v1/expenses` list works.

---

## Phase 6: User Story 4 - Trip-Linked Field Expenses (Priority: P4)

**Goal**: Accept expenses linked to Started/Completed trips; reject Draft/Cancelled/cross-company trips.

**Independent Test**: Trip context on Started and Completed trips succeeds; Draft and Cancelled trips return 409.

### Tests for User Story 4

- [x] T072 [P] [US4] Create API tests for trip context eligibility in `tests/api/expense/expense-trip-context.api.test.ts`
- [x] T073 [P] [US4] Create unit tests for trip validation in `tests/unit/expense/expense-context-validation.test.ts`

### Implementation for User Story 4

- [x] T074 [US4] Wire `TripRepository` and `TripEligibilityService.assertTripAcceptsExpense` into `ExpenseContextValidationService` in `src/modules/expense/application/services/expense-context-validation.service.ts`
- [x] T075 [US4] Integrate trip context validation in `CreateExpenseUseCase` and `UpdateExpenseUseCase` in `src/modules/expense/application/use-cases/create-expense.use-case.ts` and `update-expense.use-case.ts`
- [x] T076 [US4] Wire trip module dependencies in `src/modules/expense/index.ts` and `src/config/container.ts`

**Checkpoint**: Trip-linked expenses enforce P006 eligibility rules.

---

## Phase 7: User Story 5 - Search and Filter by Expense Number (Priority: P5)

**Goal**: Support Expense Number lookup and list filters (category, status, date range, context dimensions).

**Independent Test**: Manager finds expense by exact number; partial number search and filters return scoped results.

### Tests for User Story 5

- [x] T077 [P] [US5] Create API tests for `GET /expenses/by-number/{expenseNumber}` in `tests/api/expense/expense-by-number.api.test.ts`
- [x] T078 [P] [US5] Create API tests for list filters and search in `tests/api/expense/expense-list-filters.api.test.ts`

### Implementation for User Story 5

- [x] T079 [US5] Implement `GetExpenseByNumberUseCase` in `src/modules/expense/application/use-cases/get-expense-by-number.use-case.ts`
- [x] T080 [US5] Extend `ListExpensesUseCase` and repository with `expenseNumber`, `category`, `status`, `contextType`, dimensional FKs, `fromDate`/`toDate`, and `search` filters in `src/modules/expense/application/use-cases/list-expenses.use-case.ts` and `src/modules/expense/infrastructure/expense.prisma-repository.ts`
- [x] T081 [US5] Complete controller/routes for by-number lookup and filter query params in `src/modules/expense/presentation/expense.controller.ts` and `src/modules/expense/presentation/expense.routes.ts`
- [x] T082 [US5] Update Expense OpenAPI for by-number and filter parameters in `src/modules/expense/presentation/expense.openapi.ts`

**Checkpoint**: Expense Number search and advanced filters work for Managers/Owners.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Wire read-side consumers, seed data, docs, concurrency validation, and quickstart verification.

- [x] T083 [P] Implement real expense report queries in `src/modules/reports/infrastructure/reports.prisma-query-repository.ts`
- [x] T084 [P] Implement real expense analytics metrics in `src/modules/analytics/infrastructure/analytics.prisma-query-repository.ts`
- [x] T085 [P] Update `tests/api/reports/expense-report.api.test.ts` to expect seeded Recorded expense rows
- [x] T086 [P] Update `tests/api/analytics/expense-analytics.api.test.ts` to expect non-zero totals when expenses exist
- [x] T087 [P] Add sample Draft and Recorded expenses with trip/branch contexts in `prisma/seed.ts`
- [x] T088 [P] Add Expense Management section to `docs/api-reference.md` documenting `GET /expenses` and CRUD endpoints
- [x] T089 Register Expense OpenAPI paths in `src/swagger/openapi.builder.ts`
- [x] T090 [P] Add concurrency integration test for parallel expense creation in `tests/integration/expense/expense-number-concurrency.test.ts`
- [x] T091 Run quickstart validation scenarios from `specs/010-expense-management/quickstart.md`

**Checkpoint**: P007 complete — operational expenses feed reports/analytics; docs and quickstart pass.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**
- **User Stories (Phase 3–7)**: All depend on Foundational completion
  - US1 → US2 → US3 recommended sequentially for fastest path to frontend list
  - US4 can parallel US3 after US1 create/context service exists
  - US5 depends on US3 list infrastructure
- **Polish (Phase 8)**: Depends on US2 (Recorded expenses) and preferably US3+

### User Story Dependencies

| Story | Depends on                        | Delivers                          |
| ----- | --------------------------------- | --------------------------------- |
| US1   | Phase 2                           | Create + get own Draft            |
| US2   | US1                               | Update, record, attachments, mine |
| US3   | US1 (US2 for Recorded edit tests) | Company list, cancel, archive     |
| US4   | US1                               | Trip context rules                |
| US5   | US3                               | By-number + advanced filters      |

### Parallel Opportunities

- Phase 1: T002–T007 all parallel after T001
- Phase 2: Enum/entity/DTO/OpenAPI tasks marked [P] parallel before integration tasks T019–T037
- Within each story: test tasks marked [P] can run in parallel before implementation
- Phase 8: T083–T087, T090 parallel

### Parallel Example: User Story 1

```bash
# Tests in parallel:
tests/api/expense/expense-create.api.test.ts
tests/api/expense/expense-create-validation.api.test.ts
tests/unit/expense/expense-rules.test.ts

# Then implementation chain:
expense-context-validation.service.ts → create-expense.use-case.ts → repository → controller/routes
```

### Parallel Example: Foundational

```bash
# Domain layer in parallel:
expense-status.ts, expense-context-type.ts, expense.entity.ts, expense-attachment.entity.ts

# Then lifecycle + rules, then repositories and services
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Timed-in employee can `POST /expenses` and `GET /expenses/{id}`
5. Demo create flow

### Frontend Unblock (User Story 3)

1. Complete US1 + US2 + US3
2. **VALIDATE**: `GET /api/v1/expenses?page=1&limit=10&sortBy=expenseDate&sortOrder=desc` returns 200 for Manager
3. Ship to frontend integration

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → create/view Draft (MVP)
3. US2 → record + attachments
4. US3 → company list (frontend list page)
5. US4 → trip expenses
6. US5 → search/reconciliation
7. Polish → reports, analytics, docs, seed

---

## Notes

- Product numbering is **P007**; spec folder is **`010-expense-management`**
- Reuse `FileStorage` / `LocalFileStorage` from transaction module via DI — do not duplicate upload infrastructure
- Default list sort: `expenseDate` descending (matches frontend)
- Reports/analytics default to `RECORDED` expenses unless filter specifies otherwise
- Route order critical: `/expenses/mine` and `/expenses/by-number/:expenseNumber` before `/expenses/:expenseId`
