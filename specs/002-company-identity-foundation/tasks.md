---
description: 'Task list for Company & Identity Foundation feature'
---

# Tasks: Company & Identity Foundation

**Input**: Design documents from `/specs/002-company-identity-foundation/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/openapi.yaml, quickstart.md

**Tests**: Included — the specification and plan require unit, integration, and API tests for onboarding, auth, tenant isolation, employee lifecycle, and protected routes.

**Organization**: Tasks are grouped by user story after shared setup and foundational phases so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: `US1` = Company onboarding with Owner, `US2` = Authentication and company-bound access, `US3` = Employee and role management

## Path Conventions

P001 uses modular Clean Architecture:

- **Modules**: `src/modules/{company,auth,user,employee,session}/`
- **Shared**: `src/shared/{auth,tenant,policy,audit,errors,http,pagination,utils}/`
- **Config**: `src/config/`
- **Database**: `src/database/`
- **Middleware**: `src/middleware/`
- **Validations**: `src/validations/`
- **Swagger**: `src/swagger/`
- **Tests**: `tests/unit/`, `tests/integration/`, `tests/api/`
- **Schema**: `prisma/schema.prisma`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare module-oriented project structure, dependencies, configuration, and tooling for the Company & Identity Foundation.

- [x] T001 Create module-first source directory structure with clean-architecture subfolders in `src/modules/{company,auth,user,employee,session}/{domain,application,infrastructure,presentation}` and shared directories in `src/shared/{auth,tenant,policy,audit,errors,http,pagination,utils}`
- [x] T002 [P] Create supporting root directories in `src/{config,database,middleware,validations,swagger,utilities}` and test directories in `tests/{unit,integration,api}`
- [x] T003 Update `package.json` to add foundation dependencies for JWT, bcrypt, security middleware, and Swagger support needed by P001 in `package.json`
- [x] T004 Update `package.json` scripts for P001 test splits and Prisma workflows in `package.json`
- [x] T005 Update TypeScript path aliases and compilation settings for module-first organization in `tsconfig.json`
- [x] T006 [P] Create `.env.example` entries for JWT secrets, token expirations, bcrypt cost, CORS allowlist, and rate-limit configuration in `.env.example`
- [x] T007 [P] Extend ignore and formatting support for generated Swagger, test artifacts, and module build outputs in `.gitignore`, `.dockerignore`, `.prettierignore`, and `eslint.config.js`

**Checkpoint**: Source tree, config, and tooling support the P001 module boundaries and required dependencies.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared domain primitives, database strategy, middleware pipeline, auth/security building blocks, and reusable contracts that all user stories depend on.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [x] T008 Create shared identifier, timestamp, and archive value-object primitives in `src/shared/utils/` and `src/shared/errors/`
- [x] T009 [P] Create shared API success/error envelope types and helpers in `src/shared/http/api-response.ts` and `src/shared/http/api-response.types.ts`
- [x] T010 [P] Create shared error code catalog and base exception hierarchy in `src/shared/errors/error-codes.ts`, `src/shared/errors/app-error.ts`, and `src/shared/errors/http-exceptions.ts`
- [x] T011 Create environment schema and configuration loader for auth, security, and token settings in `src/config/env.schema.ts` and `src/config/index.ts`
- [x] T012 Create centralized logger and audit logger contracts for request, auth, and domain events in `src/config/logger.ts` and `src/shared/audit/audit-event.ts`
- [x] T013 Create Prisma client bootstrap and transaction helper in `src/database/prisma.client.ts` and `src/database/prisma-transaction.ts`
- [x] T014 Create Prisma model naming, archive, and audit conventions documentation placeholder in `src/database/README.md`
- [x] T015 Create shared tenant context types and tenant resolution utilities in `src/shared/tenant/tenant-context.ts` and `src/shared/tenant/tenant-resolution.ts`
- [x] T016 Create shared role enums and authorization policy contracts in `src/shared/policy/roles.ts`, `src/shared/policy/policy.interface.ts`, and `src/shared/policy/authorization-context.ts`
- [x] T017 Create shared auth provider interfaces for token issuing, token verification, and password hashing in `src/shared/auth/token-provider.interface.ts` and `src/shared/auth/password-hasher.interface.ts`
- [x] T018 Create shared pagination, filtering, sorting, and search DTO/schema primitives in `src/shared/pagination/pagination.types.ts` and `src/validations/common-query.schemas.ts`
- [x] T019 [P] Create request ID, structured request logging, and audit-log correlation middleware in `src/middleware/request-id.middleware.ts` and `src/middleware/request-logger.middleware.ts`
- [x] T020 [P] Create CORS, Helmet, and rate-limit middleware configuration in `src/middleware/cors.middleware.ts`, `src/middleware/security-headers.middleware.ts`, and `src/middleware/rate-limit.middleware.ts`
- [x] T021 Create authentication middleware for bearer token extraction and principal resolution in `src/middleware/authentication.middleware.ts`
- [x] T022 Create company resolution middleware that binds authenticated users to tenant context in `src/middleware/company-resolution.middleware.ts`
- [x] T023 Create role/authorization middleware wrapper using policy contracts in `src/middleware/authorization.middleware.ts`
- [x] T024 Create generic Zod request validation middleware for body, params, and query in `src/middleware/validation.middleware.ts`
- [x] T025 Create global not-found and exception middleware with standard error envelope mapping in `src/middleware/not-found.middleware.ts` and `src/middleware/error-handler.middleware.ts`
- [x] T026 Create shared Swagger builder, security scheme, reusable schemas, and common responses in `src/swagger/openapi.builder.ts`, `src/swagger/common-schemas.ts`, and `src/swagger/common-responses.ts`
- [x] T027 Create application bootstrap and middleware pipeline registration in `src/app.ts`
- [x] T028 Create server bootstrap, graceful shutdown, and config preload flow in `src/server.ts`
- [x] T029 Create module registration and dependency container entrypoints in `src/modules/index.ts` and `src/config/container.ts`
- [x] T030 Create foundation-level API and middleware smoke tests scaffold in `tests/integration/app.bootstrap.test.ts`
- [x] T031 Create shared test factories and fixture helpers for Company, User, Employee, and Session data in `tests/factories/company.factory.ts`, `tests/factories/user.factory.ts`, `tests/factories/employee.factory.ts`, and `tests/factories/session.factory.ts`
- [x] T032 Create test database lifecycle helpers for isolated integration and API tests in `tests/setup/test-db.ts` and `tests/setup/test-app.ts`
- [x] T033 Create top-level route mounting and versioned API namespace wiring in `src/modules/index.ts` and `src/swagger/routes.ts`

**Checkpoint**: Shared infrastructure supports tenant isolation, security, validation, versioned routing, Swagger composition, and test scaffolding.

---

## Phase 3: User Story 1 - Register a New Company with Its Owner (Priority: P1) 🎯 MVP

**Goal**: Allow a new business to create a Company and its initial Owner in one onboarding workflow while enforcing company uniqueness, auditability, and soft-delete rules.

**Independent Test**: Submit `POST /api/v1/companies` with valid onboarding data, then confirm the Company and Owner exist in the same tenant scope and can be retrieved through the Company view flow.

### Tests for User Story 1

- [x] T034 [P] [US1] Create unit tests for Company onboarding rules and Owner creation invariants in `tests/unit/company/create-company.use-case.test.ts`
- [x] T035 [P] [US1] Create repository integration tests for Company and User tenant-bound persistence in `tests/integration/company/company-user.persistence.test.ts`
- [x] T036 [P] [US1] Create API tests for `POST /api/v1/companies` success, validation, and duplicate-conflict behavior in `tests/api/company/create-company.api.test.ts`
- [x] T037 [P] [US1] Create API tests for `GET /api/v1/companies/{companyId}` and `PATCH /api/v1/companies/{companyId}` authorization behavior in `tests/api/company/company-read-update.api.test.ts`
- [x] T038 [P] [US1] Create API tests for `POST /api/v1/companies/{companyId}/archive` lifecycle rules in `tests/api/company/archive-company.api.test.ts`

### Implementation for User Story 1

- [x] T039 [P] [US1] Create Company domain entity, status value objects, and archive rules in `src/modules/company/domain/company.entity.ts`, `src/modules/company/domain/company-status.ts`, and `src/modules/company/domain/company-rules.ts`
- [x] T040 [P] [US1] Create User domain entity and Owner-role invariants used during onboarding in `src/modules/user/domain/user.entity.ts` and `src/modules/user/domain/user-rules.ts`
- [x] T041 [P] [US1] Create Company repository and User repository interfaces for onboarding flows in `src/modules/company/domain/company.repository.ts` and `src/modules/user/domain/user.repository.ts`
- [x] T042 [P] [US1] Create onboarding DTOs and Company request/response schemas in `src/modules/company/application/dto/create-company.request.ts`, `src/modules/company/application/dto/company.response.ts`, and `src/modules/company/presentation/company.schemas.ts`
- [x] T043 [US1] Implement Company uniqueness and lifecycle policy contracts in `src/modules/company/application/policies/company-onboarding.policy.ts`
- [x] T044 [US1] Implement `CreateCompanyWithOwnerUseCase` orchestration in `src/modules/company/application/use-cases/create-company-with-owner.use-case.ts`
- [x] T045 [US1] Implement `GetCompanyUseCase` and `UpdateCompanyUseCase` in `src/modules/company/application/use-cases/get-company.use-case.ts` and `src/modules/company/application/use-cases/update-company.use-case.ts`
- [x] T046 [US1] Implement `ArchiveCompanyUseCase` in `src/modules/company/application/use-cases/archive-company.use-case.ts`
- [x] T047 [US1] Implement Prisma Company repository with tenant-safe lookup/update behavior in `src/modules/company/infrastructure/company.prisma-repository.ts`
- [x] T048 [US1] Implement Prisma User repository support for Owner onboarding writes in `src/modules/user/infrastructure/user.prisma-repository.ts`
- [x] T049 [US1] Implement Company controller endpoints for create, view, update, and archive in `src/modules/company/presentation/company.controller.ts`
- [x] T050 [US1] Register Company routes and owner-only policy guards in `src/modules/company/presentation/company.routes.ts`
- [x] T051 [US1] Register Company module dependencies and route wiring in `src/modules/company/index.ts` and `src/config/container.ts`
- [x] T052 [US1] Add Company tag schemas and route definitions to Swagger assembly in `src/swagger/openapi.builder.ts` and `src/modules/company/presentation/company.openapi.ts`
- [x] T053 [US1] Add Company archive and owner-governance audit event emitters in `src/modules/company/application/services/company-audit.service.ts`

**Checkpoint**: Company onboarding, view, update, and archive flows work with Owner-only governance and same-tenant guarantees.

---

## Phase 4: User Story 2 - Authenticate and Operate Within a Company (Priority: P2)

**Goal**: Allow existing users to login, logout, refresh, and access protected identity routes with JWT-based company-bound sessions and strong tenant isolation.

**Independent Test**: Login with a valid user, call `/api/v1/users/me`, refresh the session, logout, and confirm further protected access is rejected or revoked appropriately.

### Tests for User Story 2

- [x] T054 [P] [US2] Create unit tests for password hashing, JWT issuance, and refresh rotation services in `tests/unit/auth/token-and-password.services.test.ts`
- [x] T055 [P] [US2] Create unit tests for login/logout/refresh use cases and session lifecycle rules in `tests/unit/auth/auth-lifecycle.use-cases.test.ts`
- [x] T056 [P] [US2] Create repository integration tests for refresh-session persistence and revocation in `tests/integration/auth/session.persistence.test.ts`
- [x] T057 [P] [US2] Create API tests for `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, and `POST /api/v1/auth/refresh` in `tests/api/auth/auth-session.api.test.ts`
- [x] T058 [P] [US2] Create API tests for unauthenticated, expired, revoked, and cross-company protected-access rejection in `tests/api/auth/protected-access.api.test.ts`
- [x] T059 [P] [US2] Create API tests for `GET /api/v1/users/me` in `tests/api/user/current-user.api.test.ts`
- [x] T060 [P] [US2] Create API tests for forgot-password placeholder contract behavior in `tests/api/auth/forgot-password.api.test.ts`

### Implementation for User Story 2

- [x] T061 [P] [US2] Create Session domain entity and lifecycle value objects in `src/modules/session/domain/refresh-session.entity.ts` and `src/modules/session/domain/session-status.ts`
- [x] T062 [P] [US2] Create Session repository interface and auth provider interfaces for login flows in `src/modules/session/domain/session.repository.ts` and `src/modules/auth/domain/auth-provider.contracts.ts`
- [x] T063 [P] [US2] Create auth request/response DTOs and Zod schemas in `src/modules/auth/application/dto/*.ts` and `src/modules/auth/presentation/auth.schemas.ts`
- [x] T064 [P] [US2] Create current-user DTOs and serializers in `src/modules/user/application/dto/current-user.response.ts`
- [x] T065 [US2] Implement bcrypt password hasher adapter in `src/modules/auth/infrastructure/bcrypt-password-hasher.ts`
- [x] T066 [US2] Implement JWT access/refresh token provider adapter in `src/modules/auth/infrastructure/jwt-token-provider.ts`
- [x] T067 [US2] Implement Prisma refresh-session repository with rotation and revoke semantics in `src/modules/session/infrastructure/session.prisma-repository.ts`
- [x] T068 [US2] Implement login credential verification and company lifecycle policy in `src/modules/auth/application/services/login-policy.service.ts`
- [x] T069 [US2] Implement `LoginUseCase` in `src/modules/auth/application/use-cases/login.use-case.ts`
- [x] T070 [US2] Implement `LogoutUseCase` in `src/modules/auth/application/use-cases/logout.use-case.ts`
- [x] T071 [US2] Implement `RefreshSessionUseCase` in `src/modules/auth/application/use-cases/refresh-session.use-case.ts`
- [x] T072 [US2] Implement forgot-password placeholder use case contract in `src/modules/auth/application/use-cases/forgot-password-placeholder.use-case.ts`
- [x] T073 [US2] Implement `GetCurrentUserUseCase` in `src/modules/user/application/use-cases/get-current-user.use-case.ts`
- [x] T074 [US2] Implement authentication controller endpoints in `src/modules/auth/presentation/auth.controller.ts`
- [x] T075 [US2] Implement user identity controller endpoint in `src/modules/user/presentation/user.controller.ts`
- [x] T076 [US2] Register auth and user routes in `src/modules/auth/presentation/auth.routes.ts` and `src/modules/user/presentation/user.routes.ts`
- [x] T077 [US2] Implement authentication principal resolver and company-bound middleware integration in `src/middleware/authentication.middleware.ts` and `src/middleware/company-resolution.middleware.ts`
- [x] T078 [US2] Implement auth/session audit event logging for login, refresh, logout, and failures in `src/modules/auth/application/services/auth-audit.service.ts`
- [x] T079 [US2] Register auth, user, and session module wiring in `src/modules/auth/index.ts`, `src/modules/user/index.ts`, `src/modules/session/index.ts`, and `src/config/container.ts`
- [x] T080 [US2] Add Authentication and Users route definitions to Swagger assembly in `src/modules/auth/presentation/auth.openapi.ts`, `src/modules/user/presentation/user.openapi.ts`, and `src/swagger/openapi.builder.ts`

**Checkpoint**: Auth flows, current-user retrieval, refresh rotation, logout invalidation, and protected access enforcement all work within one Company context.

---

## Phase 5: User Story 3 - Manage Employees and Roles Inside One Company (Priority: P3)

**Goal**: Allow Owner/Manager users to manage employee records and employee-user linkage inside one company while enforcing role rules, archive semantics, and cross-company isolation.

**Independent Test**: An authorized same-company administrator creates, updates, views, archives, and links an employee; cross-company linkage or access fails.

### Tests for User Story 3

- [x] T081 [P] [US3] Create unit tests for employee lifecycle and same-company linkage policies in `tests/unit/employee/employee-policies.test.ts`
- [x] T082 [P] [US3] Create repository integration tests for employee CRUD and same-company lookup behavior in `tests/integration/employee/employee.persistence.test.ts`
- [x] T083 [P] [US3] Create API tests for `POST /api/v1/employees`, `GET /api/v1/employees/{employeeId}`, and `PATCH /api/v1/employees/{employeeId}` in `tests/api/employee/employee-crud.api.test.ts`
- [x] T084 [P] [US3] Create API tests for `POST /api/v1/employees/{employeeId}/archive` and archived visibility rules in `tests/api/employee/archive-employee.api.test.ts`
- [x] T085 [P] [US3] Create API tests for `POST /api/v1/employees/{employeeId}/user-link` and cross-company mismatch rejection in `tests/api/employee/employee-user-link.api.test.ts`
- [x] T086 [P] [US3] Create API tests for role-based authorization differences between Owner, Manager, and Employee actors in `tests/api/employee/employee-role-access.api.test.ts`

### Implementation for User Story 3

- [x] T087 [P] [US3] Create Employee domain entity, role/value objects, and lifecycle invariants in `src/modules/employee/domain/employee.entity.ts`, `src/modules/employee/domain/employee-status.ts`, and `src/modules/employee/domain/employee-rules.ts`
- [x] T088 [P] [US3] Create Employee repository interface and employee-user linkage contracts in `src/modules/employee/domain/employee.repository.ts`
- [x] T089 [P] [US3] Create Employee request/response DTOs and Zod schemas in `src/modules/employee/application/dto/*.ts` and `src/modules/employee/presentation/employee.schemas.ts`
- [x] T090 [US3] Implement authorization policies for employee administration and linkage rules in `src/modules/employee/application/policies/employee-authorization.policy.ts`
- [x] T091 [US3] Implement `CreateEmployeeUseCase` in `src/modules/employee/application/use-cases/create-employee.use-case.ts`
- [x] T092 [US3] Implement `GetEmployeeUseCase` and `UpdateEmployeeUseCase` in `src/modules/employee/application/use-cases/get-employee.use-case.ts` and `src/modules/employee/application/use-cases/update-employee.use-case.ts`
- [x] T093 [US3] Implement `ArchiveEmployeeUseCase` in `src/modules/employee/application/use-cases/archive-employee.use-case.ts`
- [x] T094 [US3] Implement `LinkEmployeeToUserUseCase` in `src/modules/employee/application/use-cases/link-employee-to-user.use-case.ts`
- [x] T095 [US3] Implement Prisma Employee repository with tenant-safe linkage queries in `src/modules/employee/infrastructure/employee.prisma-repository.ts`
- [x] T096 [US3] Implement Employee controller endpoints for create, read, update, archive, and user-link in `src/modules/employee/presentation/employee.controller.ts`
- [x] T097 [US3] Implement Employee routes with Owner/Manager authorization guards in `src/modules/employee/presentation/employee.routes.ts`
- [x] T098 [US3] Implement employee audit service for create/update/archive/link events in `src/modules/employee/application/services/employee-audit.service.ts`
- [x] T099 [US3] Register Employee module wiring in `src/modules/employee/index.ts` and `src/config/container.ts`
- [x] T100 [US3] Add Employee route definitions and reusable schemas to Swagger assembly in `src/modules/employee/presentation/employee.openapi.ts` and `src/swagger/openapi.builder.ts`

**Checkpoint**: Employee management and user linkage work for authorized same-company actors, and all cross-company or invalid lifecycle actions are rejected.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize Prisma schema strategy artifacts, docs, Docker/CI alignment, and system-wide verification for P001.

- [x] T101 Create initial Prisma schema for `Company`, `User`, `Employee`, and `RefreshSession` following `data-model.md` and `plan.md` conventions in `prisma/schema.prisma`
- [x] T102 Create module-level OpenAPI reusable examples and common error response registrations in `src/swagger/common-examples.ts` and `src/swagger/common-responses.ts`
- [x] T103 Add Docker environment documentation and service assumptions for P001 validation in `README.md` and `specs/002-company-identity-foundation/quickstart.md`
- [x] T104 Update CI workflow to run P001-specific unit, integration, and API tests plus Prisma generation in `.github/workflows/ci.yml`
- [x] T105 Add rate-limit, CORS allowlist, JWT secret, and bcrypt env variable documentation to `README.md` and `.env.example`
- [x] T106 Validate all quickstart scenarios and acceptance criteria for P001 using `specs/002-company-identity-foundation/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — **BLOCKS all user stories**
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **User Story 2 (Phase 4)**: Depends on US1 because login/current-user flows require company and owner onboarding to exist
- **User Story 3 (Phase 5)**: Depends on US2 because protected employee management requires authenticated company-bound access
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: First deliverable and MVP — no dependency on other stories after Foundational
- **US2 (P2)**: Requires User and Session foundations plus existing Company/Owner onboarding from US1
- **US3 (P3)**: Requires Company ownership, authenticated context, and role policies from US1 + US2

### Within Each User Story

- Tests should be written before or alongside implementation for the same behavior
- Domain entities and repository interfaces come before use cases
- Use cases and policies come before controllers/routes
- Controllers/routes come before Swagger integration and end-to-end validation

### Parallel Opportunities

- **Phase 1**: T002 and T006 can run in parallel after T001
- **Phase 2**: T009–T010, T019–T020, and T030–T032 can run in parallel once directory structure exists
- **US1**: T034–T038 and T039–T042 can run in parallel; repository and controller tasks follow
- **US2**: T054–T060 and T061–T064 can run in parallel; provider and use-case tasks then converge
- **US3**: T081–T086 and T087–T089 can run in parallel; policies and use cases then converge

---

## Parallel Example: User Story 1

```bash
# Launch Company onboarding tests in parallel:
Task T034: "Create unit tests for Company onboarding rules in tests/unit/company/create-company.use-case.test.ts"
Task T036: "Create API tests for POST /api/v1/companies in tests/api/company/create-company.api.test.ts"
Task T038: "Create API tests for POST /api/v1/companies/{companyId}/archive in tests/api/company/archive-company.api.test.ts"

# Launch core domain artifacts in parallel:
Task T039: "Create Company domain entity in src/modules/company/domain/company.entity.ts"
Task T040: "Create User domain entity invariants in src/modules/user/domain/user.entity.ts"
Task T041: "Create Company and User repository interfaces in src/modules/company/domain/company.repository.ts and src/modules/user/domain/user.repository.ts"
Task T042: "Create onboarding DTOs and Company schemas in src/modules/company/application/dto/ and src/modules/company/presentation/company.schemas.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Verify Company creation, Company retrieval, Owner linkage, and Company archive rules
5. Demo tenant onboarding as the first reusable platform milestone

### Incremental Delivery

1. Setup + Foundational → shared platform foundation ready
2. Add US1 → tenant onboarding MVP
3. Add US2 → authenticated company-bound identity foundation
4. Add US3 → employee and role administration foundation
5. Polish → schema finalization, docs, CI, and cross-cutting validation

### Parallel Team Strategy

With multiple developers after Foundational:

- Developer A: US1 onboarding domain, repositories, and Company API
- Developer B: prepares auth/session provider and tests, then executes US2 after US1 foundation merges
- Developer C: prepares employee tests and DTOs, then executes US3 after auth context is available

---

## Notes

- Do NOT implement future modules such as Organization, Workforce, Transactions, Trips, Expenses, Analytics, or Reports in this feature
- Every protected repository and policy path must include `companyId` as an explicit input
- User and Employee remain separate models with optional same-company linkage
- Refresh tokens must be stored as hashes and support revocation/rotation
- All protected routes must follow the standard response envelope and client-safe error format
- Total tasks: **106**
