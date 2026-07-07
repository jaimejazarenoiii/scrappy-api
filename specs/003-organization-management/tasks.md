---
description: 'Task list for Organization Management feature'
---

# Tasks: P002 - Organization Management

**Input**: Design documents from `/specs/003-organization-management/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md; P001 (Company & Identity Foundation) implemented and passing

**Tests**: Included — the specification and plan require unit, integration, and API tests for branch/warehouse/vehicle lifecycle, authorization, validation, and tenant isolation.

**Organization**: Tasks are grouped by user story after P002 setup and foundational phases so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: `US1` = Manage Branches, `US2` = Manage Warehouses, `US3` = Manage Vehicles

## Path Conventions

P002 extends P001 modular Clean Architecture:

- **Modules**: `src/modules/{branch,warehouse,vehicle}/`
- **Shared**: `src/shared/organization/` (new), plus existing `src/shared/{tenant,policy,errors,http,pagination,audit}/`
- **Config**: `src/config/container.ts`, `src/modules/index.ts`
- **Middleware**: `src/middleware/` (reuse P001 auth, tenant, validation, authorization)
- **Validations**: `src/validations/`
- **Swagger**: `src/swagger/`
- **Tests**: `tests/unit/`, `tests/integration/`, `tests/api/`
- **Schema**: `prisma/schema.prisma`

---

## Phase 1: Setup (P002 Module Structure)

**Purpose**: Prepare module-oriented directory structure and test scaffolding for Organization Management without modifying P001 behavior.

- [x] T001 Create Clean Architecture subfolders for organization modules in `src/modules/{branch,warehouse,vehicle}/{domain,application,infrastructure,presentation}` and `src/shared/organization/`
- [x] T002 [P] Create organization test directories in `tests/unit/{branch,warehouse,vehicle}/`, `tests/integration/{branch,warehouse,vehicle}/`, and `tests/api/{branch,warehouse,vehicle}/`
- [x] T003 [P] Create organization module index placeholder files in `src/modules/branch/index.ts`, `src/modules/warehouse/index.ts`, and `src/modules/vehicle/index.ts`
- [x] T004 [P] Add organization resource naming and layering conventions to `src/database/README.md` referencing `specs/003-organization-management/data-model.md`

**Checkpoint**: Source tree supports three sibling organization modules and matching test layout.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish Prisma models, shared organization primitives, reusable validators, test factories, and in-memory repository support that all user stories depend on.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [x] T005 Add `BranchStatus`, `WarehouseStatus`, and `VehicleStatus` enums plus `Branch`, `Warehouse`, and `Vehicle` models with Company relations in `prisma/schema.prisma` per `data-model.md`
- [x] T006 Create Prisma migration for organization resources with partial unique indexes on `(companyId, name)` and `(companyId, plateNumber)` in `prisma/migrations/`
- [x] T007 [P] Create operational eligibility helper (`isOperationallyEligible`, `assertOperationallyEligible`) in `src/shared/organization/operational-eligibility.ts`
- [x] T008 [P] Create shared organization field validators (`nonEmptyStringSchema`, `contactNumberSchema`) in `src/validations/organization.schemas.ts`
- [x] T009 [P] Extend pagination query schema with optional `status` filter support for organization list endpoints in `src/validations/common-query.schemas.ts`
- [x] T010 [P] Create Branch test factory in `tests/factories/branch.factory.ts`
- [x] T011 [P] Create Warehouse test factory in `tests/factories/warehouse.factory.ts`
- [x] T012 [P] Create Vehicle test factory in `tests/factories/vehicle.factory.ts`
- [x] T013 [P] Add `InMemoryBranchRepository`, `InMemoryWarehouseRepository`, and `InMemoryVehicleRepository` to `tests/setup/in-memory-repositories.ts`
- [x] T014 Update test app bootstrap to register organization module routes and in-memory repositories in `tests/setup/test-app.ts`
- [x] T015 Register organization module route mount points (empty routers) in `src/modules/index.ts` to verify wiring before story implementation

**Checkpoint**: Database schema, shared eligibility rules, validators, factories, and test scaffolding are ready for story-level implementation.

---

## Phase 3: User Story 1 - Manage Branches (Priority: P1) 🎯 MVP

**Goal**: Allow Owner/Manager users to create, view, update, list, and archive Branch records within their Company while enforcing uniqueness, archive exclusion, and tenant isolation.

**Independent Test**: Create, view, update, list, and archive Branches for one Company; confirm archived Branches are excluded from default lists and cross-company access is rejected.

### Tests for User Story 1

- [x] T016 [P] [US1] Create unit tests for Branch entity lifecycle helpers (`isActive`, `isDeleted`, `isOperationallyEligible`) in `tests/unit/branch/branch.entity.test.ts`
- [x] T017 [P] [US1] Create unit tests for Branch business rules and duplicate-name detection in `tests/unit/branch/branch-rules.test.ts`
- [x] T018 [P] [US1] Create unit tests for create/get/update/archive/list Branch use cases with in-memory repository in `tests/unit/branch/branch.use-cases.test.ts`
- [x] T019 [P] [US1] Create repository integration tests for Branch CRUD, soft-delete filtering, and tenant scoping in `tests/integration/branch/branch.persistence.test.ts`
- [x] T020 [P] [US1] Create API tests for `POST /api/v1/branches`, `GET /api/v1/branches/{branchId}`, and `PATCH /api/v1/branches/{branchId}` in `tests/api/branch/branch-crud.api.test.ts`
- [x] T021 [P] [US1] Create API tests for `GET /api/v1/branches` pagination, search, sort, and status filter in `tests/api/branch/branch-list.api.test.ts`
- [x] T022 [P] [US1] Create API tests for `POST /api/v1/branches/{branchId}/archive`, duplicate-name conflicts, validation failures, and archived list exclusion in `tests/api/branch/branch-lifecycle.api.test.ts`
- [x] T023 [P] [US1] Create API tests for Owner/Manager mutation access vs Employee read-only and cross-company rejection in `tests/api/branch/branch-access.api.test.ts`

### Implementation for User Story 1

- [x] T024 [P] [US1] Create Branch domain entity with `toPrimitives()` and lifecycle helpers in `src/modules/branch/domain/branch.entity.ts`
- [x] T025 [P] [US1] Create Branch status enum and archive transition rules in `src/modules/branch/domain/branch-status.ts` and `src/modules/branch/domain/branch-rules.ts`
- [x] T026 [P] [US1] Create Branch repository interface with tenant-scoped CRUD, list, and uniqueness lookup methods in `src/modules/branch/domain/branch.repository.ts`
- [x] T027 [P] [US1] Create Branch request/response DTOs in `src/modules/branch/application/dto/create-branch.request.ts`, `src/modules/branch/application/dto/update-branch.request.ts`, and `src/modules/branch/application/dto/branch.response.ts`
- [x] T028 [P] [US1] Create Branch Zod schemas for create, update, archive params, and list query in `src/modules/branch/presentation/branch.schemas.ts`
- [x] T029 [US1] Implement Branch authorization policy for Owner/Manager write and Employee read in `src/modules/branch/application/policies/branch-authorization.policy.ts`
- [x] T030 [US1] Implement `CreateBranchUseCase` with duplicate-name and tenant checks in `src/modules/branch/application/use-cases/create-branch.use-case.ts`
- [x] T031 [US1] Implement `GetBranchUseCase` with archived-resource 404 behavior in `src/modules/branch/application/use-cases/get-branch.use-case.ts`
- [x] T032 [US1] Implement `UpdateBranchUseCase` with duplicate-name checks in `src/modules/branch/application/use-cases/update-branch.use-case.ts`
- [x] T033 [US1] Implement `ArchiveBranchUseCase` setting `deletedAt` and `status = INACTIVE` in `src/modules/branch/application/use-cases/archive-branch.use-case.ts`
- [x] T034 [US1] Implement `ListBranchesUseCase` with pagination, search, sort, status filter, and archived exclusion in `src/modules/branch/application/use-cases/list-branches.use-case.ts`
- [x] T035 [US1] Implement Branch audit event emitters for create/update/archive in `src/modules/branch/application/services/branch-audit.service.ts`
- [x] T036 [US1] Implement Prisma-to-domain mapper in `src/modules/branch/infrastructure/mappers/branch.mapper.ts`
- [x] T037 [US1] Implement Prisma Branch repository with tenant-safe queries and partial uniqueness handling in `src/modules/branch/infrastructure/branch.prisma-repository.ts`
- [x] T038 [US1] Implement Branch controller for create, get, update, archive, and list in `src/modules/branch/presentation/branch.controller.ts`
- [x] T039 [US1] Register Branch routes with auth, tenant, validation, and role guards in `src/modules/branch/presentation/branch.routes.ts`
- [x] T040 [US1] Register Branch module DI bindings and route wiring in `src/modules/branch/index.ts` and `src/config/container.ts`
- [x] T041 [US1] Add Branches tag, schemas, and route definitions to Swagger in `src/modules/branch/presentation/branch.openapi.ts` and `src/swagger/openapi.builder.ts`

**Checkpoint**: Branch CRUD + archive + list works with Owner/Manager write access, Employee read access, and same-tenant guarantees.

---

## Phase 4: User Story 2 - Manage Warehouses (Priority: P2)

**Goal**: Allow Owner/Manager users to manage Warehouse records within their Company with the same lifecycle, uniqueness, and tenant rules as Branches.

**Independent Test**: Create, view, update, list, and archive Warehouses for one Company; verify name uniqueness and archived exclusion from operational lists.

### Tests for User Story 2

- [x] T042 [P] [US2] Create unit tests for Warehouse entity and business rules in `tests/unit/warehouse/warehouse.entity.test.ts` and `tests/unit/warehouse/warehouse-rules.test.ts`
- [x] T043 [P] [US2] Create unit tests for Warehouse use cases with in-memory repository in `tests/unit/warehouse/warehouse.use-cases.test.ts`
- [x] T044 [P] [US2] Create repository integration tests for Warehouse CRUD, soft-delete, and tenant scoping in `tests/integration/warehouse/warehouse.persistence.test.ts`
- [x] T045 [P] [US2] Create API tests for Warehouse CRUD endpoints in `tests/api/warehouse/warehouse-crud.api.test.ts`
- [x] T046 [P] [US2] Create API tests for Warehouse list pagination, search, and filters in `tests/api/warehouse/warehouse-list.api.test.ts`
- [x] T047 [P] [US2] Create API tests for Warehouse archive, duplicate-name conflicts, validation, and access control in `tests/api/warehouse/warehouse-lifecycle.api.test.ts`

### Implementation for User Story 2

- [x] T048 [P] [US2] Create Warehouse domain entity, status enum, and rules in `src/modules/warehouse/domain/warehouse.entity.ts`, `src/modules/warehouse/domain/warehouse-status.ts`, and `src/modules/warehouse/domain/warehouse-rules.ts`
- [x] T049 [P] [US2] Create Warehouse repository interface in `src/modules/warehouse/domain/warehouse.repository.ts`
- [x] T050 [P] [US2] Create Warehouse DTOs and Zod schemas in `src/modules/warehouse/application/dto/` and `src/modules/warehouse/presentation/warehouse.schemas.ts`
- [x] T051 [US2] Implement Warehouse authorization policy in `src/modules/warehouse/application/policies/warehouse-authorization.policy.ts`
- [x] T052 [US2] Implement Warehouse use cases (create, get, update, archive, list) in `src/modules/warehouse/application/use-cases/`
- [x] T053 [US2] Implement Warehouse audit service in `src/modules/warehouse/application/services/warehouse-audit.service.ts`
- [x] T054 [US2] Implement Warehouse mapper and Prisma repository in `src/modules/warehouse/infrastructure/mappers/warehouse.mapper.ts` and `src/modules/warehouse/infrastructure/warehouse.prisma-repository.ts`
- [x] T055 [US2] Implement Warehouse controller and routes in `src/modules/warehouse/presentation/warehouse.controller.ts` and `src/modules/warehouse/presentation/warehouse.routes.ts`
- [x] T056 [US2] Register Warehouse module wiring in `src/modules/warehouse/index.ts`, `src/config/container.ts`, and `src/modules/index.ts`
- [x] T057 [US2] Add Warehouses tag, schemas, and route definitions to Swagger in `src/modules/warehouse/presentation/warehouse.openapi.ts` and `src/swagger/openapi.builder.ts`

**Checkpoint**: Warehouse management works independently with the same lifecycle and authorization patterns as Branches.

---

## Phase 5: User Story 3 - Manage Vehicles (Priority: P3)

**Goal**: Allow Owner/Manager users to maintain Vehicle records with plate-number uniqueness, status lifecycle, and operational eligibility rules.

**Independent Test**: Create, view, update, list, and archive Vehicles; validate plate uniqueness, status values (`AVAILABLE`, `IN_USE`, `MAINTENANCE`, `INACTIVE`), and archived exclusion.

### Tests for User Story 3

- [x] T058 [P] [US3] Create unit tests for Vehicle entity, status transitions, and operational eligibility in `tests/unit/vehicle/vehicle.entity.test.ts` and `tests/unit/vehicle/vehicle-rules.test.ts`
- [x] T059 [P] [US3] Create unit tests for Vehicle use cases with in-memory repository in `tests/unit/vehicle/vehicle.use-cases.test.ts`
- [x] T060 [P] [US3] Create repository integration tests for Vehicle CRUD, plate uniqueness, and tenant scoping in `tests/integration/vehicle/vehicle.persistence.test.ts`
- [x] T061 [P] [US3] Create API tests for Vehicle CRUD endpoints in `tests/api/vehicle/vehicle-crud.api.test.ts`
- [x] T062 [P] [US3] Create API tests for Vehicle list pagination, search, and status filter in `tests/api/vehicle/vehicle-list.api.test.ts`
- [x] T063 [P] [US3] Create API tests for Vehicle archive, duplicate plate conflicts, status validation, and access control in `tests/api/vehicle/vehicle-lifecycle.api.test.ts`

### Implementation for User Story 3

- [x] T064 [P] [US3] Create Vehicle domain entity, status enum, and rules in `src/modules/vehicle/domain/vehicle.entity.ts`, `src/modules/vehicle/domain/vehicle-status.ts`, and `src/modules/vehicle/domain/vehicle-rules.ts`
- [x] T065 [P] [US3] Create Vehicle repository interface in `src/modules/vehicle/domain/vehicle.repository.ts`
- [x] T066 [P] [US3] Create Vehicle DTOs and Zod schemas in `src/modules/vehicle/application/dto/` and `src/modules/vehicle/presentation/vehicle.schemas.ts`
- [x] T067 [US3] Implement Vehicle authorization policy in `src/modules/vehicle/application/policies/vehicle-authorization.policy.ts`
- [x] T068 [US3] Implement Vehicle use cases (create, get, update, archive, list) in `src/modules/vehicle/application/use-cases/`
- [x] T069 [US3] Implement Vehicle audit service in `src/modules/vehicle/application/services/vehicle-audit.service.ts`
- [x] T070 [US3] Implement Vehicle mapper and Prisma repository in `src/modules/vehicle/infrastructure/mappers/vehicle.mapper.ts` and `src/modules/vehicle/infrastructure/vehicle.prisma-repository.ts`
- [x] T071 [US3] Implement Vehicle controller and routes in `src/modules/vehicle/presentation/vehicle.controller.ts` and `src/modules/vehicle/presentation/vehicle.routes.ts`
- [x] T072 [US3] Register Vehicle module wiring in `src/modules/vehicle/index.ts`, `src/config/container.ts`, and `src/modules/index.ts`
- [x] T073 [US3] Add Vehicles tag, schemas, and route definitions to Swagger in `src/modules/vehicle/presentation/vehicle.openapi.ts` and `src/swagger/openapi.builder.ts`

**Checkpoint**: Vehicle management works independently with plate uniqueness, status lifecycle, and tenant isolation.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize OpenAPI alignment, CI coverage, documentation, and end-to-end validation for P002.

- [x] T074 [P] Register organization common error responses (duplicate, lifecycle conflict, scope violation) in `src/swagger/common-responses.ts` if not already covered
- [x] T075 [P] Add organization resource OpenAPI examples aligned with `specs/003-organization-management/contracts/openapi.yaml` in `src/swagger/common-examples.ts`
- [x] T076 Update CI workflow to include organization unit, integration, and API test suites in `.github/workflows/ci.yml`
- [x] T077 Update `README.md` with Organization Management endpoints and auth requirements for Branches, Warehouses, and Vehicles
- [x] T078 Run `npm run prisma:migrate`, `npm run build`, `npm run lint`, and `npm test` to verify full P002 suite passes
- [x] T079 Validate all quickstart scenarios and acceptance criteria in `specs/003-organization-management/quickstart.md`

**Checkpoint**: All 15 organization endpoints documented, tested, and passing acceptance criteria.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — **BLOCKS all user stories**
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion — **MVP deliverable**
- **User Story 2 (Phase 4)**: Depends on Foundational; mirrors US1 patterns — independently testable
- **User Story 3 (Phase 5)**: Depends on Foundational; mirrors US1/US2 patterns — independently testable
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: First deliverable after Foundational — no dependency on US2/US3
- **US2 (P2)**: Can start after Foundational; reuses shared validators and eligibility helpers from Phase 2
- **US3 (P3)**: Can start after Foundational; adds Vehicle-specific status rules only

### Within Each User Story

- Tests should be written before or alongside implementation for the same behavior
- Domain entities and repository interfaces come before use cases
- Use cases and policies come before controllers/routes
- Prisma repositories come after domain interfaces and before controller integration
- Swagger integration follows route registration

### Parallel Opportunities

- **Phase 1**: T002–T004 can run in parallel after T001
- **Phase 2**: T007–T013 can run in parallel after T005–T006
- **US1**: T016–T023 (tests) and T024–T028 (domain/DTOs) can run in parallel; use cases T030–T034 follow
- **US2**: T042–T047 (tests) and T048–T050 (domain/DTOs) can run in parallel; US2 can start in parallel with US1 once Foundational completes if staffed separately
- **US3**: T058–T063 (tests) and T064–T066 (domain/DTOs) can run in parallel; US3 can run in parallel with US1/US2 after Foundational
- **Polish**: T074–T075 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch Branch tests in parallel:
Task T016: "Unit tests for Branch entity in tests/unit/branch/branch.entity.test.ts"
Task T018: "Unit tests for Branch use cases in tests/unit/branch/branch.use-cases.test.ts"
Task T020: "API tests for Branch CRUD in tests/api/branch/branch-crud.api.test.ts"
Task T023: "API tests for Branch access control in tests/api/branch/branch-access.api.test.ts"

# Launch Branch domain artifacts in parallel:
Task T024: "Branch entity in src/modules/branch/domain/branch.entity.ts"
Task T025: "Branch status and rules in src/modules/branch/domain/branch-status.ts and branch-rules.ts"
Task T026: "Branch repository interface in src/modules/branch/domain/branch.repository.ts"
Task T027: "Branch DTOs in src/modules/branch/application/dto/"
Task T028: "Branch Zod schemas in src/modules/branch/presentation/branch.schemas.ts"
```

---

## Parallel Example: Cross-Story Delivery

```bash
# After Phase 2 completes, three developers can work in parallel:
Developer A: Phase 3 (US1 Branches) — T016 through T041
Developer B: Phase 4 (US2 Warehouses) — T042 through T057
Developer C: Phase 5 (US3 Vehicles) — T058 through T073

# Each story is independently testable via its own API suite and factories.
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Branches)
4. **STOP and VALIDATE**: Run Branch quickstart scenarios and confirm archive exclusion + tenant isolation
5. Demo Branch management as first organization milestone

### Incremental Delivery

1. Setup + Foundational → organization platform primitives ready
2. Add US1 (Branches) → location management MVP
3. Add US2 (Warehouses) → storage facility management
4. Add US3 (Vehicles) → fleet resource management
5. Polish → docs, CI, and full acceptance validation

### Parallel Team Strategy

With multiple developers after Foundational:

- Developer A: US1 Branch module end-to-end
- Developer B: US2 Warehouse module end-to-end
- Developer C: US3 Vehicle module end-to-end
- Converge in Polish phase for CI and quickstart validation

---

## Notes

- Reuse P001 middleware, error codes, API envelope, pagination, and auth patterns — do not redefine
- Every repository query MUST filter by `companyId` from authenticated tenant context
- Archive sets `deletedAt` and inactive status; no hard deletes
- Default list queries exclude archived records (`deletedAt IS NULL`)
- Get-by-id returns 404 for archived resources (per plan decision)
- Employee role: read-only (list + get); Owner/Manager: full CRUD + archive
- Do NOT implement employee assignment, trips, transactions, or expenses in P002
- Align Swagger output with `specs/003-organization-management/contracts/openapi.yaml`
- Total tasks: **79**
