---
description: 'Task list for Transaction Settlement (P005) feature'
---

# Tasks: P005 - Transaction Settlement

**Input**: Design documents from `/specs/006-transaction-settlement/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md; P001–P004 implemented and passing (especially `005-transaction-management`)

**Tests**: Included — the specification and plan require unit, integration, API, workflow, authorization, concurrency, and receipt tests for settlement lifecycle extensions.

**Organization**: Tasks extend the existing `transaction` module in place. Foundational phase adds schema, Transaction Number infrastructure, lifecycle domain, and shared editability rules that all user stories depend on. Each story delivers an independently testable settlement slice.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: `US1` = Finish/Submit + Transaction Number, `US2` = Manager Review/Edit/Return, `US3` = Settle, `US4` = Owner Reopen, `US5` = Receipt, `US6` = Search by Transaction Number

## Path Conventions

P005 extends P004 modular Clean Architecture:

- **Module**: `src/modules/transaction/{domain,application,infrastructure,presentation}/`
- **Shared**: `src/shared/transactions/`
- **Config**: `src/config/container.ts`, `src/modules/transaction/index.ts`, `src/modules/index.ts`
- **Swagger**: `src/swagger/common-schemas.ts`, `src/modules/transaction/presentation/transaction.openapi.ts`
- **Tests**: `tests/unit/transaction/`, `tests/integration/transaction/`, `tests/api/transaction/`, `tests/factories/`, `tests/setup/`
- **Schema**: `prisma/schema.prisma`

---

## Phase 1: Setup (P005 Extension Scaffolding)

**Purpose**: Prepare settlement-specific source files and test directories without modifying unrelated modules.

- [x] T001 Create settlement domain file placeholders `transaction-number.ts`, `transaction-lifecycle.ts`, and `transaction-number-sequence.repository.ts` under `src/modules/transaction/domain/`
- [x] T002 [P] Create settlement application placeholders `transaction-number.service.ts`, `receipt-assembler.service.ts`, and `receipt.response.ts` under `src/modules/transaction/application/services/` and `application/dto/`
- [x] T003 [P] Create settlement test directories and stub files under `tests/unit/transaction/`, `tests/integration/transaction/`, and `tests/api/transaction/` for settlement-specific suites
- [x] T004 [P] Create shared formatter helpers (`formatTransactionNumber`, `parseTransactionNumberPrefix`) in `src/shared/transactions/transaction-number-format.ts`

**Checkpoint**: File scaffolding exists for settlement extensions and dedicated test suites.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database migration, Transaction Number sequence infrastructure, extended status enum, lifecycle domain rules, repository extensions, authorization policy updates, DTO/schema extensions, in-memory test support, and Transaction Number assignment on create.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [x] T005 Extend `TransactionStatus` enum with `READY_FOR_PAYMENT` and `PAID` in `prisma/schema.prisma` and `src/modules/transaction/domain/transaction-status.ts`
- [x] T006 Add settlement columns (`transactionNumber`, `submittedAt`, `submittedByUserId`, `paidAt`, `paidByUserId`, `cancelledByUserId`, `reopenedAt`, `reopenedByUserId`, `reopenReason`) and unique index `(companyId, transactionNumber)` to `Transaction` model in `prisma/schema.prisma` per `data-model.md`
- [x] T007 Add `TransactionNumberSequence` model (`companyId`, `direction`, `sequenceDate`, `lastSequence`) with unique `(companyId, direction, sequenceDate)` in `prisma/schema.prisma`
- [x] T008 Create Prisma migration with backfill script assigning `transactionNumber` to existing transactions in creation order per `specs/006-transaction-settlement/research.md` in `prisma/migrations/`
- [x] T009 [P] Implement `TransactionNumber` value object (format validation, prefix/date/sequence parsing) in `src/modules/transaction/domain/transaction-number.ts`
- [x] T010 [P] Implement transition matrix and `assertTransition(from, to, actor)` helpers in `src/modules/transaction/domain/transaction-lifecycle.ts`
- [x] T011 Extend `TransactionEntity` with `isReadyForPayment()`, `isPaid()`, `isEditableBy(auth, role)`, and settlement field accessors in `src/modules/transaction/domain/transaction.entity.ts`
- [x] T012 Extend `transaction-rules.ts` with `assertFinishable`, `assertReadyForPayment`, `assertPaid`, `assertHasItems`, `assertPositiveGrandTotal`, and status-aware `assertEditable` in `src/modules/transaction/domain/transaction-rules.ts`
- [x] T013 [P] Define `TransactionNumberSequenceRepository.allocateNext(companyId, direction, sequenceDate)` interface in `src/modules/transaction/domain/transaction-number-sequence.repository.ts`
- [x] T014 Implement `TransactionNumberService` (allocate sequence, format `IN|OUT-YYYYMMDD-000001`) in `src/modules/transaction/application/services/transaction-number.service.ts`
- [x] T015 [P] Extend `TransactionRepository` with `findByTransactionNumber`, settlement update methods, and `transactionNumber` filter support in `src/modules/transaction/domain/transaction.repository.ts`
- [x] T016 Implement `TransactionNumberSequencePrismaRepository` with atomic increment inside `prisma.$transaction()` in `src/modules/transaction/infrastructure/transaction-number-sequence.prisma-repository.ts`
- [x] T017 Extend `TransactionPrismaRepository` and `transaction.mapper.ts` for new fields, `findByTransactionNumber`, and `transactionNumber` list filters in `src/modules/transaction/infrastructure/transaction.prisma-repository.ts` and `infrastructure/mappers/transaction.mapper.ts`
- [x] T018 [P] Extend authorization policy with `assertCanFinish`, `assertCanSettle`, `assertCanReturnToDraft`, `assertCanReopen`, and status-aware `assertCanEditTransaction` in `src/modules/transaction/application/policies/transaction-authorization.policy.ts`
- [x] T019 [P] Extend transaction response DTOs with `transactionNumber`, `SettlementSummary`, and settlement metadata mapping in `src/modules/transaction/application/dto/transaction.response.ts` and `transaction-detail.response.ts`
- [x] T020 [P] Extend Zod schemas for settlement requests (`returnToDraft`, `settle`, `reopen`), `transactionNumber` path/query params, and extended `status` enum in `src/modules/transaction/presentation/transaction.schemas.ts`
- [x] T021 [P] Extend `InMemoryTransactionStore` and `InMemoryTransactionRepository` with `transactionNumber`, new statuses, sequence simulation, and `findByTransactionNumber` in `tests/setup/in-memory-repositories.ts`
- [x] T022 Extend `CreateTransactionUseCase` to allocate `transactionNumber` atomically via `TransactionNumberService` before persist in `src/modules/transaction/application/use-cases/create-transaction.use-case.ts`
- [x] T023 [P] Create unit tests for `transaction-lifecycle.ts` transition matrix (valid and invalid transitions) in `tests/unit/transaction/transaction-lifecycle.test.ts`
- [x] T024 [P] Create unit tests for `transaction-number.ts` and `transaction-number-format.ts` formatting/parsing in `tests/unit/transaction/transaction-number.test.ts`
- [ ] T025 [P] Create integration tests for concurrent sequence allocation producing unique sequential numbers in `tests/integration/transaction/transaction-number-sequence.persistence.test.ts`
- [x] T026 [P] Extend `transaction.entity.test.ts` and `transaction-rules.test.ts` for new status helpers and finish/settle assertions in `tests/unit/transaction/transaction.entity.test.ts` and `tests/unit/transaction/transaction-rules.test.ts`
- [x] T027 Register `TransactionNumberSequenceRepository`, `TransactionNumberService`, and extended repository bindings in `src/modules/transaction/index.ts` and `src/config/container.ts`

**Checkpoint**: Schema migrated, Transaction Numbers assigned on create, lifecycle domain and repositories ready for settlement use cases.

---

## Phase 3: User Story 1 - Employee Finishes a Draft Transaction (Priority: P1) 🎯 MVP

**Goal**: Assign immutable Transaction Number at creation and allow assigned Employees to submit complete Draft transactions to Ready for Payment.

**Independent Test**: Created transaction has `transactionNumber`; assigned Employee calls finish → `READY_FOR_PAYMENT` with `submittedAt`; Employee PATCH returns 403.

### Tests for User Story 1

- [ ] T028 [P] [US1] Create unit tests for `FinishTransactionUseCase` (draft-only, completeness, assignment, positive total) in `tests/unit/transaction/finish-transaction.use-case.test.ts`
- [x] T029 [P] [US1] Create API tests for `POST /api/v1/transactions/{id}/finish` success, incomplete rejection, and Employee lockout in `tests/api/transaction/transaction-finish.api.test.ts`
- [x] T030 [P] [US1] Extend `transaction-create.api.test.ts` to assert `transactionNumber` format on create in `tests/api/transaction/transaction-create.api.test.ts`

### Implementation for User Story 1

- [x] T031 [US1] Implement `FinishTransactionUseCase` (assert draft, finishable, assigned employee, set `READY_FOR_PAYMENT`, `submittedAt`, `submittedByUserId`, audit) in `src/modules/transaction/application/use-cases/finish-transaction.use-case.ts`
- [x] T032 [US1] Add `finish` controller handler in `src/modules/transaction/presentation/transaction.controller.ts`
- [x] T033 [US1] Register `POST /api/v1/transactions/{transactionId}/finish` route with auth, validation, and authorization in `src/modules/transaction/presentation/transaction.routes.ts`
- [x] T034 [US1] Wire `FinishTransactionUseCase` in `src/modules/transaction/index.ts` and `src/config/container.ts`
- [x] T035 [US1] Add finish endpoint and extended `TransactionStatus` enum to OpenAPI in `src/modules/transaction/presentation/transaction.openapi.ts` and `src/swagger/common-schemas.ts`

**Checkpoint**: Employees can finish assigned Draft transactions; Transaction Numbers appear on all new transactions.

---

## Phase 4: User Story 2 - Manager Reviews and Edits Submitted Transactions (Priority: P2)

**Goal**: Allow Managers/Owners to edit Ready for Payment transactions and return them to Draft; block Employee edits on submitted transactions.

**Independent Test**: Manager PATCH on `READY_FOR_PAYMENT` succeeds; Employee PATCH fails; return-to-draft restores `DRAFT`.

### Tests for User Story 2

- [ ] T036 [P] [US2] Create unit tests for `ReturnToDraftUseCase` and extended `UpdateTransactionUseCase` READY_FOR_PAYMENT edit rules in `tests/unit/transaction/return-to-draft.use-case.test.ts` and `tests/unit/transaction/update-transaction.use-case.test.ts`
- [ ] T037 [P] [US2] Extend item/attachment use case unit tests for Manager edit on `READY_FOR_PAYMENT` in `tests/unit/transaction/transaction-item.use-cases.test.ts` and `tests/unit/transaction/transaction-attachment.use-cases.test.ts`
- [x] T038 [P] [US2] Create API tests for Manager edit, Employee forbidden edit, and return-to-draft in `tests/api/transaction/transaction-return-draft.api.test.ts` and extend `transaction-update.api.test.ts`

### Implementation for User Story 2

- [x] T039 [US2] Implement `ReturnToDraftUseCase` in `src/modules/transaction/application/use-cases/return-to-draft.use-case.ts`
- [x] T040 [US2] Extend `UpdateTransactionUseCase` and item/attachment use cases to use status-aware `assertCanEditTransaction` / `assertEditable` for `READY_FOR_PAYMENT` in `src/modules/transaction/application/use-cases/update-transaction.use-case.ts`, `add-transaction-item.use-case.ts`, `update-transaction-item.use-case.ts`, `remove-transaction-item.use-case.ts`, and attachment use cases
- [x] T041 [US2] Add `returnToDraft` controller handler and register `POST /api/v1/transactions/{transactionId}/return-to-draft` route in `src/modules/transaction/presentation/transaction.controller.ts` and `transaction.routes.ts`
- [x] T042 [US2] Wire `ReturnToDraftUseCase` and extended use cases in `src/modules/transaction/index.ts` and `src/config/container.ts`
- [x] T043 [US2] Add return-to-draft endpoint and `ReturnToDraftRequest` schema to OpenAPI in `src/modules/transaction/presentation/transaction.openapi.ts` and `src/swagger/common-schemas.ts`

**Checkpoint**: Managers can review, edit, and return submitted transactions; Employees are locked out.

---

## Phase 5: User Story 3 - Manager Settles a Transaction (Priority: P3)

**Goal**: Allow Managers/Owners to mark Ready for Payment transactions as Paid with audit metadata; extend cancel to work from Ready for Payment.

**Independent Test**: Manager settles → `PAID` with `paidAt`/`paidByUserId`; duplicate settle returns 409; cancel from `READY_FOR_PAYMENT` works.

### Tests for User Story 3

- [ ] T044 [P] [US3] Create unit tests for `SettleTransactionUseCase` and extended `CancelTransactionUseCase` in `tests/unit/transaction/settle-transaction.use-case.test.ts` and `tests/unit/transaction/cancel-archive.use-cases.test.ts`
- [ ] T045 [P] [US3] Create integration tests for settlement persistence and paid-field invariants in `tests/integration/transaction/transaction-settlement.persistence.test.ts`
- [ ] T046 [P] [US3] Create API tests for settle success, duplicate settle, Employee forbidden, and cancel from submitted in `tests/api/transaction/transaction-settle.api.test.ts`

### Implementation for User Story 3

- [x] T047 [US3] Implement `SettleTransactionUseCase` (assert `READY_FOR_PAYMENT`, set `PAID`, `paidAt`, `paidByUserId`, audit) in `src/modules/transaction/application/use-cases/settle-transaction.use-case.ts`
- [x] T048 [US3] Extend `CancelTransactionUseCase` to allow cancel from `READY_FOR_PAYMENT`, set `cancelledByUserId`, and reject cancel from `PAID` in `src/modules/transaction/application/use-cases/cancel-transaction.use-case.ts`
- [x] T049 [US3] Add `settle` controller handler and register `POST /api/v1/transactions/{transactionId}/settle` route in `src/modules/transaction/presentation/transaction.controller.ts` and `transaction.routes.ts`
- [x] T050 [US3] Wire `SettleTransactionUseCase` and extended cancel in `src/modules/transaction/index.ts` and `src/config/container.ts`
- [x] T051 [US3] Add settle endpoint and `SettleTransactionRequest` schema to OpenAPI in `src/modules/transaction/presentation/transaction.openapi.ts` and `src/swagger/common-schemas.ts`

**Checkpoint**: Managers can settle and cancel submitted transactions; Paid transactions are locked.

---

## Phase 6: User Story 4 - Owner Reopens a Paid Transaction (Priority: P4)

**Goal**: Allow Owners to reopen Paid transactions to Ready for Payment, clearing paid metadata with required audit reason.

**Independent Test**: Owner reopen clears `paidAt`/`paidByUserId`, sets `READY_FOR_PAYMENT`; Manager reopen returns 403; re-settle records new paid metadata.

### Tests for User Story 4

- [ ] T052 [P] [US4] Create unit tests for `ReopenTransactionUseCase` (owner-only, paid-only, metadata clearing) in `tests/unit/transaction/reopen-transaction.use-case.test.ts`
- [ ] T053 [P] [US4] Create API tests for Owner reopen, Manager forbidden, and re-settle cycle in `tests/api/transaction/transaction-reopen.api.test.ts`

### Implementation for User Story 4

- [x] T054 [US4] Implement `ReopenTransactionUseCase` in `src/modules/transaction/application/use-cases/reopen-transaction.use-case.ts`
- [x] T055 [US4] Add `reopen` controller handler and register `POST /api/v1/transactions/{transactionId}/reopen` route in `src/modules/transaction/presentation/transaction.controller.ts` and `transaction.routes.ts`
- [x] T056 [US4] Wire `ReopenTransactionUseCase` in `src/modules/transaction/index.ts` and `src/config/container.ts`
- [x] T057 [US4] Add reopen endpoint and `ReopenTransactionRequest` schema to OpenAPI in `src/modules/transaction/presentation/transaction.openapi.ts` and `src/swagger/common-schemas.ts`

**Checkpoint**: Owners can reopen Paid transactions for correction and re-settlement.

---

## Phase 7: User Story 5 - Generate and Retrieve Receipt (Priority: P5)

**Goal**: Return structured receipt DTO for Paid transactions only, including Company, items, grand total, and settlement metadata.

**Independent Test**: Receipt GET on Paid returns all required fields; GET on `READY_FOR_PAYMENT` returns 409.

### Tests for User Story 5

- [ ] T058 [P] [US5] Create unit tests for `ReceiptAssemblerService` field assembly and paid-only guard in `tests/unit/transaction/receipt-assembler.service.test.ts`
- [ ] T059 [P] [US5] Create API tests for receipt success and not-paid rejection in `tests/api/transaction/transaction-receipt.api.test.ts`

### Implementation for User Story 5

- [x] T060 [P] [US5] Create `ReceiptResponseDto` in `src/modules/transaction/application/dto/receipt.response.ts`
- [x] T061 [US5] Implement `ReceiptAssemblerService` (load Company, resolve paid-by display name, compute grand total) in `src/modules/transaction/application/services/receipt-assembler.service.ts`
- [x] T062 [US5] Implement `GetReceiptUseCase` in `src/modules/transaction/application/use-cases/get-receipt.use-case.ts`
- [x] T063 [US5] Add `getReceipt` controller handler and register `GET /api/v1/transactions/{transactionId}/receipt` route in `src/modules/transaction/presentation/transaction.controller.ts` and `transaction.routes.ts`
- [x] T064 [US5] Wire receipt service and use case in `src/modules/transaction/index.ts` and `src/config/container.ts`
- [x] T065 [US5] Add `Receipt`, `ReceiptItem`, `ReceiptCompany` schemas and receipt endpoint to OpenAPI in `src/modules/transaction/presentation/transaction.openapi.ts` and `src/swagger/common-schemas.ts`

**Checkpoint**: Authorized users can retrieve complete receipt data for Paid transactions only.

---

## Phase 8: User Story 6 - Search and Filter by Transaction Number (Priority: P6)

**Goal**: Direct lookup and list filtering by Transaction Number within tenant and role scope.

**Independent Test**: `GET /by-number/{n}` returns exact match; list `transactionNumber` prefix filter works; cross-company returns 404.

### Tests for User Story 6

- [ ] T066 [P] [US6] Create unit tests for `GetTransactionByNumberUseCase` and extended list filters in `tests/unit/transaction/get-transaction-by-number.use-case.test.ts` and `tests/unit/transaction/list-transactions.use-cases.test.ts`
- [x] T067 [P] [US6] Create API tests for by-number lookup, prefix search, and tenant isolation in `tests/api/transaction/transaction-by-number.api.test.ts`
- [ ] T068 [P] [US6] Extend list API tests for `status=READY_FOR_PAYMENT|PAID` and `transactionNumber` query in `tests/api/transaction/transaction-list.api.test.ts`

### Implementation for User Story 6

- [x] T069 [US6] Implement `GetTransactionByNumberUseCase` in `src/modules/transaction/application/use-cases/get-transaction-by-number.use-case.ts`
- [x] T070 [US6] Extend `ListTransactionsUseCase` and `ListAssignedTransactionsUseCase` with `transactionNumber` filter and extended status values in `src/modules/transaction/application/use-cases/list-transactions.use-case.ts` and `list-assigned-transactions.use-case.ts`
- [x] T071 [US6] Add `getByNumber` controller handler and register `GET /api/v1/transactions/by-number/{transactionNumber}` **before** `/:transactionId` in `src/modules/transaction/presentation/transaction.controller.ts` and `transaction.routes.ts`
- [x] T072 [US6] Wire lookup use case and extend list query schema validation in `src/modules/transaction/index.ts`, `src/config/container.ts`, and `transaction.schemas.ts`
- [x] T073 [US6] Add by-number lookup and extended list query params to OpenAPI in `src/modules/transaction/presentation/transaction.openapi.ts`

**Checkpoint**: Users can find transactions by Transaction Number via direct lookup and list filters.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Authorization matrix coverage, workflow E2E, regression safety, documentation, and quickstart validation.

- [ ] T074 [P] Create settlement authorization matrix API tests (finish, settle, return, reopen, receipt) in `tests/api/transaction/transaction-settlement-auth.api.test.ts`
- [ ] T075 [P] Create invalid transition and error scenario API tests in `tests/api/transaction/transaction-settlement-errors.api.test.ts`
- [ ] T076 Create end-to-end workflow API test (create → finish → settle → receipt → reopen → re-settle) in `tests/api/transaction/transaction-settlement-workflow.api.test.ts`
- [ ] T077 [P] Extend tenant isolation API tests for settlement endpoints in `tests/api/transaction/transaction-tenant-isolation.api.test.ts`
- [ ] T078 Extend transaction audit service with finish, settle, reopen, and return-to-draft events in `src/modules/transaction/application/services/transaction-audit.service.ts`
- [x] T079 [P] Update settlement endpoints and Transaction Number documentation in `docs/api-reference.md`
- [ ] T080 Run full validation per `specs/006-transaction-settlement/quickstart.md` (all 10 scenarios)
- [x] T081 Run `pnpm run lint`, `pnpm exec tsc --noEmit`, and full `pnpm test` ensuring P004 regression suites remain green

**Checkpoint**: P005 settlement feature complete, documented, and regression-safe.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**
- **User Stories (Phase 3–8)**: Depend on Foundational completion; recommended sequential P1→P6
- **Polish (Phase 9)**: Depends on all desired user stories

### User Story Dependencies

| Story | Depends on | Notes                                                                 |
| ----- | ---------- | --------------------------------------------------------------------- |
| US1   | Phase 2    | Finish requires lifecycle + number on create                          |
| US2   | US1        | Needs `READY_FOR_PAYMENT` transactions to edit/return                 |
| US3   | US2        | Needs submitted transactions to settle                                |
| US4   | US3        | Needs Paid transactions to reopen                                     |
| US5   | US3        | Needs Paid transactions for receipt (can parallel with US4 after US3) |
| US6   | Phase 2    | Number on create enables lookup; list filters independent of settle   |

US5 and US6 can run in parallel after US3. US4 requires US3.

### Within Each User Story

- Tests before or alongside implementation (write failing tests first when possible)
- Domain/use cases before controller/routes
- DI wiring and OpenAPI last within each story

### Parallel Opportunities

- Phase 1: T002–T004 in parallel
- Phase 2: T009–T013, T015, T018–T021, T023–T026 in parallel after T005–T008 migration
- Per story: all `[P]` test tasks in parallel
- After US3: US4 and US5 can proceed in parallel
- US6 can start after Phase 2 (lookup on created numbers) but full filter testing benefits from US1–US3 data

---

## Parallel Example: User Story 1

```bash
# Tests in parallel:
tests/unit/transaction/finish-transaction.use-case.test.ts
tests/api/transaction/transaction-finish.api.test.ts
tests/api/transaction/transaction-create.api.test.ts  # extend

# After tests stubbed:
src/modules/transaction/application/use-cases/finish-transaction.use-case.ts
src/modules/transaction/presentation/transaction.controller.ts
src/modules/transaction/presentation/transaction.routes.ts
```

---

## Parallel Example: User Story 5 + User Story 6 (after US3)

```bash
# Developer A — Receipt:
src/modules/transaction/application/services/receipt-assembler.service.ts
src/modules/transaction/application/use-cases/get-receipt.use-case.ts

# Developer B — Lookup:
src/modules/transaction/application/use-cases/get-transaction-by-number.use-case.ts
src/modules/transaction/application/use-cases/list-transactions.use-case.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1 (Transaction Number + finish)
4. **STOP and VALIDATE**: Create → finish → Employee locked out
5. Demo submit-for-settlement workflow

### Incremental Delivery

1. Setup + Foundational → number infrastructure ready
2. US1 → Employee submit queue (MVP)
3. US2 → Manager review/correction loop
4. US3 → Financial settlement
5. US4 → Owner correction path
6. US5 → Receipt artifact
7. US6 → Operational search/lookup
8. Polish → full matrix + regression

### Parallel Team Strategy

1. Team completes Foundational together
2. US1 sequential (gateway to settlement)
3. US2 → US3 sequential for core financial path
4. After US3: split US4 (reopen) and US5 (receipt); US6 in parallel
5. Polish phase validates full quickstart

---

## Notes

- Route order is critical: `/transactions/by-number/:transactionNumber` before `/:transactionId`
- `transactionNumber` is server-assigned only — reject client-supplied values on create/update
- Reopen returns to `READY_FOR_PAYMENT`, not `DRAFT` (see spec Assumptions)
- Archived transactions (`deletedAt` set) must be rejected by all settlement mutations
- Commit after each task or logical group; stop at any checkpoint to validate story independently
