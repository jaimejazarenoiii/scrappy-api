---
description: 'Task list for Initial Project Setup feature'
---

# Tasks: Initial Project Setup

**Input**: Design documents from `/specs/001-initial-project-setup/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/openapi.yaml, quickstart.md

**Tests**: Included — spec FR-021 requires health endpoint test; plan Phase 11 defines root, health, and unit tests.

**Organization**: Tasks grouped by user story after shared setup and foundational phases.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 = Developer boots locally, US2 = Operator runs via Docker, US3 = Team validates quality on every change

## Path Conventions

Scrappy API Clean Architecture (see plan.md):

- **Domain**: `src/domain/`
- **Application**: `src/application/`
- **Infrastructure**: `src/infrastructure/`
- **Presentation**: `src/presentation/`
- **Shared**: `src/shared/`
- **Tests**: `tests/unit/`, `tests/integration/`
- **Schema**: `prisma/schema.prisma`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization — pnpm, TypeScript strict mode, Express stubs, folder structure

- [x] T001 Create `package.json` with name `scrappy-api`, version `1.0.0`, `"type": "module"`, and scripts (`dev`, `build`, `start`, `lint`, `lint:fix`, `format`, `format:check`, `test`, `test:watch`, `prisma:generate`, `prisma:migrate`, `prisma:studio`, `prepare`) in `package.json`
- [x] T002 Create `tsconfig.json` with `strict: true`, `noImplicitAny: true`, `module: NodeNext`, `moduleResolution: NodeNext`, `outDir: dist`, `rootDir: src` in `tsconfig.json`
- [x] T003 [P] Create Clean Architecture directory tree with `.gitkeep` in `src/application/{dtos,interfaces,services,use-cases}/`, `src/domain/{entities,repositories,value-objects,errors}/`, `src/infrastructure/database/{prisma,migrations,repositories}/`, `src/infrastructure/{logger,config,providers}/`, `src/presentation/{controllers,middlewares,routes,validators,docs}/`, `src/shared/{constants,utils,types,errors}/`
- [x] T004 Install runtime dependencies (`express`, `dotenv`, `zod`, `pino`, `pino-http`) via pnpm in `package.json`
- [x] T005 [P] Install dev dependencies (`typescript`, `tsx`, `@types/node`, `@types/express`, `vitest`, `supertest`, `@types/supertest`, `prisma`, `@prisma/client`) via pnpm in `package.json`
- [x] T006 Create stub Express app export in `src/app.ts`
- [x] T007 Create stub HTTP server entry in `src/server.ts`

**Checkpoint**: `pnpm install` succeeds; directory tree matches plan.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Code quality, configuration, logging, database scaffold, app shell, error handling, validation — MUST complete before user story work

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 [P] Configure ESLint flat config with TypeScript-eslint and `no-explicit-any` rule in `eslint.config.js`
- [x] T009 [P] Configure Prettier in `.prettierrc` and `.prettierignore`
- [x] T010 [P] Add EditorConfig in `.editorconfig`
- [x] T011 [P] Add `.gitignore` for `node_modules`, `dist`, `.env`, `coverage`, and build artifacts at repository root
- [x] T012 Configure Husky `prepare` script and pre-commit hook running lint-staged in `.husky/pre-commit` and `package.json`
- [x] T013 Create `.env.example` with `PORT`, `DATABASE_URL`, `NODE_ENV`, `LOG_LEVEL` in `.env.example`
- [x] T014 Create Zod environment schema in `src/infrastructure/config/env.schema.ts`
- [x] T015 Create centralized config module parsing env at startup in `src/infrastructure/config/index.ts`
- [x] T016 Create Pino logger instance with log level from config in `src/infrastructure/logger/pino.logger.ts`
- [x] T017 Create request/response logging middleware with request ID and secret redaction in `src/presentation/middlewares/request-logger.middleware.ts`
- [x] T018 Create Prisma schema with generator and PostgreSQL datasource only (no models) in `prisma/schema.prisma`
- [x] T019 Create Prisma client singleton with graceful disconnect in `src/infrastructure/database/prisma/client.ts`
- [x] T020 [P] Create `AppError` base class in `src/domain/errors/app.error.ts`
- [x] T021 [P] Create `NotFoundError` class in `src/domain/errors/not-found.error.ts`
- [x] T022 [P] Create `ValidationError` class in `src/domain/errors/validation.error.ts`
- [x] T023 [P] Create API response envelope types in `src/shared/types/api-response.type.ts`
- [x] T024 Create `success()` and `failure()` response helpers in `src/shared/utils/api-response.ts`
- [x] T025 Create application constants (`API_NAME`, etc.) in `src/shared/constants/app.constants.ts`
- [x] T026 Implement Express app factory with JSON parser, request logger, route mount point, not-found, and error handler slots in `src/app.ts`
- [x] T027 Create manual DI composition root scaffold in `src/infrastructure/providers/container.ts`
- [x] T028 Implement server bootstrap loading dotenv, config, container, and graceful shutdown in `src/server.ts`
- [x] T029 Create route aggregator mounting route modules in `src/presentation/routes/index.ts`
- [x] T030 Create global error middleware mapping errors to standard envelope in `src/presentation/middlewares/error.middleware.ts`
- [x] T031 Create not-found middleware returning 404 envelope in `src/presentation/middlewares/not-found.middleware.ts`
- [x] T032 Create generic Zod validation middleware in `src/presentation/middlewares/validate.middleware.ts`
- [x] T033 Add validators scaffold `.gitkeep` in `src/presentation/validators/.gitkeep`

**Checkpoint**: Server starts with valid `.env`; invalid/missing env vars fail with clear error; `pnpm prisma:generate` succeeds

---

## Phase 3: User Story 1 — Developer Boots the Service Locally (Priority: P1) 🎯 MVP

**Goal**: Runnable local service with `GET /`, `GET /health`, and Swagger at `/docs` per `contracts/openapi.yaml`

**Independent Test**: `pnpm dev` → curl `GET /` and `GET /health` return standard envelope; `/docs` lists only bootstrap endpoints

### Implementation for User Story 1

- [x] T034 [P] [US1] Create `ServiceIdentity` value object in `src/domain/value-objects/service-identity.ts`
- [x] T035 [P] [US1] Create root response DTO in `src/application/dtos/root-response.dto.ts`
- [x] T036 [P] [US1] Create health response DTO in `src/application/dtos/health-response.dto.ts`
- [x] T037 [P] [US1] Create health check interface in `src/application/interfaces/health-check.interface.ts`
- [x] T038 [US1] Create Prisma health indicator executing `SELECT 1` in `src/infrastructure/providers/health-indicator.ts`
- [x] T039 [US1] Create `HealthCheckService` in `src/application/services/health-check.service.ts`
- [x] T040 [P] [US1] Create `GetRootUseCase` returning service identity in `src/application/use-cases/get-root.use-case.ts`
- [x] T041 [US1] Create `GetHealthUseCase` delegating to health service in `src/application/use-cases/get-health.use-case.ts`
- [x] T042 [P] [US1] Create `RootController` delegating to `GetRootUseCase` in `src/presentation/controllers/root.controller.ts`
- [x] T043 [US1] Create `HealthController` delegating to `GetHealthUseCase` in `src/presentation/controllers/health.controller.ts`
- [x] T044 [US1] Create health routes and mount `GET /` and `GET /health` in `src/presentation/routes/health.routes.ts`
- [x] T045 [US1] Wire use cases, controllers, and routes in `src/infrastructure/providers/container.ts` and `src/presentation/routes/index.ts`
- [x] T046 [US1] Install and configure `swagger-jsdoc` and `swagger-ui-express` in `package.json`
- [x] T047 [US1] Create Swagger config with JSDoc annotations for bootstrap endpoints in `src/presentation/docs/swagger.config.ts`
- [x] T048 [US1] Mount Swagger UI at `/docs` in `src/app.ts`

### Tests for User Story 1

- [x] T049 [P] [US1] Create Vitest ESM config in `vitest.config.ts`
- [x] T050 [P] [US1] Create root endpoint integration test in `tests/integration/root.test.ts`
- [x] T051 [US1] Create health endpoint integration test in `tests/integration/health.test.ts`
- [x] T052 [P] [US1] Create `GetHealthUseCase` unit test with mocked indicator in `tests/unit/get-health.use-case.test.ts`

**Checkpoint**: `pnpm build`, `pnpm lint`, and `pnpm test` pass; endpoints match `specs/001-initial-project-setup/contracts/openapi.yaml`

---

## Phase 4: User Story 2 — Operator Runs via Containers (Priority: P2)

**Goal**: Full stack (API + PostgreSQL) starts via Docker Compose with healthy bootstrap endpoints

**Independent Test**: `docker compose up --build` → `GET /health` returns healthy when postgres is up

### Implementation for User Story 2

- [x] T053 [P] [US2] Create multi-stage `Dockerfile` with pnpm build, prisma generate, and slim runtime at repository root
- [x] T054 [P] [US2] Create `docker-compose.yml` with `api` and `postgres` services, env, volumes, and healthchecks at repository root
- [x] T055 [US2] Create `.dockerignore` excluding `node_modules`, `.git`, and local env files at repository root

**Checkpoint**: `docker compose up --build` yields 200 on `/` and healthy `/health` response

---

## Phase 5: User Story 3 — Team Validates Quality on Every Change (Priority: P3)

**Goal**: GitHub Actions runs install, lint, build, and tests on every push/PR

**Independent Test**: Open PR → CI pipeline passes all stages on baseline branch

### Implementation for User Story 3

- [x] T056 [US3] Create GitHub Actions CI workflow with Node 22, pnpm, `prisma:generate`, lint, build, and test in `.github/workflows/ci.yml`

**Checkpoint**: CI workflow green; lint violation fails pipeline

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and final validation

- [x] T057 Create comprehensive `README.md` with overview, architecture, folder structure, setup, env vars, Docker, scripts, and future roadmap at repository root
- [x] T058 Validate all acceptance criteria in `specs/001-initial-project-setup/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user stories**
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on US1 (needs working app to containerize)
- **User Story 3 (Phase 5)**: Depends on US1 (tests must exist); can parallelize with US2 after US1
- **Polish (Phase 6)**: Depends on US1, US2, and US3

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — no dependency on US2/US3
- **US2 (P2)**: Depends on US1 application code being complete
- **US3 (P3)**: Depends on US1 tests and lint/build scripts; independent of US2

### Within Each User Story

- Domain/application layer before controllers
- Controllers and routes before DI wiring
- Endpoints before Swagger annotations
- Implementation before integration tests (unit tests can parallelize)

### Parallel Opportunities

- **Phase 1**: T003, T005 parallel after T001
- **Phase 2**: T008–T011, T020–T022 parallel; T030–T032 parallel after T026
- **Phase 3 (US1)**: T034–T037, T040, T042 parallel; T049–T050, T052 parallel after endpoints
- **Phase 4 (US2)**: T053–T054 parallel
- **After US1**: US2 and US3 can proceed in parallel

---

## Parallel Example: User Story 1

```bash
# Launch DTOs and value objects together:
Task T034: "Create ServiceIdentity value object in src/domain/value-objects/service-identity.ts"
Task T035: "Create root response DTO in src/application/dtos/root-response.dto.ts"
Task T036: "Create health response DTO in src/application/dtos/health-response.dto.ts"
Task T037: "Create health check interface in src/application/interfaces/health-check.interface.ts"

# Launch controllers in parallel (after use cases):
Task T042: "Create RootController in src/presentation/controllers/root.controller.ts"
# T043 depends on T041 (GetHealthUseCase)

# Launch tests in parallel (after T048):
Task T050: "Create root endpoint integration test in tests/integration/root.test.ts"
Task T052: "Create GetHealthUseCase unit test in tests/unit/get-health.use-case.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run quickstart curl checks for `/`, `/health`, `/docs`
5. Demo runnable local API

### Incremental Delivery

1. Setup + Foundational → infrastructure ready
2. Add US1 → local dev MVP (root, health, swagger, tests)
3. Add US2 → Docker Compose for operators
4. Add US3 → CI pipeline for team quality gates
5. Polish → README and quickstart validation

### Parallel Team Strategy

With multiple developers after Foundational:

- Developer A: US1 endpoints and tests (Phase 3)
- Developer B: waits for US1, then US2 Docker (Phase 4)
- Developer C: waits for US1 tests, then US3 CI (Phase 5)

---

## Notes

- Do NOT implement auth, users, customers, inventory, sales, reports, or any business features (FR-024)
- Helmet, CORS, and rate limiting deferred per plan Complexity Tracking
- All responses use constitution standard envelope (`success`, `data`, `meta`, `error`)
- Prisma schema has no models and no migrations in this feature
- Total tasks: **58** (Setup: 7, Foundational: 26, US1: 19, US2: 3, US3: 1, Polish: 2)
