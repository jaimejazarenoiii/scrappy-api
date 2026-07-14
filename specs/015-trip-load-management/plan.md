# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript (strict mode) on Node.js LTS

**Primary Dependencies**: Express.js, Prisma, Zod, Pino, bcrypt, JWT, Helmet, CORS, rate-limiter

**Storage**: PostgreSQL via Prisma ORM (infrastructure layer only)

**Testing**: Vitest (unit, integration, contract)

**Target Platform**: Linux server (Docker); local dev via docker-compose

**Project Type**: web-service (REST API backend)

**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]

**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]

**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify each gate against `.specify/memory/constitution.md` (v1.0.0+):

- [ ] **Layer boundaries** — domain has no infra/presentation imports; Prisma confined to
      infrastructure repositories
- [ ] **No business logic in controllers** — controllers delegate to application services only
- [ ] **Repository pattern** — all database access behind repository interfaces
- [ ] **Dependency injection** — services/repos wired via DI container, not `new` in controllers
- [ ] **Zod validation** — every new/changed endpoint has request validation at the boundary
- [ ] **DTOs** — request/response shapes defined; domain entities do not leak to HTTP
- [ ] **Standard response envelope** — success/error format per constitution
- [ ] **Pagination conventions** — list endpoints use `page`, `limit`, `sortBy`, `sortOrder`
- [ ] **Security** — auth (JWT + refresh), bcrypt for passwords, Helmet/CORS/rate-limit as needed
- [ ] **No `any`** — strict TypeScript; JSDoc on exported functions
- [ ] **Error handling** — global middleware; no internal errors exposed to clients
- [ ] **Logging** — Pino structured logs with correlation IDs for request flows
- [ ] **Tests** — Vitest coverage for services and cross-layer behavior
- [ ] **OpenAPI** — contract updated for API surface changes
- [ ] **Simplicity** — new dependencies justified; Complexity Tracking filled if violating YAGNI

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── application/          # Use cases, application services, DTO mappers
├── domain/               # Entities, value objects, repository interfaces
├── infrastructure/       # Prisma repos, external services, DI container
├── presentation/         # Controllers, routes, middleware, OpenAPI
└── shared/               # Cross-cutting types, errors, utilities

prisma/
└── schema.prisma

tests/
├── unit/
├── integration/
└── contract/

docker/
├── Dockerfile
└── docker-compose.yml

.github/
└── workflows/            # CI: lint, test, build
```

**Structure Decision**: Clean Architecture monorepo per Scrappy API Constitution Principle I.
Controllers live in `presentation/`; business logic in `application/`; Prisma access only in
`infrastructure/` repositories.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
