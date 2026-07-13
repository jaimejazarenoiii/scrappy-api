---
description: 'Task list for P003 Addendum — Password Management'
---

# Tasks: P003 Addendum — Password Management

**Input**: Design documents from `/specs/012-password-management/`

**Prerequisites**: plan.md (§4 Temporary Password Strategy), spec.md, research.md, data-model.md,
contracts/openapi.yaml, quickstart.md; P001–P011 implemented and passing

**Tests**: Included — plan §13 and engineering AC-010 require Vitest unit/integration and Supertest
API coverage for change, reset, temporary-password lifecycle, forced-change gate, session revoke,
authorization, and tenant isolation.

**Organization**: Extends `user` and `employee` modules plus auth middleware/login DTO. Foundational
User fields + repo methods block all stories. Each user story phase is independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: `US1` = Change own password, `US2` = Admin reset with temporary password lifecycle,
  `US3` = Forced password change gate

## Path Conventions

- **User module**: `src/modules/user/{domain,application,infrastructure,presentation}/`
- **Employee module**: `src/modules/employee/{application,presentation}/`
- **Auth**: `src/modules/auth/`
- **Shared auth helpers**: `src/shared/auth/` (temporary password generator)
- **Middleware**: `src/middleware/`
- **DI**: `src/config/container.ts`, `src/app.js` / route wiring
- **Schema**: `prisma/schema.prisma`, `prisma/migrations/`
- **Swagger**: `src/swagger/common-schemas.ts`, `user.openapi.ts`, `employee.openapi.ts`, `docs/api-reference.md`
- **Tests**: `tests/unit/user/`, `tests/unit/employee/`, `tests/api/user/`, `tests/api/employee/`, `tests/setup/`

---

## Phase 1: Setup (Shared Scaffolding)

**Purpose**: Add placeholders and test directories without changing runtime behavior yet.

- [x] T001 [P] Create DTO placeholders in `src/modules/user/application/dto/change-password.request.ts` and `src/modules/user/application/dto/password-status.response.ts`
- [x] T002 [P] Create `src/modules/user/application/policies/password-reset.policy.ts` placeholder
- [x] T003 [P] Create `src/modules/user/application/services/user-password-audit.service.ts` placeholder
- [x] T004 [P] Create use-case placeholders in `src/modules/user/application/use-cases/change-password.use-case.ts` and `src/modules/user/application/use-cases/get-password-status.use-case.ts`
- [x] T005 [P] Create `src/modules/employee/application/dto/reset-employee-password.request.ts` and `src/modules/employee/application/use-cases/reset-employee-password.use-case.ts` placeholders
- [x] T006 [P] Create `src/middleware/password-change-gate.middleware.ts` and `src/shared/auth/temporary-password.ts` placeholders
- [x] T007 [P] Create test directories under `tests/unit/user/`, `tests/api/user/`, and stubs for password reset under `tests/api/employee/` / `tests/unit/employee/`

**Checkpoint**: Scaffolding exists for implementation and testing.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: User field extension, repository methods, error code, shared Zod helpers, in-memory
updates — required by all stories.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [x] T008 Add `passwordChangeRequired` (Boolean `@default(false)`) and `passwordChangedAt` (DateTime?) to `User` in `prisma/schema.prisma`
- [x] T009 Create Prisma migration for User password fields in `prisma/migrations/`
- [x] T010 Extend `UserEntity` / `UserProps` with `passwordChangeRequired` and `passwordChangedAt` in `src/modules/user/domain/user.entity.ts`
- [x] T011 Extend `UserRepository` with `updatePassword(userId, companyId, passwordHash, options)` (sets hash, `passwordChangeRequired`, `passwordChangedAt`) in `src/modules/user/domain/user.repository.ts`
- [x] T012 Implement new `UserRepository` methods and map new fields in `src/modules/user/infrastructure/user.prisma-repository.ts`
- [x] T013 Update `InMemoryUserRepository` create/mappers and `updatePassword` in `tests/setup/in-memory-repositories.ts`
- [x] T014 [P] Add `PASSWORD_CHANGE_REQUIRED` to `src/shared/errors/error-codes.ts` and map in `src/shared/errors/http-exceptions.ts` (or dedicated error class)
- [x] T015 [P] Implement `assertCanResetPassword(actorRole, targetRole)` in `src/modules/user/application/policies/password-reset.policy.ts`
- [x] T016 [P] Implement `user-password-audit.service.ts` (change/reset actions; never log plaintext temporary or permanent passwords) in `src/modules/user/application/services/user-password-audit.service.ts`
- [x] T017 [P] Add shared password confirmation Zod helper (min 8 + match) for change-password only in `src/modules/user/presentation/user.schemas.ts` (or `src/shared/auth/password-policy.ts`)
- [x] T018 [P] Extend `CurrentUserResponse` / get-current-user mapping with `passwordChangeRequired` in `src/modules/user/application/dto/current-user.response.ts` and related use case/mapper
- [x] T019 [P] Unit tests for password-reset policy in `tests/unit/user/password-reset.policy.test.ts`

**Checkpoint**: User password fields, repo APIs, policy, and error code are ready.

---

## Phase 3: User Story 1 - Change Own Password (Priority: P1) 🎯 MVP

**Goal**: Authenticated users change their own password after verifying the current password; clears
`passwordChangeRequired` and sets `passwordChangedAt`; revokes refresh sessions; replaces any prior
temporary password hash (plan §4 — Temporary Password Replaced → Normal Login Flow).

**Independent Test**: Login → change password → old password fails login → new password succeeds;
mismatch/wrong current rejected.

### Tests for User Story 1

- [x] T020 [P] [US1] Unit tests for change-password success, bad current, mismatch, clears flag in `tests/unit/user/change-password.use-case.test.ts`
- [x] T021 [P] [US1] API tests for change password and login with new password in `tests/api/user/change-password.api.test.ts`

### Implementation for User Story 1

- [x] T022 [US1] Implement `ChangePasswordRequestDto` and `changePasswordSchema` in `src/modules/user/application/dto/change-password.request.ts` and `src/modules/user/presentation/user.schemas.ts`
- [x] T023 [US1] Implement `ChangePasswordUseCase` (verify current via PasswordHasher, updatePassword with required=false + passwordChangedAt, revokeAllForUser, audit without plaintext) in `src/modules/user/application/use-cases/change-password.use-case.ts`
- [x] T024 [US1] Add `changePassword` handler in `src/modules/user/presentation/user.controller.ts`
- [x] T025 [US1] Add `POST /users/me/password` route in `src/modules/user/presentation/user.routes.ts`
- [x] T026 [US1] Wire ChangePasswordUseCase in `src/config/container.ts`
- [x] T027 [US1] Document change-password in `src/modules/user/presentation/user.openapi.ts` and `src/swagger/common-schemas.ts`

**Checkpoint**: Self-service change password works end-to-end (MVP).

---

## Phase 4: User Story 2 - Admin Reset with Temporary Password (Priority: P2)

**Goal**: Implement plan §4 Temporary Password Strategy lifecycle for Owners/Managers:

1. Reset Password → System Generates Temporary Password
2. Hash Stored (bcrypt only; never plaintext) + `passwordChangeRequired=true`
3. Temporary Password Returned Once
4. Previous credentials invalid; all refresh tokens revoked; existing sessions invalidated
5. Do not modify Employee profile rows

**Independent Test**: Owner resets Employee (empty body) → response includes `temporaryPassword`
once → previous password fails → temp login works → status/flag true; Manager→Manager rejected;
no linked user → 409; temporary password not recoverable on any later call.

### Tests for User Story 2

- [x] T028 [P] [US2] Unit tests for reset success (generated temp returned once), role conflicts, hash-only persistence, and previous hash invalidated in `tests/unit/employee/reset-employee-password.use-case.test.ts`
- [x] T029 [P] [US2] API tests for reset (empty body + one-time temp), authz matrix, no-linked-user, and temp not returned on subsequent GETs in `tests/api/employee/employee-password-reset.api.test.ts`
- [x] T030 [P] [US2] Unit tests for temporary password generator (strength/entropy; no fixed/weak output) in `tests/unit/shared/temporary-password.test.ts`

### Implementation for User Story 2

- [x] T031 [US2] Implement empty-body reset schema (reject client-supplied passwords) in `src/modules/employee/presentation/employee.schemas.ts` and DTO in `src/modules/employee/application/dto/reset-employee-password.request.ts` if needed
- [x] T032 [US2] Implement secure temporary password generator (cryptographically random; meets product strength rules) in `src/shared/auth/temporary-password.ts`
- [x] T033 [US2] Implement `ResetEmployeePasswordUseCase` per plan §4: generate → hash → store hash only → set `passwordChangeRequired=true` → `revokeAllForUser` (all refresh tokens / invalidate sessions) → audit without plaintext → return `temporaryPassword` once in `src/modules/employee/application/use-cases/reset-employee-password.use-case.ts`
- [x] T034 [US2] Add `resetPassword` handler (ensure response includes one-time temp; never log it) in `src/modules/employee/presentation/employee.controller.ts`
- [x] T035 [US2] Add `POST /employees/:employeeId/password-reset` in `src/modules/employee/presentation/employee.routes.ts`
- [x] T036 [US2] Wire ResetEmployeePasswordUseCase in `src/config/container.ts`
- [x] T037 [US2] Document reset (one-time `temporaryPassword` in response; empty request; hash-only storage note) in `src/modules/employee/presentation/employee.openapi.ts` and `src/swagger/common-schemas.ts`

**Checkpoint**: Admin reset lifecycle through “Temporary Password Returned Once” works; forced-change
flag set for US3.

---

## Phase 5: User Story 3 - Forced Password Change (Priority: P3)

**Goal**: Complete plan §4 remaining steps after reset: Employee Logs In → Password Change Required →
Employee Changes Password → Temporary Password Replaced → Normal Login Flow. Non-allowlisted
protected routes return 403 until change; password-status and login DTO expose the flag.

**Independent Test**: Reset → login with one-time temp from response → blocked list route → status
true → change password → list succeeds → temporary password no longer authenticates.

### Tests for User Story 3

- [x] T038 [P] [US3] Unit tests for password-change-gate allowlist in `tests/unit/middleware/password-change-gate.middleware.test.ts` (or equivalent)
- [x] T039 [P] [US3] API tests for forced-change block and restore (temp replaced after change) in `tests/api/user/password-forced-change.api.test.ts`
- [x] T040 [P] [US3] Unit/API coverage for `GET /users/me/password-status` in `tests/unit/user/get-password-status.use-case.test.ts` and/or API file above

### Implementation for User Story 3

- [x] T041 [US3] Implement `GetPasswordStatusUseCase` and response DTO in `src/modules/user/application/use-cases/get-password-status.use-case.ts` and `src/modules/user/application/dto/password-status.response.ts`
- [x] T042 [US3] Add `GET /users/me/password-status` to controller/routes/schemas/OpenAPI in `src/modules/user/presentation/`
- [x] T043 [US3] Implement `password-change-gate.middleware.ts` (DB-read flag; allowlist change password, password-status, logout, refresh, optionally `GET /users/me`)
- [x] T044 [US3] Register password-change gate in app middleware stack after auth in `src/app.ts` (or equivalent)
- [x] T045 [US3] Include `passwordChangeRequired` on login user payload in `src/modules/auth/application/dto/auth.response.ts` and `src/modules/auth/application/use-cases/login.use-case.ts`
- [x] T046 [US3] Wire GetPasswordStatusUseCase + ensure gate has UserRepository in `src/config/container.ts` / app factory

**Checkpoint**: Full temporary-password lifecycle through Normal Login Flow works with allowlist.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Tenant isolation, docs, session revoke confirmation (plan §4 / §10), OpenAPI alignment.

- [x] T047 [P] API tenant-isolation tests for password-reset across companies in `tests/api/employee/employee-password-reset-tenant.api.test.ts`
- [x] T048 [P] Session revoke assertion tests after reset/change: all refresh tokens revoked; prior sessions cannot refresh; must login with new credential in `tests/api/user/password-session-revoke.api.test.ts` (or extend existing API tests)
- [x] T049 [P] Update Employees/Users password sections in `docs/api-reference.md` (system-generated one-time temp; hash-only storage; session invalidation on reset)
- [x] T050 Align OpenAPI with `specs/012-password-management/contracts/openapi.yaml` in `src/swagger/common-schemas.ts`, `user.openapi.ts`, `employee.openapi.ts`
- [x] T051 Run/fix scenarios from `specs/012-password-management/quickstart.md` (full temporary-password lifecycle)
- [x] T052 [P] Smoke existing `GET /users/me` and employee CRUD still pass under gate when flag false

**Checkpoint**: Feature ready for `/speckit-implement`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **US1 (Phase 3)**: Depends on Foundational — MVP
- **US2 (Phase 4)**: Depends on Foundational (shares `updatePassword` + policy + temp generator)
- **US3 (Phase 5)**: Depends on Foundational; full E2E temporary-password lifecycle ideally after US1 + US2
- **Polish (Phase 6)**: Depends on US1–US3 desired scope

### User Story Dependencies

- **US1 (P1)**: After Foundational only
- **US2 (P2)**: After Foundational; independently testable from US1 (lifecycle through return-once)
- **US3 (P3)**: After Foundational; gate can be unit-tested alone; full lifecycle needs US2 to set
  flag/temp and US1 to replace temp and clear flag

### Parallel Opportunities

- Phase 1: T001–T007 [P]
- Phase 2: T014–T019 [P] where marked
- US1 tests T020–T021 [P] then implement T022–T027
- US2 tests T028–T030 [P] then T031–T037
- US3 tests T038–T040 [P] then T041–T046
- Polish T047–T050, T052 [P]

### Parallel Example: User Story 2 (Temporary Password Strategy)

```bash
# After Foundational:
Task: "Unit tests in tests/unit/employee/reset-employee-password.use-case.test.ts"
Task: "API tests in tests/api/employee/employee-password-reset.api.test.ts"
Task: "Unit tests in tests/unit/shared/temporary-password.test.ts"
# Then implement generator + ResetEmployeePasswordUseCase + route + DI + OpenAPI
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 + Phase 2
2. Complete Phase 3 (US1)
3. **STOP and VALIDATE** change password + login with new credentials
4. Demo MVP

### Incremental Delivery

1. Setup + Foundational → User fields ready
2. US1 → self-service change (MVP) / Temporary Password Replaced path
3. US2 → admin reset lifecycle through one-time return + session revoke
4. US3 → forced-change gate + status + login flag → Normal Login Flow
5. Polish → docs + isolation + session assertions

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Dev A: US1 | Dev B: US2 (generator + reset) | Dev C: middleware/status (US3) against shared `updatePassword`

---

## Notes

- Follow plan **§4 Temporary Password Strategy** for the complete lifecycle
- Temporary passwords: auto-generated, hashed before store, returned once, never recoverable, never logged
- Only password hashes are persisted; plaintext temporary passwords are never stored
- Password reset immediately revokes all refresh tokens and invalidates existing sessions
- After successful change password, the temporary password is invalid
- Email forgot-password placeholder remains unchanged
- Never return plaintext passwords except the one-time `temporaryPassword` on successful admin reset
- `companyId` always from `req.auth.companyId`
- Admin reset must not write Employee profile fields
- Commit after each task or logical group
- Suggested MVP = Phase 1–3 only (US1)
