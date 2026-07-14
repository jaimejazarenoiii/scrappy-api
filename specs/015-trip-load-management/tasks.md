---
description: 'Task list for P006 Addendum - Trip Load Management'
---

# Tasks: P006 Addendum — Trip Load Management

**Input**: Design documents from `/specs/015-trip-load-management/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml,
quickstart.md; P001–P011 implemented and passing

**Tests**: Included — plan §13 and engineering acceptance criteria require Vitest unit tests and
Supertest API coverage for lifecycle, remaining quantity, outbound validation, and authorization.

**Organization**: Extend `src/modules/trip/` with TripLoad aggregate children + transaction-create
hook. Foundational schema and domain calc/validation helpers block all stories.
US1 (Draft load CRUD) is MVP; US4 depends on US1 + Started trips; US5 validates lock after complete.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: `US1` = Draft optional load CRUD, `US2` = Validation config / enable flags,
  `US3` = Employee read + remaining summary, `US4` = Outbound sell validation,
  `US5` = Read-only after complete/cancel

## Path Conventions

- **Trip module**: `src/modules/trip/{domain,application,infrastructure,presentation}/`
- **Transaction hook**: `src/modules/transaction/application/use-cases/create-transaction.use-case.ts`
- **DI / routes**: `src/config/container.ts`, `src/modules/index.ts`
- **Schema**: `prisma/schema.prisma`, `prisma/migrations/`
- **Swagger**: `src/swagger/common-schemas.ts`, `src/swagger/openapi.builder.ts`
- **Docs**: `docs/api-reference.md`
- **Tests**: `tests/unit/trip/`, `tests/api/trip/`, `tests/setup/`

---

## Phase 1: Setup (Shared Scaffolding)

**Purpose**: Create trip-load placeholders and test dirs without changing runtime behavior.

- [x] T001 [P] Create domain placeholders in `src/modules/trip/domain/trip-load.entity.ts`, `trip-load-item.entity.ts`, `trip-load.repository.ts`, `material-name.ts`, and `remaining-quantity.service.ts`
- [x] T002 [P] Create application placeholders for DTOs, `trip-load-validation.service.ts`, and use-case stubs under `src/modules/trip/application/`
- [x] T003 [P] Create presentation placeholders in `src/modules/trip/presentation/trip-load.controller.ts`, `trip-load.routes.ts`, `trip-load.schemas.ts`, and `trip-load.openapi.ts`
- [x] T004 [P] Create infrastructure placeholders in `src/modules/trip/infrastructure/trip-load.prisma-repository.ts` and `mappers/trip-load.mapper.ts`
- [x] T005 [P] Create test directories `tests/unit/trip/` (if needed) and `tests/api/trip/load/` (or extend existing trip API test folder)

**Checkpoint**: Scaffolding ready for schema and domain work.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema extensions, domain pure helpers, repository, Trip entity fields — required
before any user story.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [x] T006 Add `loadEnabled` and `strictLoadValidation` (bool defaults false) to Trip in `prisma/schema.prisma` and extend trip domain entity/mapper/repository in `src/modules/trip/`
- [x] T007 Add `TripLoad` and `TripLoadItem` models/indexes/unique `tripId` per `data-model.md` in `prisma/schema.prisma`
- [x] T008 Create Prisma migration in `prisma/migrations/` for Trip flags + TripLoad + TripLoadItem
- [x] T009 [P] Implement material name normalize/unique helpers in `src/modules/trip/domain/material-name.ts`
- [x] T010 [P] Implement remaining quantity pure calc in `src/modules/trip/domain/remaining-quantity.service.ts` (loaded − Σ outbound weights)
- [x] T011 Implement `TripLoadEntity` / `TripLoadItemEntity` in `src/modules/trip/domain/trip-load.entity.ts` and `trip-load-item.entity.ts`
- [x] T012 Implement `TripLoadRepository` interface (create, findByTripId, update, delete, item CRUD) in `src/modules/trip/domain/trip-load.repository.ts`
- [x] T013 Implement Prisma mapper + repository in `src/modules/trip/infrastructure/mappers/trip-load.mapper.ts` and `trip-load.prisma-repository.ts`
- [x] T014 Extend in-memory trip fixtures / add `InMemoryTripLoadRepository` in `tests/setup/` for load flags + load/items
- [x] T015 [P] Add Trip Load Activity Log action taxonomy in `src/modules/activity-log/domain/activity-actions.ts` and `src/shared/audit/activity-log-bridge.ts`
- [x] T016 [P] Unit tests for material-name + remaining-quantity in `tests/unit/trip/material-name.test.ts` and `remaining-quantity.service.test.ts`
- [x] T017 Wire `TripLoadRepository` in `src/config/container.ts` (stub controller wiring deferred to stories)

**Checkpoint**: Persistence and pure domain helpers ready.

---

## Phase 3: User Story 1 - Manager Creates Optional Trip Load on Draft Trip (Priority: P1) 🎯 MVP

**Goal**: Managers/Owners create, edit, and remove Trip Load + items on Draft trips; trips may
start with no load. Feature always available (no Company enable gate).

**Independent Test**: POST load with items on Draft → 201; second create → conflict; start trip
without load → success; after start, POST items → rejected (partial lock check).

### Tests for User Story 1

- [x] T018 [P] [US1] Unit tests for create/update/delete load use cases in `tests/unit/trip/create-trip-load.use-case.test.ts` (and related)
- [x] T019 [P] [US1] API tests for Draft load CRUD + unique materials + authz in `tests/api/trip/trip-load-draft.api.test.ts`

### Implementation for User Story 1

- [x] T020 [US1] Implement load request/response DTOs in `src/modules/trip/application/dto/`
- [x] T021 [US1] Implement `CreateTripLoadUseCase`, `GetTripLoadUseCase`, `UpdateTripLoadUseCase`, `DeleteTripLoadUseCase` under `src/modules/trip/application/use-cases/`
- [x] T022 [US1] Implement `AddTripLoadItemUseCase`, `UpdateTripLoadItemUseCase`, `RemoveTripLoadItemUseCase` under `src/modules/trip/application/use-cases/`
- [x] T023 [US1] Implement Zod schemas for load/items in `src/modules/trip/presentation/trip-load.schemas.ts`
- [x] T024 [US1] Implement controller handlers + routes for load CRUD/items in `trip-load.controller.ts` and `trip-load.routes.ts`
- [x] T025 [US1] Register trip-load routes in `src/modules/index.ts` / trip route mount; wire controller in `src/config/container.ts`
- [x] T026 [US1] Ensure create load sets `Trip.loadEnabled = true`; delete may set `loadEnabled = false` per plan
- [x] T027 [US1] Emit Activity Logs for load create/update/delete/item mutations via trip audit helper
- [x] T028 [US1] Add OpenAPI paths for create/get/patch/delete load + items in `trip-load.openapi.ts` and `src/swagger/common-schemas.ts`

**Checkpoint**: Optional Draft load CRUD works; start without load unaffected.

---

## Phase 4: User Story 2 - Owner Configures Trip Load Validation (Priority: P2)

**Goal**: Enable/disable load on Draft; set `strictLoadValidation`; company defaults for
`defaultStrictLoadValidation` (no Company feature kill switch).

**Independent Test**: Enable with strict true → flags set; disable clears load; company settings
PATCH; create load still works with validation off/on.

### Tests for User Story 2

- [x] T029 [P] [US2] Unit tests for enable/disable use cases in `tests/unit/trip/enable-trip-load.use-case.test.ts` and `disable-trip-load.use-case.test.ts`
- [x] T030 [P] [US2] API tests for enable/disable + company settings in `tests/api/trip/trip-load-enable-settings.api.test.ts`

### Implementation for User Story 2

- [x] T031 [US2] Implement `EnableTripLoadUseCase` and `DisableTripLoadUseCase` in `src/modules/trip/application/use-cases/`
- [x] T032 [US2] Add Zod + routes `POST .../load/enable` and `POST .../load/disable` in presentation layer
- [x] T033 [US2] Add Company defaults field(s) + GET/PATCH `/companies/me/trip-load-settings` (Owner/Manager) under trip or company presentation
- [x] T034 [US2] Apply company `defaultStrictLoadValidation` when enabling load if not overridden
- [x] T035 [US2] Update OpenAPI for enable/disable/settings; Activity Log for enable/disable

**Checkpoint**: Form toggle + strict default configuration available.

---

## Phase 5: User Story 3 - Employee Views Load and Remaining Quantities (Priority: P3)

**Goal**: Assigned Employees (and Managers/Owners) view load detail and summary with calculated
remaining quantities; Employees cannot mutate.

**Independent Test**: After outbound sales on Started trip, summary remaining matches formula;
non-member GET → 403; Employee POST → 403.

### Tests for User Story 3

- [x] T036 [P] [US3] Unit tests for `GetTripLoadSummaryUseCase` in `tests/unit/trip/get-trip-load-summary.use-case.test.ts`
- [x] T037 [P] [US3] API tests for GET load/summary authz + remaining in `tests/api/trip/trip-load-summary.api.test.ts`

### Implementation for User Story 3

- [x] T038 [US3] Implement `GetTripLoadSummaryUseCase` summing outbound `TransactionItem.weight` by material/unit in `src/modules/trip/application/use-cases/get-trip-load-summary.use-case.ts`
- [x] T039 [US3] Enrich GET load responses with remaining when Started/Completed where applicable
- [x] T040 [US3] Enforce Employee assignment check on GET load/summary (reuse trip member authorization)
- [x] T041 [US3] Add `GET .../load/summary` route + OpenAPI schema `TripLoadSummary`

**Checkpoint**: Read/remaining surface complete for field users.

---

## Phase 6: User Story 4 - Validation on Outbound Sales (Priority: P4)

**Goal**: When `loadEnabled` and matching load item, outbound creates either block (strict) or
warn (non-strict). Inbound never validates against load.

**Independent Test**: Strict trip: sell > loaded → rejected; non-strict → success + warning;
inbound matching material → ok; unmatched material → no load validation.

### Tests for User Story 4

- [x] T042 [P] [US4] Unit tests for `TripLoadValidationService` in `tests/unit/trip/trip-load-validation.service.test.ts`
- [x] T043 [P] [US4] API tests for outbound block/warn and inbound skip in `tests/api/trip/trip-load-outbound-validation.api.test.ts`

### Implementation for User Story 4

- [x] T044 [US4] Implement `TripLoadValidationService` in `src/modules/trip/application/services/trip-load-validation.service.ts`
- [x] T045 [US4] Inject and invoke validation from `src/modules/transaction/application/use-cases/create-transaction.use-case.ts` for OUTBOUND (+ item updates if create path only)
- [x] T046 [US4] Ensure warn mode returns success envelope with warning meta without failing persist
- [x] T047 [US4] Document transaction create warning + block errors in OpenAPI / auth or trip-load docs

**Checkpoint**: Oversell protection wired into transaction create.

---

## Phase 7: User Story 5 - Load Becomes Read-Only After Trip Ends (Priority: P5)

**Goal**: Started/Completed/Cancelled trips reject all load mutations; history preserved for GET.

**Independent Test**: Complete trip with load → PATCH/DELETE/POST items → 409; GET/summary still
200 with historical remaining.

### Tests for User Story 5

- [x] T048 [P] [US5] API tests for post-complete/cancel immutability in `tests/api/trip/trip-load-lifecycle-lock.api.test.ts`

### Implementation for User Story 5

- [x] T049 [US5] Centralize Draft-only guard in shared trip-load policy helper used by all mutators in `src/modules/trip/application/policies/` or services
- [x] T050 [US5] Verify start/complete/cancel trip flows leave load readable; add regression assertions if missing
- [x] T051 [US5] Confirm Cancelled Draft trips with load are read-only for mutations

**Checkpoint**: Lifecycle lock matches P006 + load addendum.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Docs, swagger alignment, quickstart, regression.

- [x] T052 [P] Update Trip Load section in `docs/api-reference.md`
- [x] T053 Align Swagger builder with `specs/015-trip-load-management/contracts/openapi.yaml`
- [x] T054 [P] Cross-company 404/403 matrix tests in `tests/api/trip/trip-load-authz-tenant.api.test.ts`
- [x] T055 Run/confirm quickstart scenarios A–F from `specs/015-trip-load-management/quickstart.md`
- [x] T056 [P] Large TripLoad smoke (e.g. 50 items) create + summary in API or unit test
- [x] T057 Ensure trip DTOs/OpenAPI expose `loadEnabled` and `strictLoadValidation` on trip detail responses in trip presentation layer

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Immediate
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **US1 (Phase 3)**: After Foundational — MVP Draft load
- **US2 (Phase 4)**: After Foundational (ideally after US1 for enable+create e2e)
- **US3 (Phase 5)**: After US1 (needs load rows); remaining needs outbound txs (can stub unit)
- **US4 (Phase 6)**: After US1 + US2 flags; Started trip + transaction create
- **US5 (Phase 7)**: After US1; validates complete/cancel with US4 optional
- **Polish (Phase 8)**: After desired stories

### User Story Dependencies

```text
Foundational
    ├── US1 Draft load CRUD (MVP)
    ├── US2 Enable/disable + settings ──┐
    ├── US3 Summary / Employee read ────┤ (after US1)
    ├── US4 Outbound validation ────────┘ (needs US1+US2)
    └── US5 Lifecycle lock (after US1)
```

### Parallel Opportunities

- Phase 1: T001–T005 all [P]
- Phase 2: T009, T010, T015, T016 [P] after schema decisions
- Within stories: unit + API test tasks [P]
- US3 summary work can start once US1 create exists, parallel to US2 settings

---

## Parallel Example: User Story 1

```bash
# Tests in parallel:
Task: "Unit tests in tests/unit/trip/create-trip-load.use-case.test.ts"
Task: "API tests in tests/api/trip/trip-load-draft.api.test.ts"

# After use cases:
Task: "Zod schemas in trip-load.schemas.ts"
Task: "OpenAPI in trip-load.openapi.ts"
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1 Setup
2. Phase 2 Foundational
3. Phase 3 US1 Draft load CRUD
4. **STOP and VALIDATE** — start trip without load still works
5. Demo: Manager attaches optional load on Draft

### Incremental Delivery

1. US1 → optional Draft loads
2. US2 → enable/disable + strict defaults
3. US3 → remaining summary for field staff
4. US4 → outbound block/warn
5. US5 → hard lifecycle lock verification
6. Polish → docs + quickstart

### Suggested MVP Scope

**US1 + Foundational** is the minimum shippable optional load capture.
**US2 + US4** should follow for validation value.

---

## Notes

- [P] = different files, no incomplete-task dependencies
- Always-on product: no Company feature enable/disable — only per-trip `loadEnabled`
- Quantity on load vs Σ `TransactionItem.weight` for outbound (see research.md)
- Strict = block; non-strict = warn on exceed
- Inbound never uses Trip Load validation
- Commit after each task or logical group
