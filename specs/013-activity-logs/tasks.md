---
description: 'Task list for P010 - Activity Logs'
---

# Tasks: P010 - Activity Logs

**Input**: Design documents from `/specs/013-activity-logs/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml,
quickstart.md; P001–P012 implemented and passing

**Tests**: Included — plan §12 and engineering AC-008 require Vitest unit/integration and Supertest
API coverage for authz, search, filter, sort, pagination, and event generation.

**Organization**: New `activity-log` module (append-only sink + read API). Foundational persistence
and recorder block all stories. Producer instrumentation (US4) can proceed after recorder exists;
list/search stories can use seeded rows independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: `US1` = Owner list/get + Employee deny, `US2` = Search/filter, `US3` = Sort,
  `US4` = Automatic event recording across producers

## Path Conventions

- **Module**: `src/modules/activity-log/{domain,application,infrastructure,presentation}/`
- **DI / routes**: `src/config/container.ts`, `src/modules/index.ts`
- **Schema**: `prisma/schema.prisma`, `prisma/migrations/`
- **Swagger**: `src/swagger/common-schemas.ts`, `src/swagger/openapi.builder.ts`
- **Docs**: `docs/api-reference.md`
- **Tests**: `tests/unit/activity-log/`, `tests/api/activity-log/`, `tests/setup/`

---

## Phase 1: Setup (Shared Scaffolding)

**Purpose**: Create module placeholders and test directories without changing runtime behavior.

- [x] T001 [P] Create domain placeholders in `src/modules/activity-log/domain/activity-log.entity.ts`, `activity-log.repository.ts`, `activity-modules.ts`, and `activity-actions.ts`
- [x] T002 [P] Create application placeholders in `src/modules/activity-log/application/services/activity-log-recorder.service.ts`, `dto/activity-log.response.ts`, `dto/list-activity-logs.query.ts`, `use-cases/list-activity-logs.use-case.ts`, and `use-cases/get-activity-log.use-case.ts`
- [x] T003 [P] Create presentation placeholders in `src/modules/activity-log/presentation/activity-log.controller.ts`, `activity-log.routes.ts`, `activity-log.schemas.ts`, and `activity-log.openapi.ts`
- [x] T004 [P] Create infrastructure placeholders in `src/modules/activity-log/infrastructure/activity-log.prisma-repository.ts` and `mappers/activity-log.mapper.ts`
- [x] T005 [P] Create test directories `tests/unit/activity-log/` and `tests/api/activity-log/`

**Checkpoint**: Scaffolding exists for implementation and testing.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Persist ActivityLog, repository append/query ports, taxonomy, recorder, in-memory
test double — required before read APIs and producer hooks.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [x] T006 Add `ActivityLog` model and indexes per `data-model.md` / plan §2 in `prisma/schema.prisma`
- [x] T007 Create Prisma migration for ActivityLog in `prisma/migrations/`
- [x] T008 Implement `ActivityLogEntity` / props in `src/modules/activity-log/domain/activity-log.entity.ts`
- [x] T009 Implement `ActivityLogRepository` interface (`append`, `findById`, `list`) in `src/modules/activity-log/domain/activity-log.repository.ts`
- [x] T010 [P] Implement module/eventType/action taxonomy constants in `src/modules/activity-log/domain/activity-modules.ts` and `activity-actions.ts`
- [x] T011 Implement Prisma mapper + repository in `src/modules/activity-log/infrastructure/mappers/activity-log.mapper.ts` and `activity-log.prisma-repository.ts`
- [x] T012 Implement `InMemoryActivityLogRepository` in `tests/setup/in-memory-repositories.ts` (or dedicated setup file)
- [x] T013 Implement `ActivityLogRecorder` (record → append; swallow/log failures; strip secret metadata keys) in `src/modules/activity-log/application/services/activity-log-recorder.service.ts`
- [x] T014 [P] Add shared recorder input type in `src/shared/activity-log/record-activity-log.input.ts` if used by producers
- [x] T015 Wire ActivityLog repository + recorder in `src/config/container.ts` (expose recorder for producer injection)
- [x] T016 [P] Unit tests for recorder (append mapping, secret stripping, failure isolation) in `tests/unit/activity-log/activity-log-recorder.test.ts`

**Checkpoint**: Append + query infrastructure and recorder ready.

---

## Phase 3: User Story 1 - Owner Reviews Company Activity History (Priority: P1) 🎯 MVP

**Goal**: Owners/Managers can list and get Company Activity Logs; Employees are denied; rows
include required fields and optional related resource identifiers.

**Independent Test**: Seed Activity Logs for a Company → Owner `GET /activity-logs` and
`GET /activity-logs/:id` succeed → Employee `403` → other-company get `404`.

### Tests for User Story 1

- [x] T017 [P] [US1] Unit tests for list/get use cases (company scope, 404 cross-company) in `tests/unit/activity-log/list-activity-logs.use-case.test.ts` and `get-activity-log.use-case.test.ts`
- [x] T018 [P] [US1] API tests for Owner/Manager list+get and Employee 403 in `tests/api/activity-log/activity-log-list.api.test.ts`

### Implementation for User Story 1

- [x] T019 [US1] Implement response DTOs / mappers in `src/modules/activity-log/application/dto/activity-log.response.ts`
- [x] T020 [US1] Implement `ListActivityLogsUseCase` (company scope, default `createdAt desc`, pagination) in `src/modules/activity-log/application/use-cases/list-activity-logs.use-case.ts`
- [x] T021 [US1] Implement `GetActivityLogUseCase` in `src/modules/activity-log/application/use-cases/get-activity-log.use-case.ts`
- [x] T022 [US1] Implement Zod schemas for list query (page/limit defaults) and id params in `src/modules/activity-log/presentation/activity-log.schemas.ts`
- [x] T023 [US1] Implement controller + routes `GET /activity-logs` and `GET /activity-logs/:activityLogId` with `authorize(['OWNER','MANAGER'])` in `activity-log.controller.ts` and `activity-log.routes.ts`
- [x] T024 [US1] Register activity-log routes (authn + company resolution + password gate) in `src/modules/index.ts`
- [x] T025 [US1] Wire list/get use cases into controller in `src/config/container.ts`
- [x] T026 [US1] Document list/get in `src/modules/activity-log/presentation/activity-log.openapi.ts` and `src/swagger/common-schemas.ts`; register in `openapi.builder.ts`

**Checkpoint**: MVP read API works with seeded/manual appends.

---

## Phase 4: User Story 4 - System Automatically Records Business Activities (Priority: P1)

**Goal**: On successful listed business operations, `ActivityLogRecorder.record` appends a row
(module/action/description/actor/resource); password events never store secrets; recorder
failures do not fail the business use case.

**Independent Test**: Login / create employee / pay transaction (or equivalent) → corresponding
Activity Log appears for the Company with expected action.

### Tests for User Story 4

- [x] T027 [P] [US4] API/unit event-generation tests for representative producers (auth login, employee create, transaction paid or create) in `tests/api/activity-log/activity-log-event-generation.api.test.ts`
- [x] T028 [P] [US4] Assert password change/reset Activity Logs omit secrets in `tests/unit/activity-log/activity-log-password-events.test.ts` (or extend API file)

### Implementation for User Story 4

- [x] T029 [US4] Instrument auth login/logout in `src/modules/auth/application/use-cases/login.use-case.ts` and `logout.use-case.ts`
- [x] T030 [P] [US4] Instrument password change/reset in `src/modules/user/application/use-cases/change-password.use-case.ts` and `src/modules/employee/application/use-cases/reset-employee-password.use-case.ts`
- [x] T031 [P] [US4] Instrument employee create/update/archive + account grant/disable in employee use cases under `src/modules/employee/application/use-cases/`
- [x] T032 [P] [US4] Instrument company update in `src/modules/company/application/use-cases/`
- [x] T033 [P] [US4] Instrument branch/warehouse/vehicle create (and vehicle update) under respective `application/use-cases/`
- [x] T034 [P] [US4] Instrument transaction lifecycle (create/update/submit/return-to-draft/paid/cancel) under `src/modules/transaction/application/use-cases/`
- [x] T035 [P] [US4] Instrument trip lifecycle under `src/modules/trip/application/use-cases/`
- [x] T036 [P] [US4] Instrument expense create/record/cancel under `src/modules/expense/application/use-cases/`
- [x] T037 [P] [US4] Instrument attendance time-in/out, leave recorded, cash advance created, payroll paid under workforce modules
- [x] T038 [US4] Ensure DI passes `ActivityLogRecorder` into all instrumented use cases in `src/config/container.ts`

**Checkpoint**: Listed taxonomy events generate persisted Activity Logs.

---

## Phase 5: User Story 2 - Manager Searches and Filters Activity Logs (Priority: P2)

**Goal**: Search by employee name, transaction/trip/expense number, user, action; filter by
module, action, user, date range, event type; invalid criteria → 400.

**Independent Test**: As Manager, `q` + `searchBy=transactionNumber` and filters return only
matches; bad date range → 400.

### Tests for User Story 2

- [x] T039 [P] [US2] Unit tests for search/filter composition in `tests/unit/activity-log/list-activity-logs-filters.use-case.test.ts`
- [x] T040 [P] [US2] API tests for search/filter validation and results in `tests/api/activity-log/activity-log-search-filter.api.test.ts`

### Implementation for User Story 2

- [x] T041 [US2] Extend list query DTO + Zod schema (`q`, `searchBy`, `module`, `action`, `userId`, `eventType`, `dateFrom`, `dateTo`) in `list-activity-logs.query.ts` and `activity-log.schemas.ts`
- [x] T042 [US2] Implement repository list filters/search (company-scoped) in `activity-log.prisma-repository.ts` and in-memory repo
- [x] T043 [US2] Wire filters through `ListActivityLogsUseCase`
- [x] T044 [US2] Update OpenAPI query params in `activity-log.openapi.ts`

**Checkpoint**: Search/filter usable for Managers/Owners.

---

## Phase 6: User Story 3 - Authorized User Sorts Activity Logs (Priority: P3)

**Goal**: Sort by `createdAt`, `module`, or `user` with `sortOrder`; unsupported sort → 400;
default newest first.

**Independent Test**: Seed rows with distinct modules/users/dates → sort queries reorder
correctly.

### Tests for User Story 3

- [x] T045 [P] [US3] Unit/API sort tests in `tests/unit/activity-log/list-activity-logs-sort.use-case.test.ts` and/or `tests/api/activity-log/activity-log-sort.api.test.ts`

### Implementation for User Story 3

- [x] T046 [US3] Extend Zod/schema + repository + use case for `sortBy`/`sortOrder` in `activity-log.schemas.ts`, prisma/in-memory repos, and `list-activity-logs.use-case.ts`
- [x] T047 [US3] Document sort params in `activity-log.openapi.ts`

**Checkpoint**: Full list query contract complete.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Immutability, tenant isolation, docs, quickstart alignment.

- [x] T048 [P] API tests asserting POST/PATCH/DELETE activity-logs unsupported in `tests/api/activity-log/activity-log-immutability.api.test.ts`
- [x] T049 [P] Tenant isolation API tests in `tests/api/activity-log/activity-log-tenant.api.test.ts`
- [x] T050 [P] Update Activity Logs section in `docs/api-reference.md`
- [x] T051 Align OpenAPI with `specs/013-activity-logs/contracts/openapi.yaml` in swagger files
- [x] T052 Run/fix scenarios from `specs/013-activity-logs/quickstart.md`
- [x] T053 [P] Smoke: password-change gate still allows Owners/Managers to hit activity-log GETs when flag false

**Checkpoint**: Feature ready for `/speckit-implement`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **US1 (Phase 3)**: Depends on Foundational — MVP read API
- **US4 (Phase 4)**: Depends on Foundational (recorder); can run in parallel with US1 after T015
- **US2 (Phase 5)**: Depends on US1 list endpoint
- **US3 (Phase 6)**: Depends on US1 list endpoint (can parallel US2 after schemas exist)
- **Polish (Phase 7)**: Depends on US1–US4 desired scope

### User Story Dependencies

- **US1 (P1)**: After Foundational only (seed appends for tests)
- **US4 (P1)**: After Foundational; independently testable via producer actions
- **US2 (P2)**: After US1 list route
- **US3 (P3)**: After US1 list route

### Parallel Opportunities

- Phase 1: T001–T005 [P]
- Phase 2: T010, T014, T016 [P] where marked
- US1 tests T017–T018 [P] then implement T019–T026
- US4 tests T027–T028 [P]; producer instrumentation T030–T037 [P] after recorder wired
- US2 tests T039–T040 [P] then T041–T044
- US3 T045 [P] then T046–T047
- Polish T048–T050, T053 [P]

### Parallel Example: User Story 4

```bash
# After ActivityLogRecorder is wired in container:
Task: "Instrument auth login/logout"
Task: "Instrument employee account use cases"
Task: "Instrument transaction lifecycle use cases"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 + Phase 2
2. Complete Phase 3 (US1) with seeded Activity Logs in tests
3. **STOP and VALIDATE** Owner list/get + Employee 403
4. Demo MVP

### Incremental Delivery

1. Setup + Foundational → persistence + recorder
2. US1 → read API (MVP)
3. US4 → automatic recording (makes logs real)
4. US2 → search/filter
5. US3 → sort
6. Polish → docs + isolation + immutability

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Dev A: US1 read API | Dev B: US4 producer instrumentation
3. Dev C: US2/US3 query enhancements after list exists

---

## Notes

- Follow plan **§1 Module Architecture** — event sink, not CRUD
- Recorder failures must not fail business use cases
- Never store passwords / temporary passwords in description or metadata
- `companyId` always from auth / producer context
- Keep existing Pino `*-audit.service` helpers; dual-emit with recorder
- Commit after each task or logical group
- Suggested MVP = Phase 1–3 only (US1)
