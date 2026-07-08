---
description: 'Task list for Trip Management (P006) feature'
---

# Tasks: P006 - Trip Management

**Input**: Design documents from `/specs/007-trip-management/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md; P001–P005 implemented and passing

**Tests**: Included — the specification and plan explicitly require unit, integration, API, workflow, authorization, validation, trip number, vehicle assignment, employee assignment, and concurrency coverage using Vitest and Supertest.

**Organization**: Tasks introduce a new `trip` module and targeted extensions to `transaction`, `workforce-dashboard`, Prisma schema, Swagger, and test support. Foundational work blocks all stories. Each user story phase is independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: `US1` = Plan Draft Trip, `US2` = Start Trip + Outside transaction enforcement, `US3` = Complete Trip, `US4` = Cancel Trip, `US5` = Employee View Assigned Trips, `US6` = Search & Filter Trips

## Path Conventions

P006 follows Scrappy API Clean Architecture:

- **Module**: `src/modules/trip/{domain,application,infrastructure,presentation}/`
- **Cross-module extensions**: `src/modules/transaction/`, `src/modules/workforce-dashboard/`, `src/modules/index.ts`, `src/config/container.ts`
- **Shared**: `src/shared/trips/`
- **Swagger**: `src/swagger/common-schemas.ts`, `src/modules/trip/presentation/trip.openapi.ts`, `docs/api-reference.md`
- **Tests**: `tests/unit/trip/`, `tests/integration/trip/`, `tests/api/trip/`, `tests/factories/`, `tests/setup/`
- **Schema**: `prisma/schema.prisma`

---

## Phase 1: Setup (Shared Scaffolding)

**Purpose**: Create the Trip module skeleton, shared helpers, and dedicated test areas.

- [ ] T001 Create the Trip module directory structure and `src/modules/trip/index.ts`
- [x] T002 [P] Create Trip domain file placeholders in `src/modules/trip/domain/trip.entity.ts`, `src/modules/trip/domain/trip-member.entity.ts`, `src/modules/trip/domain/trip-status.ts`, `src/modules/trip/domain/trip-member-role.ts`, `src/modules/trip/domain/trip-rules.ts`, `src/modules/trip/domain/trip-lifecycle.ts`, `src/modules/trip/domain/trip-number.ts`, `src/modules/trip/domain/trip.repository.ts`, and `src/modules/trip/domain/trip-number-sequence.repository.ts`
- [ ] T003 [P] Create Trip application file placeholders in `src/modules/trip/application/dto/create-trip.request.ts`, `src/modules/trip/application/dto/update-trip.request.ts`, `src/modules/trip/application/dto/trip.response.ts`, `src/modules/trip/application/dto/trip-member.response.ts`, `src/modules/trip/application/policies/trip-authorization.policy.ts`, and `src/modules/trip/application/services/trip-number.service.ts`, `src/modules/trip/application/services/trip-audit.service.ts`, `src/modules/trip/application/services/trip-eligibility.service.ts`
- [ ] T004 [P] Create Trip use-case placeholders in `src/modules/trip/application/use-cases/` for create, update, get, get-by-number, list, list-mine, archive, start, complete, cancel, add-member, update-member, and remove-member
- [ ] T005 [P] Create Trip infrastructure and presentation file placeholders in `src/modules/trip/infrastructure/trip.prisma-repository.ts`, `src/modules/trip/infrastructure/trip-number-sequence.prisma-repository.ts`, `src/modules/trip/infrastructure/mappers/trip.mapper.ts`, `src/modules/trip/infrastructure/mappers/trip-member.mapper.ts`, `src/modules/trip/presentation/trip.controller.ts`, `src/modules/trip/presentation/trip.routes.ts`, `src/modules/trip/presentation/trip.schemas.ts`, and `src/modules/trip/presentation/trip.openapi.ts`
- [x] T006 [P] Create shared Trip helper placeholder in `src/shared/trips/trip-number-format.ts`
- [ ] T007 [P] Create Trip test directories and stub files under `tests/unit/trip/`, `tests/integration/trip/`, `tests/api/trip/`, and `tests/factories/trip.factory.ts`

**Checkpoint**: Module scaffolding exists for implementation and testing.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add schema, repositories, domain rules, DI wiring, OpenAPI base support, and test infrastructure required by all user stories.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [x] T008 Add `TripStatus`, `TripMemberRole`, `Trip`, `TripMember`, and `TripNumberSequence` models plus `Transaction.tripId` relation updates in `prisma/schema.prisma`
- [x] T009 Create Prisma migration for Trip tables, Trip number sequence, transaction foreign key, and vehicle active-trip partial unique index in `prisma/migrations/`
- [x] T010 [P] Implement `TripStatus` and `TripMemberRole` enums in `src/modules/trip/domain/trip-status.ts` and `src/modules/trip/domain/trip-member-role.ts`
- [x] T011 [P] Implement `TripNumber` value object and parser/formatter helpers in `src/modules/trip/domain/trip-number.ts` and `src/shared/trips/trip-number-format.ts`
- [x] T012 [P] Implement `TripEntity` with status helpers and lifecycle assertions in `src/modules/trip/domain/trip.entity.ts`
- [x] T013 [P] Implement `TripMemberEntity` in `src/modules/trip/domain/trip-member.entity.ts`
- [x] T014 Implement `trip-lifecycle.ts` transition matrix and lifecycle assertion helpers in `src/modules/trip/domain/trip-lifecycle.ts`
- [x] T015 Implement foundational trip business rules in `src/modules/trip/domain/trip-rules.ts`
- [x] T016 [P] Define `TripRepository` query/update contract in `src/modules/trip/domain/trip.repository.ts`
- [x] T017 [P] Define `TripNumberSequenceRepository.allocateNext(companyId, sequenceDate)` in `src/modules/trip/domain/trip-number-sequence.repository.ts`
- [x] T018 Implement `TripNumberService` for atomic `TRIP-YYYYMMDD-000001` generation in `src/modules/trip/application/services/trip-number.service.ts`
- [x] T019 [P] Implement `TripEligibilityService` with `assertTripAcceptsTransaction` and `assertTripAcceptsExpense` in `src/modules/trip/application/services/trip-eligibility.service.ts`
- [x] T020 [P] Implement `trip-audit.service.ts` event helpers for create/start/complete/cancel/archive/member actions in `src/modules/trip/application/services/trip-audit.service.ts`
- [ ] T021 Implement Prisma mappers in `src/modules/trip/infrastructure/mappers/trip.mapper.ts` and `src/modules/trip/infrastructure/mappers/trip-member.mapper.ts`
- [ ] T022 Implement `TripNumberSequencePrismaRepository` with atomic allocation in `src/modules/trip/infrastructure/trip-number-sequence.prisma-repository.ts`
- [ ] T023 Implement `TripPrismaRepository` base CRUD/list/find-by-number/find-started queries in `src/modules/trip/infrastructure/trip.prisma-repository.ts`
- [ ] T024 [P] Implement shared response DTOs in `src/modules/trip/application/dto/trip.response.ts` and `src/modules/trip/application/dto/trip-member.response.ts`
- [ ] T025 [P] Implement create/update request DTOs in `src/modules/trip/application/dto/create-trip.request.ts` and `src/modules/trip/application/dto/update-trip.request.ts`
- [ ] T026 [P] Implement `trip-authorization.policy.ts` for manager/owner mutating access and employee member-scope reads in `src/modules/trip/application/policies/trip-authorization.policy.ts`
- [x] T027 [P] Add Trip schemas/components to `src/swagger/common-schemas.ts`
- [x] T028 [P] Implement base Trip OpenAPI path declarations in `src/modules/trip/presentation/trip.openapi.ts`
- [ ] T029 [P] Implement Trip Zod schemas and query param validation in `src/modules/trip/presentation/trip.schemas.ts`
- [ ] T030 Implement `TripController` method signatures and route handlers in `src/modules/trip/presentation/trip.controller.ts`
- [ ] T031 Implement `createTripRoutes()` with correct route ordering in `src/modules/trip/presentation/trip.routes.ts`
- [ ] T032 Wire Trip dependencies, controller builder, and container exports in `src/modules/trip/index.ts` and `src/config/container.ts`
- [ ] T033 Register Trip routes in `src/modules/index.ts`
- [ ] T034 [P] Extend in-memory repositories for Trip, TripMember, TripNumberSequence, and `Transaction.tripId` relation support in `tests/setup/in-memory-repositories.ts`
- [ ] T035 [P] Extend auth/test helpers for manager/employee trip scenarios in `tests/setup/auth-helpers.ts` and `tests/setup/test-app.ts`
- [ ] T036 [P] Create Trip payload factory helpers in `tests/factories/trip.factory.ts`
- [x] T037 [P] Add foundational unit coverage for `trip-number.ts`, `trip-lifecycle.ts`, and `trip.entity.ts` in `tests/unit/trip/trip-number.test.ts`, `tests/unit/trip/trip-lifecycle.test.ts`, and `tests/unit/trip/trip.entity.test.ts`
- [ ] T038 [P] Add foundational integration coverage for Trip number allocation and persistence in `tests/integration/trip/trip-number-sequence.persistence.test.ts` and `tests/integration/trip/trip.persistence.test.ts`

**Checkpoint**: Trip schema, repositories, shared services, routes, DI, and test infrastructure are ready.

---

## Phase 3: User Story 1 - Manager Plans a Trip (Priority: P1) 🎯 MVP

**Goal**: Allow Managers and Owners to create and edit Draft trips with vehicle, schedule, origin, destination, notes, and member roster.

**Independent Test**: A Manager creates a Draft trip with vehicle, two members, route, and schedule; the trip gets a Trip Number, remains editable in Draft, and rejects transaction linkage while not Started.

### Tests for User Story 1

- [ ] T039 [P] [US1] Create API tests for Draft trip creation and update in `tests/api/trip/trip-create.api.test.ts`
- [ ] T040 [P] [US1] Create API tests for Trip member add/update/remove while Draft in `tests/api/trip/trip-members.api.test.ts`
- [ ] T041 [P] [US1] Create validation/authorization API tests for invalid vehicle, inactive employee, duplicate members, and employee forbidden create in `tests/api/trip/trip-create-validation.api.test.ts`
- [ ] T042 [P] [US1] Create unit tests for Draft planning rules in `tests/unit/trip/trip-rules.test.ts`

### Implementation for User Story 1

- [ ] T043 [US1] Implement `CreateTripUseCase` with Trip Number allocation, vehicle validation, initial member validation, and audit logging in `src/modules/trip/application/use-cases/create-trip.use-case.ts`
- [ ] T044 [US1] Implement `UpdateTripUseCase` for Draft header edits in `src/modules/trip/application/use-cases/update-trip.use-case.ts`
- [ ] T045 [US1] Implement `AddTripMemberUseCase`, `UpdateTripMemberUseCase`, and `RemoveTripMemberUseCase` in `src/modules/trip/application/use-cases/add-trip-member.use-case.ts`, `update-trip-member.use-case.ts`, and `remove-trip-member.use-case.ts`
- [ ] T046 [US1] Finalize Draft create/update/member request DTO mapping in `src/modules/trip/application/dto/create-trip.request.ts`, `update-trip.request.ts`, and `trip-member.response.ts`
- [ ] T047 [US1] Complete repository Draft create/update/member persistence methods in `src/modules/trip/infrastructure/trip.prisma-repository.ts`
- [ ] T048 [US1] Complete controller handlers and route bindings for create, update, add-member, update-member, and remove-member in `src/modules/trip/presentation/trip.controller.ts` and `src/modules/trip/presentation/trip.routes.ts`
- [ ] T049 [US1] Update Trip OpenAPI and shared Swagger schemas for Draft planning endpoints in `src/modules/trip/presentation/trip.openapi.ts` and `src/swagger/common-schemas.ts`

**Checkpoint**: Managers/Owners can fully plan and adjust Draft trips; Draft trip member management works.

---

## Phase 4: User Story 2 - Manager Starts a Trip (Priority: P2)

**Goal**: Allow Managers and Owners to start a Draft trip, move vehicle to `IN_USE`, derive employees as On Trip, and enforce Outside transactions requiring a Started trip.

**Independent Test**: A Manager starts a valid Draft trip; vehicle becomes `IN_USE`, duplicate active vehicle/employee starts are blocked, and a timed-in assigned employee can create an Outside transaction only with that Started trip.

### Tests for User Story 2

- [ ] T050 [P] [US2] Create API tests for start lifecycle, vehicle busy conflict, and employee busy conflict in `tests/api/trip/trip-start.api.test.ts`
- [ ] T051 [P] [US2] Create integration tests for start transactionality and vehicle status updates in `tests/integration/trip/trip-start.persistence.test.ts`
- [ ] T052 [P] [US2] Create API tests for Outside transaction trip enforcement in `tests/api/trip/trip-transaction-outside.api.test.ts`
- [ ] T053 [P] [US2] Create unit tests for `TripEligibilityService` transaction acceptance rules in `tests/unit/trip/trip-eligibility.service.test.ts`
- [ ] T054 [P] [US2] Create concurrency API/integration tests for parallel start attempts on the same vehicle in `tests/api/trip/trip-concurrency.api.test.ts` and `tests/integration/trip/trip-concurrency.persistence.test.ts`

### Implementation for User Story 2

- [ ] T055 [US2] Implement `StartTripUseCase` with Draft completeness checks, vehicle/employee active-trip checks, vehicle status update, and audit logging in `src/modules/trip/application/use-cases/start-trip.use-case.ts`
- [ ] T056 [US2] Extend `TripRepository` and `trip.prisma-repository.ts` with active-trip-by-vehicle and active-trip-by-employee lookups plus start transition persistence in `src/modules/trip/domain/trip.repository.ts` and `src/modules/trip/infrastructure/trip.prisma-repository.ts`
- [ ] T057 [US2] Extend `VehicleRepository` usage paths and repository-supporting methods for trip start/complete transitions in `src/modules/vehicle/domain/vehicle.repository.ts` and `src/modules/vehicle/infrastructure/vehicle.prisma-repository.ts`
- [ ] T058 [US2] Add start endpoint controller and route implementation in `src/modules/trip/presentation/trip.controller.ts` and `src/modules/trip/presentation/trip.routes.ts`
- [ ] T059 [US2] Extend `CreateTransactionUseCase` and `UpdateTransactionUseCase` to require Started trip for `OUTSIDE` transactions and member validation in `src/modules/transaction/application/use-cases/create-transaction.use-case.ts` and `src/modules/transaction/application/use-cases/update-transaction.use-case.ts`
- [ ] T060 [US2] Add transaction-side trip validation helpers in `src/modules/transaction/domain/trip-rules.ts` and extend `src/modules/transaction/presentation/transaction.schemas.ts`
- [ ] T061 [US2] Wire `TripRepository` into transaction module composition in `src/modules/transaction/index.ts` and `src/config/container.ts`
- [ ] T062 [US2] Update Trip and Transaction Swagger/OpenAPI docs for start and Outside trip enforcement in `src/modules/trip/presentation/trip.openapi.ts`, `src/modules/transaction/presentation/transaction.openapi.ts`, `src/swagger/common-schemas.ts`, and `docs/api-reference.md`

**Checkpoint**: Started trip lifecycle works, concurrency is enforced, and Outside transactions are gated by Started trips.

---

## Phase 5: User Story 3 - Manager Completes a Trip (Priority: P3)

**Goal**: Allow Managers and Owners to complete Started trips, release vehicle availability, and block new transactions while allowing future expense eligibility.

**Independent Test**: A Manager completes a Started trip; actual end is recorded, vehicle returns to `AVAILABLE`, new Outside transactions reject that trip, and completed trips remain readable.

### Tests for User Story 3

- [ ] T063 [P] [US3] Create API tests for complete lifecycle and post-completion immutability in `tests/api/trip/trip-complete.api.test.ts`
- [ ] T064 [P] [US3] Create integration tests for vehicle release and completion persistence in `tests/integration/trip/trip-complete.persistence.test.ts`
- [ ] T065 [P] [US3] Extend Outside transaction enforcement tests for Completed trips in `tests/api/trip/trip-transaction-outside.api.test.ts`
- [ ] T066 [P] [US3] Create unit tests for complete transition rules and expense eligibility in `tests/unit/trip/trip-complete-rules.test.ts`

### Implementation for User Story 3

- [ ] T067 [US3] Implement `CompleteTripUseCase` with status transition, vehicle release, and audit logging in `src/modules/trip/application/use-cases/complete-trip.use-case.ts`
- [ ] T068 [US3] Extend `trip.prisma-repository.ts` with complete transition persistence and linked transaction summary support in `src/modules/trip/infrastructure/trip.prisma-repository.ts`
- [ ] T069 [US3] Add complete endpoint controller and route implementation in `src/modules/trip/presentation/trip.controller.ts` and `src/modules/trip/presentation/trip.routes.ts`
- [ ] T070 [US3] Extend `TripEligibilityService` and transaction-side validators to reject Completed trips for new transaction links in `src/modules/trip/application/services/trip-eligibility.service.ts` and `src/modules/transaction/domain/trip-rules.ts`
- [ ] T071 [US3] Update Swagger/OpenAPI and API reference for complete-trip behavior and Completed trip transaction rejection in `src/modules/trip/presentation/trip.openapi.ts`, `src/modules/transaction/presentation/transaction.openapi.ts`, and `docs/api-reference.md`

**Checkpoint**: Started trips can be completed safely and no longer accept new Outside transactions.

---

## Phase 6: User Story 4 - Manager Cancels a Draft Trip (Priority: P4)

**Goal**: Allow Managers and Owners to cancel Draft trips, making them immutable and unusable for transactions or expenses.

**Independent Test**: A Manager cancels a Draft trip; it becomes read-only, start/edit/member mutations fail, and transaction linkage is rejected.

### Tests for User Story 4

- [ ] T072 [P] [US4] Create API tests for cancel lifecycle and immutable cancelled trips in `tests/api/trip/trip-cancel.api.test.ts`
- [ ] T073 [P] [US4] Create API tests for invalid cancel on Started trips in `tests/api/trip/trip-lifecycle.api.test.ts`
- [ ] T074 [P] [US4] Create unit tests for cancel transition and cancellation reason requirements in `tests/unit/trip/trip-cancel-rules.test.ts`

### Implementation for User Story 4

- [ ] T075 [US4] Implement `CancelTripUseCase` with Draft-only transition, cancellation reason, and audit logging in `src/modules/trip/application/use-cases/cancel-trip.use-case.ts`
- [ ] T076 [US4] Add cancel endpoint controller and route implementation in `src/modules/trip/presentation/trip.controller.ts` and `src/modules/trip/presentation/trip.routes.ts`
- [ ] T077 [US4] Enforce Cancelled immutability across update/member/start/complete/archive guard paths in `src/modules/trip/domain/trip-rules.ts` and all affected trip use cases under `src/modules/trip/application/use-cases/`
- [ ] T078 [US4] Update Trip OpenAPI and docs for cancel endpoint and cancelled-trip error scenarios in `src/modules/trip/presentation/trip.openapi.ts`, `src/swagger/common-schemas.ts`, and `docs/api-reference.md`

**Checkpoint**: Draft trips can be cancelled and remain immutable afterward.

---

## Phase 7: User Story 5 - Employee Views Assigned Trips (Priority: P5)

**Goal**: Allow employees to list and view only trips they are assigned to, including upcoming Draft, active Started, and Completed history.

**Independent Test**: An Employee lists only their assigned trips, views trip details for assigned trips, receives 403 for unassigned trip detail, and cannot access company-wide trip listing.

### Tests for User Story 5

- [ ] T079 [P] [US5] Create API tests for `GET /trips/mine` and employee-assigned detail visibility in `tests/api/trip/trip-employee-view.api.test.ts`
- [ ] T080 [P] [US5] Create API authorization tests for employee forbidden access to company list and mutating endpoints in `tests/api/trip/trip-authorization.api.test.ts`
- [ ] T081 [P] [US5] Create unit tests for `trip-authorization.policy.ts` member-scope rules in `tests/unit/trip/trip-authorization.policy.test.ts`

### Implementation for User Story 5

- [ ] T082 [US5] Implement `GetTripUseCase` with manager/owner full access and employee member-scope access in `src/modules/trip/application/use-cases/get-trip.use-case.ts`
- [ ] T083 [US5] Implement `ListMyTripsUseCase` with linked employee resolution and status filtering in `src/modules/trip/application/use-cases/list-my-trips.use-case.ts`
- [ ] T084 [US5] Extend `trip.prisma-repository.ts` with member-scoped list and detail enrichment queries in `src/modules/trip/infrastructure/trip.prisma-repository.ts`
- [ ] T085 [US5] Add `GET /trips/{tripId}` and `GET /trips/mine` controller and route implementations in `src/modules/trip/presentation/trip.controller.ts` and `src/modules/trip/presentation/trip.routes.ts`
- [ ] T086 [US5] Extend Trip response DTOs and mapper enrichment for vehicle summary and employee names/numbers in `src/modules/trip/application/dto/trip.response.ts`, `src/modules/trip/application/dto/trip-member.response.ts`, and `src/modules/trip/infrastructure/mappers/trip.mapper.ts`
- [ ] T087 [US5] Populate employee `tripsSummary` in the workforce dashboard by extending `src/modules/workforce-dashboard/application/use-cases/get-workforce-dashboard.use-case.ts` and related DTOs if needed
- [ ] T088 [US5] Update Trip OpenAPI and API reference for employee-facing read endpoints in `src/modules/trip/presentation/trip.openapi.ts`, `src/swagger/common-schemas.ts`, and `docs/api-reference.md`

**Checkpoint**: Employees can safely view assigned trips without management capabilities.

---

## Phase 8: User Story 6 - Search and Filter Trips by Trip Number (Priority: P6)

**Goal**: Allow Managers and Owners to search trips by Trip Number and filter by status, vehicle, member, date range, and archive visibility.

**Independent Test**: A Manager can retrieve a trip by exact Trip Number, search by Trip Number prefix, and filter company trips without seeing cross-company results.

### Tests for User Story 6

- [ ] T089 [P] [US6] Create API tests for company list filtering, sorting, pagination, and includeArchived flag in `tests/api/trip/trip-list-search.api.test.ts`
- [ ] T090 [P] [US6] Create API tests for `GET /trips/by-number/{tripNumber}` including cross-company isolation in `tests/api/trip/trip-by-number.api.test.ts`
- [ ] T091 [P] [US6] Create integration tests for indexed trip search and archived filtering behavior in `tests/integration/trip/trip-search.persistence.test.ts`

### Implementation for User Story 6

- [ ] T092 [US6] Implement `ListTripsUseCase` with pagination, sorting, filters, and archive visibility in `src/modules/trip/application/use-cases/list-trips.use-case.ts`
- [ ] T093 [US6] Implement `GetTripByNumberUseCase` in `src/modules/trip/application/use-cases/get-trip-by-number.use-case.ts`
- [ ] T094 [US6] Extend `TripRepository` and `trip.prisma-repository.ts` with company list filters, exact number lookup, and paginated summaries in `src/modules/trip/domain/trip.repository.ts` and `src/modules/trip/infrastructure/trip.prisma-repository.ts`
- [ ] T095 [US6] Finalize list/by-number query schemas and route/controller handlers in `src/modules/trip/presentation/trip.schemas.ts`, `src/modules/trip/presentation/trip.controller.ts`, and `src/modules/trip/presentation/trip.routes.ts`
- [ ] T096 [US6] Update OpenAPI contracts and docs for trip search/filter endpoints in `src/modules/trip/presentation/trip.openapi.ts`, `src/swagger/common-schemas.ts`, `specs/007-trip-management/contracts/openapi.yaml`, and `docs/api-reference.md`

**Checkpoint**: Managers and Owners can search and filter trips efficiently by business identifier and operational dimensions.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Finish archive behavior, documentation sync, end-to-end validation, and quality checks affecting multiple stories.

- [ ] T097 Implement `ArchiveTripUseCase` for Completed/Cancelled trips and soft-delete persistence in `src/modules/trip/application/use-cases/archive-trip.use-case.ts` and `src/modules/trip/infrastructure/trip.prisma-repository.ts`
- [ ] T098 [P] Add API and integration tests for archive behavior in `tests/api/trip/trip-archive.api.test.ts` and `tests/integration/trip/trip-archive.persistence.test.ts`
- [ ] T099 [P] Add final module wiring, exports, and JSDoc cleanup across `src/modules/trip/`, `src/modules/index.ts`, and `src/config/container.ts`
- [ ] T100 [P] Sync Swagger/UI and human docs in `src/swagger/common-schemas.ts`, `src/modules/trip/presentation/trip.openapi.ts`, `docs/api-reference.md`, and `specs/007-trip-management/contracts/openapi.yaml`
- [ ] T101 [P] Run and fix targeted unit, integration, and API suites for Trip and transaction-trip integration in `tests/unit/trip/`, `tests/integration/trip/`, `tests/api/trip/`, and affected `tests/api/transaction/`
- [ ] T102 Run the end-to-end validation scenarios documented in `specs/007-trip-management/quickstart.md` and record any required adjustments in `specs/007-trip-management/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all story work
- **Phase 3 (US1)**: Depends on Phase 2 only; MVP
- **Phase 4 (US2)**: Depends on Phase 2 and core Draft planning from US1
- **Phase 5 (US3)**: Depends on US2 start lifecycle
- **Phase 6 (US4)**: Depends on US1 Draft lifecycle
- **Phase 7 (US5)**: Depends on US1 for readable trip data; benefits from US2/US3 lifecycle states
- **Phase 8 (US6)**: Depends on Phase 2 and preferably US1 persistence/read models
- **Phase 9 (Polish)**: Depends on all desired story phases

### User Story Dependencies

- **US1 (P1)**: Independent MVP after foundation
- **US2 (P2)**: Requires Draft trip creation/editing from US1
- **US3 (P3)**: Requires Started trips from US2
- **US4 (P4)**: Requires Draft trip creation from US1
- **US5 (P5)**: Requires trip read model from US1; richer value once US2/US3 exist
- **US6 (P6)**: Can begin after foundational repository/list support, but most useful after US1 data exists

### Within Each User Story

- Tests first, confirm failing behavior
- Domain/use-case logic before repository/controller finish
- Repository support before controller/route exposure
- OpenAPI/docs updated before story checkpoint close

### Parallel Opportunities

- Phase 1 scaffolding tasks marked `[P]` can run together
- Phase 2 domain/value-object/schema/test-support tasks marked `[P]` can run in parallel
- Within US1, API tests and rule unit tests can run in parallel with DTO/schema work
- Within US2, start lifecycle tests and transaction integration tests can run in parallel
- US4 cancellation work can proceed in parallel with portions of US5/US6 after US1 stabilizes
- Documentation/OpenAPI tasks within each story can be done in parallel after endpoint shapes are settled

---

## Parallel Example: User Story 2

```bash
# Tests in parallel
Task: "Create API tests for start lifecycle in tests/api/trip/trip-start.api.test.ts"
Task: "Create integration tests for start transactionality in tests/integration/trip/trip-start.persistence.test.ts"
Task: "Create API tests for Outside transaction trip enforcement in tests/api/trip/trip-transaction-outside.api.test.ts"

# Implementation in parallel after domain rules are ready
Task: "Implement StartTripUseCase in src/modules/trip/application/use-cases/start-trip.use-case.ts"
Task: "Extend transaction trip validation in src/modules/transaction/application/use-cases/create-transaction.use-case.ts and update-transaction.use-case.ts"
Task: "Update Trip/Transaction OpenAPI docs in src/modules/trip/presentation/trip.openapi.ts and src/modules/transaction/presentation/transaction.openapi.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 Draft planning
4. **STOP and VALIDATE** using Draft-trip scenarios from `quickstart.md`

### Incremental Delivery

1. Add US1 → Draft planning
2. Add US2 → Active trips + Outside transaction enforcement
3. Add US3 → Completion flow
4. Add US4 → Cancellation
5. Add US5 → Employee assigned-trip visibility
6. Add US6 → Search/filter and retrieval by Trip Number
7. Finish archive and cross-cutting polish

### Suggested MVP Scope

- **Recommended MVP**: **US1 only**
- **Operational MVP**: **US1 + US2**
- **Full lifecycle MVP**: **US1 + US2 + US3 + US4**

---

## Notes

- All tasks follow the required checklist format with IDs, optional `[P]`, story labels for story phases, and exact file paths.
- Tests are intentionally included because the spec and plan explicitly require them.
- Archive is left for the final cross-cutting phase because it depends on Completed/Cancelled states from multiple stories.
