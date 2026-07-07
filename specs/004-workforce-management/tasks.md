---
description: 'Task list for Workforce Management feature'
---

# Tasks: P003 - Workforce Management

**Input**: Design documents from `/specs/004-workforce-management/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md; P001 (Company & Identity Foundation) and P002 (Organization Management) implemented and passing

**Tests**: Included — the specification and plan require unit, integration, and API tests for attendance, leave, cash advances, payroll, dashboard visibility, authorization, validation, and tenant isolation.

**Organization**: Tasks are grouped by user story after P003 setup and foundational phases so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: `US1` = Attendance, `US2` = Leave, `US3` = Cash Advances, `US4` = Payroll, `US5` = Dashboard

## Path Conventions

P003 extends P001/P002 modular Clean Architecture:

- **Modules**: `src/modules/{attendance,leave,cash-advance,payroll,workforce-dashboard}/`
- **Shared**: `src/shared/workforce/` (new), plus existing `src/shared/{tenant,policy,errors,http,pagination,audit}/`
- **Config**: `src/config/container.ts`, `src/modules/index.ts`
- **Middleware**: `src/middleware/` (reuse P001 auth, tenant, validation, authorization)
- **Validations**: `src/validations/`
- **Swagger**: `src/swagger/`
- **Tests**: `tests/unit/`, `tests/integration/`, `tests/api/`
- **Schema**: `prisma/schema.prisma`

---

## Phase 1: Setup (P003 Module Structure)

**Purpose**: Prepare module-oriented directory structure and test scaffolding for Workforce Management without modifying P001/P002 behavior.

- [x] T001 Create Clean Architecture subfolders for workforce modules in `src/modules/{attendance,leave,cash-advance,payroll,workforce-dashboard}/{domain,application,infrastructure,presentation}` and `src/shared/workforce/`
- [x] T002 [P] Create workforce test directories in `tests/unit/{attendance,leave,cash-advance,payroll,workforce-dashboard}/`, `tests/integration/{attendance,leave,cash-advance,payroll}/`, and `tests/api/{attendance,leave,cash-advance,payroll,workforce-dashboard}/`
- [x] T003 [P] Create workforce module index placeholder files in `src/modules/attendance/index.ts`, `src/modules/leave/index.ts`, `src/modules/cash-advance/index.ts`, `src/modules/payroll/index.ts`, and `src/modules/workforce-dashboard/index.ts`
- [x] T004 [P] Add workforce resource naming and layering conventions to `src/database/README.md` referencing `specs/004-workforce-management/data-model.md`

**Checkpoint**: Source tree supports five sibling workforce modules and matching test layout.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish Prisma models, shared workforce primitives, reusable validators, test factories, and in-memory repository support that all user stories depend on.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [x] T005 Add `AttendanceSessionStatus`, `LeaveType`, `LeaveStatus`, `CashAdvanceStatus`, and `PayrollStatus` enums plus `AttendanceSession`, `LeaveRecord`, `CashAdvance`, and `PayrollRecord` models with Company and Employee relations in `prisma/schema.prisma` per `data-model.md`
- [x] T006 Create Prisma migration for workforce resources with unique constraint on `(companyId, employeeId, payPeriodStart)` and attendance indexes in `prisma/migrations/`
- [x] T007 [P] Create operational readiness helper (`isOperationallyReady`) in `src/shared/workforce/operational-readiness.ts`
- [x] T008 [P] Create employee context resolver (`resolveActingEmployeeId`) in `src/shared/workforce/employee-context.ts`
- [x] T009 [P] Create weekly pay period validator (`validatePayPeriod`, `isWeeklyPeriod`) in `src/shared/workforce/pay-period.ts`
- [x] T010 [P] Create shared workforce field validators (`positiveAmountSchema`, `leaveTypeSchema`, `optionalNoteSchema`) in `src/validations/workforce.schemas.ts`
- [x] T011 [P] Extend pagination query schemas with workforce list filters (`attendanceListQuerySchema`, `leaveListQuerySchema`, `cashAdvanceListQuerySchema`, `payrollListQuerySchema`) in `src/validations/common-query.schemas.ts`
- [x] T012 [P] Create Attendance test factory in `tests/factories/attendance.factory.ts`
- [x] T013 [P] Create Leave test factory in `tests/factories/leave.factory.ts`
- [x] T014 [P] Create Cash Advance test factory in `tests/factories/cash-advance.factory.ts`
- [x] T015 [P] Create Payroll test factory in `tests/factories/payroll.factory.ts`
- [x] T016 [P] Add `InMemoryAttendanceRepository`, `InMemoryLeaveRepository`, `InMemoryCashAdvanceRepository`, and `InMemoryPayrollRepository` to `tests/setup/in-memory-repositories.ts`
- [x] T017 Update test app bootstrap to register workforce module routes and in-memory repositories in `tests/setup/test-app.ts`
- [x] T018 Register workforce module route mount points under `/api/v1/workforce` (empty routers) in `src/modules/index.ts` to verify wiring before story implementation

**Checkpoint**: Database schema, shared workforce primitives, validators, factories, and test scaffolding are ready for story-level implementation.

---

## Phase 3: User Story 1 - Employee Attendance and Operational Readiness (Priority: P1) 🎯 MVP

**Goal**: Allow Employees to Time In, Time Out, view attendance status and history, and enable Managers/Owners to view and manage company attendance records while enforcing one open session per Employee and archived-employee rejection.

**Independent Test**: An active Employee Times In, views current status, Times Out, retrieves attendance history; double Time In/Out and archived Employee Time In are rejected; Manager lists company attendance.

### Tests for User Story 1

- [x] T019 [P] [US1] Create unit tests for AttendanceSession entity lifecycle helpers (`isOpen`, `isClosed`, `close`) in `tests/unit/attendance/attendance.entity.test.ts`
- [x] T020 [P] [US1] Create unit tests for attendance business rules (single open session, archived employee rejection) in `tests/unit/attendance/attendance-rules.test.ts`
- [x] T021 [P] [US1] Create unit tests for Time In, Time Out, status, list, and manage attendance use cases with in-memory repository in `tests/unit/attendance/attendance.use-cases.test.ts`
- [x] T022 [P] [US1] Create repository integration tests for AttendanceSession CRUD, open-session lookup, and tenant scoping in `tests/integration/attendance/attendance.persistence.test.ts`
- [x] T023 [P] [US1] Create API tests for `POST /api/v1/workforce/attendance/time-in` and `POST /api/v1/workforce/attendance/time-out` in `tests/api/attendance/attendance-time.api.test.ts`
- [x] T024 [P] [US1] Create API tests for `GET /api/v1/workforce/attendance/status` and `GET /api/v1/workforce/attendance` history in `tests/api/attendance/attendance-history.api.test.ts`
- [x] T025 [P] [US1] Create API tests for `GET /api/v1/workforce/attendance/company` and `PATCH /api/v1/workforce/attendance/{attendanceId}` in `tests/api/attendance/attendance-manage.api.test.ts`
- [x] T026 [P] [US1] Create API tests for attendance conflict scenarios, archived employee rejection, and cross-company access in `tests/api/attendance/attendance-access.api.test.ts`

### Implementation for User Story 1

- [x] T027 [P] [US1] Create AttendanceSession domain entity with `toPrimitives()` and lifecycle helpers in `src/modules/attendance/domain/attendance-session.entity.ts`
- [x] T028 [P] [US1] Create attendance status enum and session rules in `src/modules/attendance/domain/attendance-status.ts` and `src/modules/attendance/domain/attendance-rules.ts`
- [x] T029 [P] [US1] Create AttendanceSession repository interface with open-session lookup, tenant-scoped list, and manage methods in `src/modules/attendance/domain/attendance-session.repository.ts`
- [x] T030 [P] [US1] Create attendance request/response DTOs in `src/modules/attendance/application/dto/time-in.request.ts`, `src/modules/attendance/application/dto/time-out.request.ts`, `src/modules/attendance/application/dto/manage-attendance.request.ts`, and `src/modules/attendance/application/dto/attendance.response.ts`
- [x] T031 [P] [US1] Create attendance Zod schemas for Time In, Time Out, manage, status, and list query in `src/modules/attendance/presentation/attendance.schemas.ts`
- [x] T032 [US1] Implement attendance authorization policy for Employee self-service and Manager/Owner company access in `src/modules/attendance/application/policies/attendance-authorization.policy.ts`
- [x] T033 [US1] Implement `TimeInUseCase` with open-session and archived-employee checks in `src/modules/attendance/application/use-cases/time-in.use-case.ts`
- [x] T034 [US1] Implement `TimeOutUseCase` with no-open-session rejection in `src/modules/attendance/application/use-cases/time-out.use-case.ts`
- [x] T035 [US1] Implement `GetAttendanceStatusUseCase` in `src/modules/attendance/application/use-cases/get-attendance-status.use-case.ts`
- [x] T036 [US1] Implement `ListMyAttendanceUseCase` with pagination and date filters in `src/modules/attendance/application/use-cases/list-my-attendance.use-case.ts`
- [x] T037 [US1] Implement `ListCompanyAttendanceUseCase` with employee filter in `src/modules/attendance/application/use-cases/list-company-attendance.use-case.ts`
- [x] T038 [US1] Implement `ManageAttendanceUseCase` for manager corrections in `src/modules/attendance/application/use-cases/manage-attendance.use-case.ts`
- [x] T039 [US1] Implement attendance audit event emitters for Time In, Time Out, and manage in `src/modules/attendance/application/services/attendance-audit.service.ts`
- [x] T040 [US1] Implement Prisma-to-domain mapper in `src/modules/attendance/infrastructure/mappers/attendance-session.mapper.ts`
- [x] T041 [US1] Implement Prisma AttendanceSession repository with open-session lookup and tenant-safe queries in `src/modules/attendance/infrastructure/attendance-session.prisma-repository.ts`
- [x] T042 [US1] Implement attendance controller for Time In, Time Out, status, list, company list, and manage in `src/modules/attendance/presentation/attendance.controller.ts`
- [x] T043 [US1] Register attendance routes with auth, tenant, validation, and role guards in `src/modules/attendance/presentation/attendance.routes.ts`
- [x] T044 [US1] Register attendance module DI bindings and route wiring in `src/modules/attendance/index.ts` and `src/config/container.ts`
- [x] T045 [US1] Add Attendance tag, schemas, and route definitions to Swagger in `src/modules/attendance/presentation/attendance.openapi.ts` and `src/swagger/openapi.builder.ts`

**Checkpoint**: Attendance Time In/Out, status, history, and company management work with conflict rules and tenant isolation.

---

## Phase 4: User Story 2 - Leave Requests and History (Priority: P2)

**Goal**: Allow Employees to request Half Day or Full Day leave and view history; allow Managers/Owners to view and manage company leave records with overlap rejection.

**Independent Test**: Employee submits leave request, views history, duplicate same-date leave rejected; Manager lists company leave and updates status.

### Tests for User Story 2

- [x] T046 [P] [US2] Create unit tests for LeaveRecord entity and overlap rules in `tests/unit/leave/leave.entity.test.ts` and `tests/unit/leave/leave-rules.test.ts`
- [x] T047 [P] [US2] Create unit tests for request, list, and manage leave use cases with in-memory repository in `tests/unit/leave/leave.use-cases.test.ts`
- [x] T048 [P] [US2] Create repository integration tests for LeaveRecord CRUD, overlap detection, and tenant scoping in `tests/integration/leave/leave.persistence.test.ts`
- [x] T049 [P] [US2] Create API tests for `POST /api/v1/workforce/leave` and `GET /api/v1/workforce/leave` in `tests/api/leave/leave-request.api.test.ts`
- [x] T050 [P] [US2] Create API tests for `GET /api/v1/workforce/leave/company` and `PATCH /api/v1/workforce/leave/{leaveId}` in `tests/api/leave/leave-manage.api.test.ts`
- [x] T051 [P] [US2] Create API tests for leave overlap conflicts, validation failures, and cross-company access in `tests/api/leave/leave-access.api.test.ts`

### Implementation for User Story 2

- [x] T052 [P] [US2] Create LeaveRecord domain entity, status enum, and overlap rules in `src/modules/leave/domain/leave-record.entity.ts`, `src/modules/leave/domain/leave-status.ts`, and `src/modules/leave/domain/leave-rules.ts`
- [x] T053 [P] [US2] Create LeaveRecord repository interface with overlap lookup and tenant-scoped list in `src/modules/leave/domain/leave-record.repository.ts`
- [x] T054 [P] [US2] Create leave request/response DTOs and Zod schemas in `src/modules/leave/application/dto/` and `src/modules/leave/presentation/leave.schemas.ts`
- [x] T055 [US2] Implement leave authorization policy in `src/modules/leave/application/policies/leave-authorization.policy.ts`
- [x] T056 [US2] Implement `RequestLeaveUseCase` with overlap rejection in `src/modules/leave/application/use-cases/request-leave.use-case.ts`
- [x] T057 [US2] Implement `ListMyLeaveUseCase` and `ListCompanyLeaveUseCase` in `src/modules/leave/application/use-cases/list-my-leave.use-case.ts` and `src/modules/leave/application/use-cases/list-company-leave.use-case.ts`
- [x] T058 [US2] Implement `ManageLeaveUseCase` for status and manager note updates in `src/modules/leave/application/use-cases/manage-leave.use-case.ts`
- [x] T059 [US2] Implement leave audit service in `src/modules/leave/application/services/leave-audit.service.ts`
- [x] T060 [US2] Implement leave mapper and Prisma repository in `src/modules/leave/infrastructure/mappers/leave-record.mapper.ts` and `src/modules/leave/infrastructure/leave-record.prisma-repository.ts`
- [x] T061 [US2] Implement leave controller and routes in `src/modules/leave/presentation/leave.controller.ts` and `src/modules/leave/presentation/leave.routes.ts`
- [x] T062 [US2] Register leave module wiring in `src/modules/leave/index.ts`, `src/config/container.ts`, and `src/modules/index.ts`
- [x] T063 [US2] Add Leave tag, schemas, and route definitions to Swagger in `src/modules/leave/presentation/leave.openapi.ts` and `src/swagger/openapi.builder.ts`

**Checkpoint**: Leave request, history, company list, and manager status updates work with overlap rejection.

---

## Phase 5: User Story 3 - Cash Advances (Priority: P3)

**Goal**: Allow Managers/Owners to create cash advances for Employees and allow scoped history views (Employee own records, Manager/Owner company-wide).

**Independent Test**: Manager creates cash advance for Employee; Employee views only own advances; Employee cannot create advances.

### Tests for User Story 3

- [x] T064 [P] [US3] Create unit tests for CashAdvance entity and balance rules in `tests/unit/cash-advance/cash-advance.entity.test.ts` and `tests/unit/cash-advance/cash-advance-rules.test.ts`
- [x] T065 [P] [US3] Create unit tests for create and list cash advance use cases with in-memory repository in `tests/unit/cash-advance/cash-advance.use-cases.test.ts`
- [x] T066 [P] [US3] Create repository integration tests for CashAdvance CRUD and tenant scoping in `tests/integration/cash-advance/cash-advance.persistence.test.ts`
- [x] T067 [P] [US3] Create API tests for `POST /api/v1/workforce/cash-advances` in `tests/api/cash-advance/cash-advance-create.api.test.ts`
- [x] T068 [P] [US3] Create API tests for `GET /api/v1/workforce/cash-advances` and `GET /api/v1/workforce/cash-advances/company` in `tests/api/cash-advance/cash-advance-list.api.test.ts`
- [x] T069 [P] [US3] Create API tests for Employee forbidden create, validation failures, and cross-company access in `tests/api/cash-advance/cash-advance-access.api.test.ts`

### Implementation for User Story 3

- [x] T070 [P] [US3] Create CashAdvance domain entity, status enum, and balance rules in `src/modules/cash-advance/domain/cash-advance.entity.ts`, `src/modules/cash-advance/domain/cash-advance-status.ts`, and `src/modules/cash-advance/domain/cash-advance-rules.ts`
- [x] T071 [P] [US3] Create CashAdvance repository interface with outstanding-balance lookup in `src/modules/cash-advance/domain/cash-advance.repository.ts`
- [x] T072 [P] [US3] Create cash advance DTOs and Zod schemas in `src/modules/cash-advance/application/dto/` and `src/modules/cash-advance/presentation/cash-advance.schemas.ts`
- [x] T073 [US3] Implement cash advance authorization policy in `src/modules/cash-advance/application/policies/cash-advance-authorization.policy.ts`
- [x] T074 [US3] Implement `CreateCashAdvanceUseCase` with employee-in-company validation in `src/modules/cash-advance/application/use-cases/create-cash-advance.use-case.ts`
- [x] T075 [US3] Implement `ListMyCashAdvancesUseCase` and `ListCompanyCashAdvancesUseCase` in `src/modules/cash-advance/application/use-cases/list-my-cash-advances.use-case.ts` and `src/modules/cash-advance/application/use-cases/list-company-cash-advances.use-case.ts`
- [x] T076 [US3] Implement cash advance audit service in `src/modules/cash-advance/application/services/cash-advance-audit.service.ts`
- [x] T077 [US3] Implement cash advance mapper and Prisma repository in `src/modules/cash-advance/infrastructure/mappers/cash-advance.mapper.ts` and `src/modules/cash-advance/infrastructure/cash-advance.prisma-repository.ts`
- [x] T078 [US3] Implement cash advance controller and routes in `src/modules/cash-advance/presentation/cash-advance.controller.ts` and `src/modules/cash-advance/presentation/cash-advance.routes.ts`
- [x] T079 [US3] Register cash advance module wiring in `src/modules/cash-advance/index.ts`, `src/config/container.ts`, and `src/modules/index.ts`
- [x] T080 [US3] Add Cash Advances tag, schemas, and route definitions to Swagger in `src/modules/cash-advance/presentation/cash-advance.openapi.ts` and `src/swagger/openapi.builder.ts`

**Checkpoint**: Cash advance create and scoped list endpoints work with role-based authorization.

---

## Phase 6: User Story 4 - Weekly Payroll (Priority: P4)

**Goal**: Allow Managers/Owners to generate weekly payroll with salary and cash advance deductions, view payroll history, and mark payroll as paid while updating advance balances.

**Independent Test**: Manager generates weekly payroll with deductions, marks paid, duplicate pay period and already-paid conflicts rejected; Employee sees only own payroll lines.

### Tests for User Story 4

- [x] T081 [P] [US4] Create unit tests for PayrollRecord entity and deduction math in `tests/unit/payroll/payroll.entity.test.ts` and `tests/unit/payroll/payroll-rules.test.ts`
- [x] T082 [P] [US4] Create unit tests for generate, list, get, and mark-paid payroll use cases with in-memory repositories in `tests/unit/payroll/payroll.use-cases.test.ts`
- [x] T083 [P] [US4] Create repository integration tests for PayrollRecord CRUD, pay-period uniqueness, and tenant scoping in `tests/integration/payroll/payroll.persistence.test.ts`
- [x] T084 [P] [US4] Create API tests for `POST /api/v1/workforce/payroll` generation in `tests/api/payroll/payroll-generate.api.test.ts`
- [x] T085 [P] [US4] Create API tests for `GET /api/v1/workforce/payroll` and `GET /api/v1/workforce/payroll/{payrollId}` in `tests/api/payroll/payroll-history.api.test.ts`
- [x] T086 [P] [US4] Create API tests for `POST /api/v1/workforce/payroll/{payrollId}/mark-paid` in `tests/api/payroll/payroll-mark-paid.api.test.ts`
- [x] T087 [P] [US4] Create API tests for negative net pay rejection, missing salary, duplicate pay period, and cross-company access in `tests/api/payroll/payroll-access.api.test.ts`

### Implementation for User Story 4

- [x] T088 [P] [US4] Create PayrollRecord domain entity, status enum, and deduction rules in `src/modules/payroll/domain/payroll-record.entity.ts`, `src/modules/payroll/domain/payroll-status.ts`, and `src/modules/payroll/domain/payroll-rules.ts`
- [x] T089 [P] [US4] Create PayrollRecord repository interface with pay-period uniqueness lookup in `src/modules/payroll/domain/payroll-record.repository.ts`
- [x] T090 [P] [US4] Create payroll DTOs and Zod schemas in `src/modules/payroll/application/dto/` and `src/modules/payroll/presentation/payroll.schemas.ts`
- [x] T091 [US4] Implement payroll authorization policy in `src/modules/payroll/application/policies/payroll-authorization.policy.ts`
- [x] T092 [US4] Implement `GenerateWeeklyPayrollUseCase` with salary lookup, FIFO cash advance deductions, and negative-net rejection in `src/modules/payroll/application/use-cases/generate-weekly-payroll.use-case.ts`
- [x] T093 [US4] Implement `ListPayrollHistoryUseCase` and `GetPayrollRecordUseCase` with role-scoped filtering in `src/modules/payroll/application/use-cases/list-payroll-history.use-case.ts` and `src/modules/payroll/application/use-cases/get-payroll-record.use-case.ts`
- [x] T094 [US4] Implement `MarkPayrollPaidUseCase` updating payroll status and cash advance balances in `src/modules/payroll/application/use-cases/mark-payroll-paid.use-case.ts`
- [x] T095 [US4] Implement payroll deduction service for FIFO advance application in `src/modules/payroll/application/services/payroll-deduction.service.ts`
- [x] T096 [US4] Implement payroll audit service in `src/modules/payroll/application/services/payroll-audit.service.ts`
- [x] T097 [US4] Implement payroll mapper and Prisma repository in `src/modules/payroll/infrastructure/mappers/payroll-record.mapper.ts` and `src/modules/payroll/infrastructure/payroll-record.prisma-repository.ts`
- [x] T098 [US4] Implement payroll controller and routes in `src/modules/payroll/presentation/payroll.controller.ts` and `src/modules/payroll/presentation/payroll.routes.ts`
- [x] T099 [US4] Register payroll module wiring in `src/modules/payroll/index.ts`, `src/config/container.ts`, and `src/modules/index.ts`
- [x] T100 [US4] Add Payroll tag, schemas, and route definitions to Swagger in `src/modules/payroll/presentation/payroll.openapi.ts` and `src/swagger/openapi.builder.ts`

**Checkpoint**: Weekly payroll generation, history, detail, and mark-paid work with correct deduction math.

---

## Phase 7: User Story 5 - Employee Operational Dashboard (Priority: P5)

**Goal**: Provide a single workforce dashboard showing attendance status, history summaries, and correct operational action visibility before and after Time In.

**Independent Test**: Employee retrieves dashboard before Time In (creation actions hidden), after Time In (Time Out visible), after Time Out (creation actions hidden again).

### Tests for User Story 5

- [x] T101 [P] [US5] Create unit tests for dashboard visibility flag logic and `isOperationallyReady` integration in `tests/unit/workforce-dashboard/dashboard-visibility.test.ts`
- [x] T102 [P] [US5] Create unit tests for `GetWorkforceDashboardUseCase` with mocked attendance/leave/cash-advance/payroll data in `tests/unit/workforce-dashboard/dashboard.use-cases.test.ts`
- [x] T103 [P] [US5] Create API tests for `GET /api/v1/workforce/dashboard` visibility before/after Time In in `tests/api/workforce-dashboard/dashboard-visibility.api.test.ts`
- [x] T104 [P] [US5] Create API tests for dashboard summaries and unauthenticated/forbidden access in `tests/api/workforce-dashboard/dashboard-access.api.test.ts`

### Implementation for User Story 5

- [x] T105 [P] [US5] Create workforce dashboard response DTO with visibility flags in `src/modules/workforce-dashboard/application/dto/workforce-dashboard.response.ts`
- [x] T106 [US5] Implement `GetWorkforceDashboardUseCase` composing attendance, leave, cash advance, and payroll summaries in `src/modules/workforce-dashboard/application/use-cases/get-workforce-dashboard.use-case.ts`
- [x] T107 [US5] Implement dashboard visibility service using `isOperationallyReady` in `src/modules/workforce-dashboard/application/services/dashboard-visibility.service.ts`
- [x] T108 [US5] Implement workforce dashboard controller in `src/modules/workforce-dashboard/presentation/workforce-dashboard.controller.ts`
- [x] T109 [US5] Register dashboard route with auth and employee-context guards in `src/modules/workforce-dashboard/presentation/workforce-dashboard.routes.ts`
- [x] T110 [US5] Register workforce-dashboard module wiring in `src/modules/workforce-dashboard/index.ts`, `src/config/container.ts`, and `src/modules/index.ts`
- [x] T111 [US5] Add Dashboard tag, schemas, and route definitions to Swagger in `src/modules/workforce-dashboard/presentation/workforce-dashboard.openapi.ts` and `src/swagger/openapi.builder.ts`

**Checkpoint**: Dashboard reflects attendance readiness and exposes correct visibility flags.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Finalize OpenAPI alignment, CI coverage, common schemas, documentation, and end-to-end validation for P003.

- [x] T112 [P] Add workforce entity OpenAPI schemas (AttendanceSession, LeaveRecord, CashAdvance, PayrollRecord, WorkforceDashboard) to `src/swagger/common-schemas.ts`
- [x] T113 [P] Register workforce common error responses (lifecycle conflict, business rule violation) in `src/swagger/common-responses.ts` if not already covered
- [x] T114 Update CI workflow to include workforce unit, integration, and API test suites in `.github/workflows/ci.yml`
- [x] T115 Update API description in `src/swagger/openapi.builder.ts` to include Workforce Management
- [x] T116 Run `pnpm run prisma:migrate`, `pnpm run build`, `pnpm run lint`, and `pnpm test` to verify full P003 suite passes
- [x] T117 Validate all quickstart scenarios and acceptance criteria in `specs/004-workforce-management/quickstart.md`

**Checkpoint**: All 18 workforce endpoints documented, tested, and passing acceptance criteria.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — **BLOCKS all user stories**
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion — **MVP deliverable**
- **User Story 2 (Phase 4)**: Depends on Foundational; independent of US1 — independently testable
- **User Story 3 (Phase 5)**: Depends on Foundational; independent of US1/US2 — independently testable
- **User Story 4 (Phase 6)**: Depends on Foundational; **requires US3** for cash advance deduction data — testable with seeded advances
- **User Story 5 (Phase 7)**: Depends on Foundational; **requires US1** for attendance status; benefits from US2–US4 for full summaries
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: First deliverable after Foundational — no dependency on other workforce stories
- **US2 (P2)**: Can start after Foundational; reuses shared validators and employee context from Phase 2
- **US3 (P3)**: Can start after Foundational; independent of US1/US2
- **US4 (P4)**: Requires US3 cash advance records for deduction scenarios; can stub in unit tests earlier
- **US5 (P5)**: Requires US1 attendance for visibility rules; leave/cash/payroll summaries degrade gracefully when modules incomplete

### Within Each User Story

- Tests should be written before or alongside implementation for the same behavior
- Domain entities and repository interfaces come before use cases
- Use cases and policies come before controllers/routes
- Prisma repositories come after domain interfaces and before controller integration
- Swagger integration follows route registration

### Parallel Opportunities

- **Phase 1**: T002–T004 can run in parallel after T001
- **Phase 2**: T007–T016 can run in parallel after T005–T006
- **US1**: T019–T026 (tests) and T027–T031 (domain/DTOs) can run in parallel; use cases T033–T038 follow
- **US2**: T046–T051 (tests) and T052–T054 (domain/DTOs) can run in parallel; US2 can start after Foundational in parallel with US1
- **US3**: T064–T069 (tests) and T070–T072 (domain/DTOs) can run in parallel; US3 can run in parallel with US1/US2 after Foundational
- **US4**: Starts after US3 for full integration; unit tests T081–T082 can begin after Foundational with mocks
- **US5**: Starts after US1; T101–T102 can begin once attendance domain exists
- **Polish**: T112–T113 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch attendance tests in parallel:
Task T019: "Unit tests for AttendanceSession entity in tests/unit/attendance/attendance.entity.test.ts"
Task T021: "Unit tests for attendance use cases in tests/unit/attendance/attendance.use-cases.test.ts"
Task T023: "API tests for Time In/Out in tests/api/attendance/attendance-time.api.test.ts"
Task T026: "API tests for attendance access control in tests/api/attendance/attendance-access.api.test.ts"

# Launch attendance domain artifacts in parallel:
Task T027: "AttendanceSession entity in src/modules/attendance/domain/attendance-session.entity.ts"
Task T028: "Attendance status and rules in src/modules/attendance/domain/attendance-status.ts and attendance-rules.ts"
Task T029: "Attendance repository interface in src/modules/attendance/domain/attendance-session.repository.ts"
Task T030: "Attendance DTOs in src/modules/attendance/application/dto/"
Task T031: "Attendance Zod schemas in src/modules/attendance/presentation/attendance.schemas.ts"
```

---

## Parallel Example: Cross-Story Delivery

```bash
# After Phase 2 completes, developers can work in parallel:
Developer A: Phase 3 (US1 Attendance) — T019 through T045
Developer B: Phase 4 (US2 Leave) — T046 through T063
Developer C: Phase 5 (US3 Cash Advances) — T064 through T080

# US4 (Payroll) starts after US3 cash advances exist for deduction tests.
# US5 (Dashboard) starts after US1 attendance for visibility tests.
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Attendance)
4. **STOP and VALIDATE**: Run attendance quickstart scenarios and confirm Time In/Out conflicts + tenant isolation
5. Demo attendance and operational readiness as first workforce milestone

### Incremental Delivery

1. Setup + Foundational → workforce platform primitives ready
2. Add US1 (Attendance) → operational readiness MVP
3. Add US2 (Leave) → workforce planning
4. Add US3 (Cash Advances) → payroll deduction foundation
5. Add US4 (Payroll) → weekly payroll loop
6. Add US5 (Dashboard) → employee operational view
7. Polish → docs, CI, and full acceptance validation

### Parallel Team Strategy

With multiple developers after Foundational:

- Developer A: US1 Attendance module end-to-end
- Developer B: US2 Leave module end-to-end
- Developer C: US3 Cash Advance module end-to-end
- Developer D: US4 Payroll after US3; US5 Dashboard after US1
- Converge in Polish phase for CI and quickstart validation

---

## Notes

- Reuse P001 middleware, error codes, API envelope, pagination, and auth patterns — do not redefine
- Every repository query MUST filter by `companyId` from authenticated tenant context
- Self-service endpoints resolve `employeeId` from `User.employeeId` — reject if not linked
- At most one open attendance session per Employee
- Leave overlap on same date rejected for non-cancelled records
- Cash advances deducted FIFO across payroll until settled
- Weekly pay period MUST span exactly seven days
- Net pay cannot be negative — surface 409 with details
- Dashboard trips/transactions summaries return empty arrays until future modules
- Align Swagger output with `specs/004-workforce-management/contracts/openapi.yaml`
- Total tasks: **117**
