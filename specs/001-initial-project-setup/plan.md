# Implementation Plan: Initial Project Setup

**Branch**: `001-initial-project-setup` | **Date**: 2026-07-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-initial-project-setup/spec.md`

**Note**: This plan establishes a production-ready backend foundation only. No business features,
authentication, or domain models are implemented.

## Summary

Initialize **Scrappy API** — a Clean Architecture Express backend for a Philippines junkshop
management system. Deliver a runnable, testable, containerized project with strict TypeScript,
centralized configuration, structured logging, Prisma/PostgreSQL scaffolding (no models),
bootstrap endpoints (`GET /`, `GET /health`), Swagger at `/docs`, quality tooling (ESLint,
Prettier, Husky), Vitest tests, Docker Compose, GitHub Actions CI, and comprehensive README.

Technical approach: pnpm + Node.js 22 LTS + ESM TypeScript; manual DI composition root;
application use cases delegate from thin controllers; constitution-standard API envelope on all
responses.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode) on Node.js 22.x LTS

**Primary Dependencies**: Express.js, Prisma, Zod, Pino, pino-http, swagger-ui-express,
swagger-jsdoc, dotenv, Vitest, supertest, ESLint, Prettier, Husky, lint-staged

**Storage**: PostgreSQL via Prisma (scaffold only — no models/migrations)

**Testing**: Vitest + supertest (integration tests for HTTP layer)

**Target Platform**: Linux server (Docker); local dev via docker-compose

**Project Type**: web-service (REST API backend)

**Performance Goals**: Bootstrap endpoints respond in < 100ms p95 on local hardware (non-binding;
no load testing in this feature)

**Constraints**: No business logic; no auth; no Helmet/CORS/rate-limit until auth spec (see
Complexity Tracking); standard API envelope mandatory

**Scale/Scope**: 2 HTTP endpoints, empty Prisma schema, ~40 source files across 5 layers

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate                                 | Pre-Design  | Post-Design | Notes                                              |
| ------------------------------------ | ----------- | ----------- | -------------------------------------------------- |
| Layer boundaries                     | ✅          | ✅          | Prisma isolated in `infrastructure/database/`      |
| No business logic in controllers     | ✅          | ✅          | Controllers call use cases only                    |
| Repository pattern                   | ✅          | ✅          | Directories scaffolded; no concrete repos yet      |
| Dependency injection                 | ✅          | ✅          | `container.ts` composition root                    |
| Zod validation                       | ✅          | ✅          | Env validation + validation middleware scaffold    |
| DTOs                                 | ✅          | ✅          | `application/dtos/` for root and health            |
| Standard response envelope           | ✅          | ✅          | All endpoints use `{ success, data, meta, error }` |
| Pagination conventions               | N/A         | N/A         | No list endpoints in bootstrap                     |
| Security (JWT, bcrypt, Helmet, CORS) | ⚠️ Deferred | ⚠️ Deferred | See Complexity Tracking                            |
| No `any`                             | ✅          | ✅          | strict TS enforced                                 |
| Error handling                       | ✅          | ✅          | Global middleware + error classes                  |
| Logging                              | ✅          | ✅          | Pino + request ID + redaction                      |
| Tests                                | ✅          | ✅          | Vitest integration tests for `/` and `/health`     |
| OpenAPI                              | ✅          | ✅          | `/docs` + `contracts/openapi.yaml`                 |
| Simplicity                           | ✅          | ✅          | No DI framework; minimal dependencies              |

## Project Structure

### Documentation (this feature)

```text
specs/001-initial-project-setup/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
└── tasks.md              # Created by /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── application/
│   ├── dtos/
│   │   ├── root-response.dto.ts
│   │   └── health-response.dto.ts
│   ├── interfaces/
│   │   └── health-check.interface.ts
│   ├── services/
│   │   └── health-check.service.ts
│   └── use-cases/
│       ├── get-root.use-case.ts
│       └── get-health.use-case.ts
│
├── domain/
│   ├── entities/              # empty (.gitkeep)
│   ├── repositories/          # empty (.gitkeep) — interfaces in future specs
│   ├── value-objects/
│   │   └── service-identity.ts
│   └── errors/
│       ├── app.error.ts
│       ├── not-found.error.ts
│       └── validation.error.ts
│
├── infrastructure/
│   ├── database/
│   │   ├── prisma/
│   │   │   └── client.ts
│   │   ├── migrations/        # empty until first model spec
│   │   └── repositories/      # empty (.gitkeep)
│   ├── logger/
│   │   └── pino.logger.ts
│   ├── config/
│   │   ├── env.schema.ts
│   │   └── index.ts
│   └── providers/
│       ├── container.ts
│       └── health-indicator.ts
│
├── presentation/
│   ├── controllers/
│   │   ├── root.controller.ts
│   │   └── health.controller.ts
│   ├── middlewares/
│   │   ├── error.middleware.ts
│   │   ├── not-found.middleware.ts
│   │   ├── request-logger.middleware.ts
│   │   └── validate.middleware.ts
│   ├── routes/
│   │   ├── index.ts
│   │   └── health.routes.ts
│   ├── validators/            # empty scaffold (.gitkeep)
│   └── docs/
│       └── swagger.config.ts
│
├── shared/
│   ├── constants/
│   │   └── app.constants.ts
│   ├── utils/
│   │   └── api-response.ts
│   ├── types/
│   │   └── api-response.type.ts
│   └── errors/                # shared error codes if needed
│
├── app.ts
└── server.ts

prisma/
└── schema.prisma              # generator + datasource only

tests/
├── integration/
│   ├── root.test.ts
│   └── health.test.ts
└── unit/
    └── get-health.use-case.test.ts

.github/
└── workflows/
    └── ci.yml

.env.example
.editorconfig
.eslintrc.cjs (or eslint.config.js)
.prettierrc
.gitignore
Dockerfile
docker-compose.yml
package.json
pnpm-lock.yaml
tsconfig.json
vitest.config.ts
README.md
```

**Structure Decision**: Matches user-specified Clean Architecture layout. Prisma schema at repo
root per CLI convention; client wrapper in `infrastructure/database/prisma/`. Docker files at
repository root.

## Implementation Phases

Phases are sequential unless marked parallelizable `[P]`. Each phase lists deliverables and
dependencies.

---

### Phase 1 — Project Initialization

**Depends on**: nothing (entry point)

**Deliverables**:

- `package.json` with pnpm, `"type": "module"`, project metadata (`name: scrappy-api`, `version: 1.0.0`)
- `tsconfig.json` — `strict: true`, `noImplicitAny`, `module: NodeNext`, `outDir: dist`,
  `rootDir: src`, path aliases optional (`@/` → `src/`)
- Core dependencies installed: `express`, `dotenv`, `zod`, `pino`, `pino-http`
- Dev dependencies: `typescript`, `tsx`, `@types/node`, `@types/express`, `vitest`, `supertest`,
  `@types/supertest`
- Scripts: `dev`, `build`, `start`, `lint`, `lint:fix`, `format`, `format:check`, `test`,
  `test:watch`, `prisma:generate`, `prisma:migrate`, `prisma:studio`
- Base folder structure created (all directories above with `.gitkeep` where empty)
- Stub `src/app.ts` and `src/server.ts`

**Exit criteria**: `pnpm install` succeeds; directory tree matches structure above.

---

### Phase 2 — Code Quality

**Depends on**: Phase 1

**Deliverables**:

- ESLint flat config (`eslint.config.js`) — TypeScript-eslint, import rules, no `any` rule
- Prettier (`.prettierrc`, `.prettierignore`)
- EditorConfig (`.editorconfig`)
- `.gitignore` — `node_modules`, `dist`, `.env`, coverage, etc.
- Husky — `prepare` script, `.husky/pre-commit`
- lint-staged — ESLint + Prettier on staged `*.{ts,json,md}`

**Exit criteria**: `pnpm lint` runs; Husky hook fires on commit attempt.

---

### Phase 3 — Configuration

**Depends on**: Phase 1

**Deliverables**:

- `.env.example` — `PORT`, `DATABASE_URL`, `NODE_ENV`, `LOG_LEVEL`
- `src/infrastructure/config/env.schema.ts` — Zod schema
- `src/infrastructure/config/index.ts` — parse env at import; throw on invalid config
- `dotenv` loaded in `server.ts` before config import

**Exit criteria**: Missing `DATABASE_URL` causes clear startup failure message.

---

### Phase 4 — Logging

**Depends on**: Phase 3

**Deliverables**:

- `src/infrastructure/logger/pino.logger.ts` — Pino instance, log level from config
- `src/presentation/middlewares/request-logger.middleware.ts` — pino-http with:
  - Request ID (`genReqId` / `x-request-id`)
  - Redaction: `authorization`, `cookie`, `password`, `DATABASE_URL`
- Error logging integrated in error middleware (Phase 7)

**Exit criteria**: Dev server logs structured JSON per request; secrets not logged.

---

### Phase 5 — Database

**Depends on**: Phase 3

**Deliverables**:

- `prisma`, `@prisma/client` dependencies
- `prisma/schema.prisma` — generator + postgresql datasource only (no models)
- `src/infrastructure/database/prisma/client.ts` — singleton with graceful disconnect
- `pnpm prisma:generate` script verified

**Exit criteria**: `pnpm prisma:generate` succeeds without migrations.

---

### Phase 6 — Application Foundation

**Depends on**: Phases 3, 4, 5

**Deliverables**:

- `src/app.ts` — Express app factory: JSON parser, request logger, routes, not-found, error handler
- `src/server.ts` — load config, build container, start HTTP server, graceful shutdown
- `src/infrastructure/providers/container.ts` — wire use cases, services, controllers
- `src/presentation/routes/index.ts` — mount route modules

**Exit criteria**: Server starts and returns 404 for unknown routes (before Phase 7 error polish).

---

### Phase 7 — Error Handling

**Depends on**: Phase 6

**Deliverables**:

- `src/domain/errors/` — `AppError`, `NotFoundError`, `ValidationError`
- `src/shared/types/api-response.type.ts` — envelope types
- `src/shared/utils/api-response.ts` — `success()`, `failure()` helpers
- `src/presentation/middlewares/error.middleware.ts` — map errors to envelope; hide internals
- `src/presentation/middlewares/not-found.middleware.ts` — 404 for undefined routes

**Exit criteria**: Unknown route returns 404 envelope; thrown `AppError` returns correct status.

---

### Phase 8 — Validation

**Depends on**: Phase 6

**Deliverables**:

- `src/presentation/middlewares/validate.middleware.ts` — generic Zod schema middleware
- `src/presentation/validators/` — scaffold README or `.gitkeep`
- Env validation already in Phase 3 (shared Zod pattern)

**Exit criteria**: Middleware usable by future routes; no bootstrap endpoint requires body validation.

---

### Phase 9 — API Endpoints

**Depends on**: Phases 6, 7, 8

**Deliverables**:

| Endpoint      | Layer flow                                                                               |
| ------------- | ---------------------------------------------------------------------------------------- |
| `GET /`       | `RootController` → `GetRootUseCase` → returns `ServiceIdentity` DTO in envelope          |
| `GET /health` | `HealthController` → `GetHealthUseCase` → `HealthCheckService` → `PrismaHealthIndicator` |

- `src/application/use-cases/get-root.use-case.ts`
- `src/application/use-cases/get-health.use-case.ts`
- `src/application/services/health-check.service.ts`
- `src/infrastructure/providers/health-indicator.ts` — `SELECT 1` via Prisma
- Controllers return envelope via `api-response` helper; no logic in controllers

**Exit criteria**: Both endpoints match [contracts/openapi.yaml](./contracts/openapi.yaml).

---

### Phase 10 — API Documentation

**Depends on**: Phase 9

**Deliverables**:

- `swagger-jsdoc`, `swagger-ui-express` dependencies
- `src/presentation/docs/swagger.config.ts`
- Route JSDoc annotations for `/` and `/health`
- Mount Swagger UI at `/docs`

**Exit criteria**: `/docs` lists exactly two endpoints; spec matches contract.

---

### Phase 11 — Testing

**Depends on**: Phase 9

**Deliverables**:

- `vitest.config.ts` — ESM, coverage optional
- `tests/integration/root.test.ts` — asserts envelope + identity fields
- `tests/integration/health.test.ts` — mocks health indicator or uses test DB
- `tests/unit/get-health.use-case.test.ts` — unit test with mocked indicator

**Exit criteria**: `pnpm test` passes locally and in CI.

---

### Phase 12 — Docker

**Depends on**: Phases 5, 6, 9

**Deliverables**:

- `Dockerfile` — multi-stage: build (pnpm install, prisma generate, tsc) → slim runtime
- `docker-compose.yml` — services:
  - `postgres` — PostgreSQL 16, volume, healthcheck
  - `api` — build context, env from compose, depends_on postgres
- `.dockerignore`

**Exit criteria**: `docker compose up --build` → healthy responses from `/` and `/health`.

---

### Phase 13 — CI/CD

**Depends on**: Phases 2, 11, 12

**Deliverables**:

- `.github/workflows/ci.yml`:
  - Trigger: push, pull_request
  - Steps: checkout → setup Node 22 → setup pnpm → `pnpm install --frozen-lockfile` →
    `pnpm prisma:generate` → `pnpm lint` → `pnpm build` → `pnpm test`
  - Optional: PostgreSQL service container for integration tests

**Exit criteria**: Workflow green on default branch.

---

### Phase 14 — Documentation

**Depends on**: All prior phases

**Deliverables**:

- `README.md` sections:
  - Project overview (Scrappy — junkshop management, Philippines)
  - Architecture diagram (layer diagram)
  - Folder structure (abbreviated tree)
  - Prerequisites
  - Local setup (pnpm)
  - Environment variables table
  - Docker usage
  - Development workflow (branching, hooks, CI)
  - Available scripts table
  - Future roadmap (auth, customers, inventory, sales, reports — separate specs)

**Exit criteria**: New developer can follow README + [quickstart.md](./quickstart.md) within 15 minutes.

---

## Phase Dependency Graph

```text
Phase 1 (Init)
    ├── Phase 2 (Quality)
    ├── Phase 3 (Config)
    │       ├── Phase 4 (Logging)
    │       └── Phase 5 (Database)
    │               └── Phase 6 (App Foundation)
    │                       ├── Phase 7 (Errors)
    │                       ├── Phase 8 (Validation)
    │                       └── Phase 9 (Endpoints)
    │                               ├── Phase 10 (Swagger)
    │                               ├── Phase 11 (Testing)
    │                               └── Phase 12 (Docker)
    │                                       └── Phase 13 (CI)
    └── Phase 14 (Docs) ← after all above
```

## Complexity Tracking

| Violation                            | Why Needed                                                     | Simpler Alternative Rejected Because                                                                           |
| ------------------------------------ | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| JWT auth & bcrypt not implemented    | FR-024 / spec Assumptions — auth is a future feature           | Implementing auth now expands scope beyond bootstrap and blocks focused delivery                               |
| Helmet, CORS, rate limiting deferred | Spec Assumptions defer hardening until public exposure defined | Adding now without allowlist/CORS policy risks incorrect production config; auth spec will define requirements |
| Repository interfaces empty          | No business entities yet (FR-013)                              | Creating dummy repositories violates YAGNI; directory scaffolding establishes pattern                          |
| Manual DI vs framework               | Only 2 use cases in bootstrap                                  | DI framework adds dependency before container has meaningful bindings                                          |

## Artifacts Generated

| Artifact           | Path                                               | Phase                |
| ------------------ | -------------------------------------------------- | -------------------- |
| Research decisions | [research.md](./research.md)                       | 0                    |
| Data model         | [data-model.md](./data-model.md)                   | 1                    |
| API contract       | [contracts/openapi.yaml](./contracts/openapi.yaml) | 1                    |
| Validation guide   | [quickstart.md](./quickstart.md)                   | 1                    |
| Task breakdown     | `tasks.md`                                         | 2 (`/speckit-tasks`) |

## Acceptance Criteria (Implementation Complete)

- [ ] Application builds (`pnpm build`)
- [ ] Application runs locally (`pnpm dev`)
- [ ] Docker starts (`docker compose up`)
- [ ] PostgreSQL connects (health check passes)
- [ ] Prisma Client generates (`pnpm prisma:generate`)
- [ ] Swagger at `/docs`
- [ ] `GET /` and `GET /health` return successful responses per contract
- [ ] Lint passes (`pnpm lint`)
- [ ] Tests pass (`pnpm test`)
- [ ] Clean Architecture structure and constitution gates satisfied
- [ ] No business features implemented

## Next Step

Run **`/speckit-tasks`** to generate `tasks.md` with dependency-ordered, file-level tasks for
`/speckit-implement`.
