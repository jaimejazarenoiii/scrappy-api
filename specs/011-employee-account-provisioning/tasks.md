---
description: 'Task list for P003 Addendum — Employee Account Provisioning'
---

# Tasks: P003 Addendum — Employee Account Provisioning

**Input**: Design documents from `/specs/011-employee-account-provisioning/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md; P001–P010 implemented and passing

**Tests**: Included — plan §11 and engineering AC-011 require Vitest unit/integration and Supertest API coverage for provisioning, authorization, tenant isolation, rollback, and duplicate email.

**Organization**: Extends existing `employee` and `user` modules (no new top-level module). Foundational shared policy/DTOs/repos block all stories. Each user story phase is independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: `US1` = Create Employee with optional login, `US2` = Grant system access, `US3` = Disable/Enable system access

## Path Conventions

- **Employee module**: `src/modules/employee/{domain,application,infrastructure,presentation}/`
- **User module**: `src/modules/user/{domain,infrastructure}/`
- **Session**: `src/modules/session/`
- **DI / routes**: `src/config/container.ts`, `src/modules/employee/index.ts`
- **Swagger**: `src/swagger/common-schemas.ts`, `src/modules/employee/presentation/employee.openapi.ts`, `docs/api-reference.md`
- **Tests**: `tests/unit/employee/`, `tests/integration/employee/`, `tests/api/employee/`, `tests/setup/`

---

## Phase 1: Setup (Shared Scaffolding)

**Purpose**: Add file placeholders and test directories for account provisioning without changing behavior yet.

- [x] T001 [P] Create DTO placeholders in `src/modules/employee/application/dto/grant-system-access.request.ts` and `src/modules/employee/application/dto/linked-user.response.ts`
- [x] T002 [P] Create policy placeholder in `src/modules/employee/application/policies/account-provisioning.policy.ts`
- [x] T003 [P] Create service placeholders in `src/modules/employee/application/services/employee-account-provisioning.service.ts` and `src/modules/employee/application/services/employee-account-audit.service.ts`
- [x] T004 [P] Create use-case placeholders in `src/modules/employee/application/use-cases/grant-system-access.use-case.ts`, `src/modules/employee/application/use-cases/disable-system-access.use-case.ts`, and `src/modules/employee/application/use-cases/enable-system-access.use-case.ts`
- [x] T005 [P] Create test directories/stubs under `tests/unit/employee/`, `tests/integration/employee/`, and `tests/api/employee/` for account provisioning

**Checkpoint**: Scaffolding exists for implementation and testing.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared validation, role policy, repository capabilities, response shapes, and DI hooks required by all user stories.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [x] T006 [P] Implement `assertCanAssignRole(actorRole, targetRole)` in `src/modules/employee/application/policies/account-provisioning.policy.ts` (Owner → OWNER|MANAGER|EMPLOYEE; Manager → EMPLOYEE only)
- [x] T007 [P] Implement `LinkedUserSummary` / builders in `src/modules/employee/application/dto/linked-user.response.ts`
- [x] T008 Extend `EmployeeResponseDto` with optional `linkedUser` in `src/modules/employee/application/dto/employee.response.ts`
- [x] T009 [P] Add shared Zod `employeeAccountCredentialsSchema` (email, password min 8, confirmPassword, role) with password-match refine in `src/modules/employee/presentation/employee.schemas.ts`
- [x] T010 Extend `createEmployeeSchema` with `createAccount`, optional `account`, and mutual exclusion vs `userId` in `src/modules/employee/presentation/employee.schemas.ts`
- [x] T011 [P] Add `grantSystemAccessSchema` reusing credentials schema in `src/modules/employee/presentation/employee.schemas.ts`
- [x] T012 Extend `CreateEmployeeRequestDto` for `createAccount` + `account` in `src/modules/employee/application/dto/create-employee.request.ts`
- [x] T013 [P] Implement `GrantSystemAccessRequestDto` in `src/modules/employee/application/dto/grant-system-access.request.ts`
- [x] T014 Extend `UserRepository` with `updateStatus(userId, companyId, status)` and transactional `createLinkedToEmployee(...)` (or equivalent) in `src/modules/user/domain/user.repository.ts`
- [x] T015 Implement new `UserRepository` methods in `src/modules/user/infrastructure/user.prisma-repository.ts`
- [x] T016 Extend `SessionRepository` with `revokeAllForUser(userId)` in `src/modules/session/domain/session.repository.ts` and `src/modules/session/infrastructure/session.prisma-repository.ts`
- [x] T017 [P] Add domain guards for linked-user access state in `src/modules/employee/domain/employee-rules.ts` (has/no user, active employee for grant)
- [x] T018 [P] Implement `employee-account-audit.service.ts` helpers for provision/grant/disable/enable events in `src/modules/employee/application/services/employee-account-audit.service.ts`
- [x] T019 Implement shared `EmployeeAccountProvisioningService` (hash password, uniqueness check, create User + bidirectional link inside a transaction) in `src/modules/employee/application/services/employee-account-provisioning.service.ts`
- [x] T020 [P] Add Swagger components `EmployeeAccountCredentials`, `LinkedUserSummary`, extended `CreateEmployeeRequest` in `src/swagger/common-schemas.ts`
- [x] T021 Extend in-memory `UserRepository` / session stubs for status + revokeAll in `tests/setup/in-memory-repositories.ts`
- [x] T022 [P] Add unit tests for role-assignment policy in `tests/unit/employee/account-provisioning.policy.test.ts`

**Checkpoint**: Shared policy, schemas, repos, and provisioning helper are ready; stories can proceed.

---

## Phase 3: User Story 1 - Create Employee With Optional Login (Priority: P1) 🎯 MVP

**Goal**: Owners/Managers create Employees with or without a login account in one request; account path creates and links User atomically.

**Independent Test**: Create without account → no login; create with account → linkedUser returned and login succeeds; password mismatch → 422 and no partial rows.

### Tests for User Story 1

- [x] T023 [P] [US1] Unit tests for create-with-account / without-account / mismatch / forbidden role in `tests/unit/employee/create-employee-with-account.use-case.test.ts`
- [x] T024 [P] [US1] API tests for create with/without account, validation, and login success in `tests/api/employee/employee-create-with-account.api.test.ts`
- [x] T025 [P] [US1] Integration test asserting transactional rollback on duplicate email in `tests/integration/employee/employee-account-transaction.persistence.test.ts`

### Implementation for User Story 1

- [x] T026 [US1] Extend `CreateEmployeeUseCase` to accept auth context (actor role), optional account path, call provisioning service inside one transaction, return `linkedUser` in `src/modules/employee/application/use-cases/create-employee.use-case.ts`
- [x] T027 [US1] Update `EmployeeController.create` to pass `req.auth` into create use case in `src/modules/employee/presentation/employee.controller.ts`
- [x] T028 [US1] Ensure create route still authorizes OWNER/MANAGER and uses extended schema in `src/modules/employee/presentation/employee.routes.ts`
- [x] T029 [US1] Wire PasswordHasher + UserRepository + provisioning service into create use case in `src/modules/employee/index.ts` and `src/config/container.ts`
- [x] T030 [US1] Document create-with-account in `src/modules/employee/presentation/employee.openapi.ts`

**Checkpoint**: Optional login on Employee create works end-to-end (MVP).

---

## Phase 4: User Story 2 - Grant System Access (Priority: P2)

**Goal**: Owners/Managers grant login to existing Employees without a User by creating and linking a User.

**Independent Test**: Unlinked active Employee + grant → login works; already-linked / archived / duplicate email / forbidden role rejected.

### Tests for User Story 2

- [x] T031 [P] [US2] Unit tests for grant success and conflict cases in `tests/unit/employee/grant-system-access.use-case.test.ts`
- [x] T032 [P] [US2] API tests for grant, conflicts, and Manager role limits in `tests/api/employee/employee-system-access.api.test.ts` (grant cases)

### Implementation for User Story 2

- [x] T033 [US2] Implement `GrantSystemAccessUseCase` in `src/modules/employee/application/use-cases/grant-system-access.use-case.ts`
- [x] T034 [US2] Add `grantSystemAccess` handler in `src/modules/employee/presentation/employee.controller.ts`
- [x] T035 [US2] Add `POST /employees/:employeeId/system-access` (OWNER, MANAGER) in `src/modules/employee/presentation/employee.routes.ts`
- [x] T036 [US2] Register grant use case in `src/modules/employee/index.ts` and `src/config/container.ts`
- [x] T037 [US2] Document grant endpoint in `src/modules/employee/presentation/employee.openapi.ts`

**Checkpoint**: Grant access works independently of create-with-account.

---

## Phase 5: User Story 3 - Disable / Enable System Access (Priority: P3)

**Goal**: Disable login without deleting Employee; re-enable previously disabled linked Users; revoke sessions on disable.

**Independent Test**: Disable → login fails, Employee stays ACTIVE; enable → login works; missing/already-in-state conflicts return 409.

### Tests for User Story 3

- [x] T038 [P] [US3] Unit tests for disable/enable transitions and session revoke in `tests/unit/employee/disable-enable-system-access.use-case.test.ts`
- [x] T039 [P] [US3] API tests for disable/enable and post-disable login rejection in `tests/api/employee/employee-system-access.api.test.ts` (disable/enable cases)

### Implementation for User Story 3

- [x] T040 [US3] Implement `DisableSystemAccessUseCase` (set User INACTIVE + `revokeAllForUser`) in `src/modules/employee/application/use-cases/disable-system-access.use-case.ts`
- [x] T041 [US3] Implement `EnableSystemAccessUseCase` (set User ACTIVE) in `src/modules/employee/application/use-cases/enable-system-access.use-case.ts`
- [x] T042 [US3] Add disable/enable controller handlers in `src/modules/employee/presentation/employee.controller.ts`
- [x] T043 [US3] Add `POST .../system-access/disable` and `POST .../system-access/enable` in `src/modules/employee/presentation/employee.routes.ts`
- [x] T044 [US3] Wire disable/enable use cases in `src/modules/employee/index.ts` and `src/config/container.ts`
- [x] T045 [US3] Document disable/enable in `src/modules/employee/presentation/employee.openapi.ts`

**Checkpoint**: Full access lifecycle (grant/create → disable → enable) works without Employee deletion.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Tenant isolation, docs, and quickstart validation across stories.

- [x] T046 [P] API tenant-isolation tests for create/grant/disable/enable across companies in `tests/api/employee/employee-account-tenant-isolation.api.test.ts`
- [x] T047 [P] Update Employee Account Provisioning section in `docs/api-reference.md`
- [x] T048 Align OpenAPI path docs with `specs/011-employee-account-provisioning/contracts/openapi.yaml` in `src/modules/employee/presentation/employee.openapi.ts` and `src/swagger/common-schemas.ts`
- [x] T049 Run and fix failures from `specs/011-employee-account-provisioning/quickstart.md` scenarios (manual or automated suite)
- [x] T050 [P] Confirm existing `POST /employees/:id/user-link` still works (regression) in `tests/api/employee/` or extend existing link tests

**Checkpoint**: Feature ready for `/speckit-implement`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **US1 (Phase 3)**: Depends on Foundational — MVP
- **US2 (Phase 4)**: Depends on Foundational (reuses provisioning service from Phase 2; independently testable from US1)
- **US3 (Phase 5)**: Depends on Foundational (needs linked User — can use grant or create-with-account in tests)
- **Polish (Phase 6)**: Depends on US1–US3 desired scope

### User Story Dependencies

- **US1 (P1)**: After Foundational only
- **US2 (P2)**: After Foundational; does not require US1 code path but shares provisioning helper
- **US3 (P3)**: After Foundational; tests need a linked employee (via US1 or US2 helpers)

### Parallel Opportunities

- Phase 1: T001–T005 all [P]
- Phase 2: T006–T007, T009, T011, T013, T017–T018, T020, T022 [P] where marked
- US1 tests T023–T025 [P]; then implement T026→T030 sequentially where files overlap
- US2 tests T031–T032 [P]; then T033→T037
- US3 tests T038–T039 [P]; then T040→T045
- Polish T046, T047, T050 [P]

### Parallel Example: User Story 1

```bash
# After Foundational:
Task: "Unit tests in tests/unit/employee/create-employee-with-account.use-case.test.ts"
Task: "API tests in tests/api/employee/employee-create-with-account.api.test.ts"
Task: "Integration rollback test in tests/integration/employee/employee-account-transaction.persistence.test.ts"
# Then implement CreateEmployeeUseCase extension and wire DI/OpenAPI
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 + Phase 2
2. Complete Phase 3 (US1)
3. **STOP and VALIDATE** create with/without account + login
4. Demo MVP onboarding

### Incremental Delivery

1. Setup + Foundational → shared capability ready
2. US1 → optional login on create (MVP)
3. US2 → grant later
4. US3 → disable/enable
5. Polish → docs + tenant isolation

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Dev A: US1 | Dev B: US2 (after T019 provisioning service) | Dev C: US3 stubs/tests (needs linked fixture helpers)

---

## Notes

- No Prisma schema migration expected (reuse User/Employee link + UserStatus)
- Keep `POST /employees/{id}/user-link` for existing-User linking; do not overload with credentials
- Passwords never appear in responses or logs
- `companyId` always from `req.auth.companyId`
- Commit after each task or logical group
- Suggested MVP = Phase 1–3 only (US1)
