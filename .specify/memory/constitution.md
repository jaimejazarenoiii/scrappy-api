<!--
Sync Impact Report
==================
Version change: (template/unratified) → 1.0.0
Modified principles: N/A (initial ratification)
Added sections:
  - Core Principles (7 principles)
  - Technology Stack
  - Development Workflow & Quality Gates
  - Governance
Removed sections: N/A
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ updated
  - .specify/templates/spec-template.md ✅ updated (no structural changes; aligned references)
  - .specify/templates/tasks-template.md ✅ updated
  - .specify/templates/commands/*.md ⚠ not present (skipped)
  - README.md ⚠ not present (skipped)
Follow-up TODOs: None
-->

# Scrappy API Constitution

## Core Principles

### I. Clean Architecture & Layer Separation

All code MUST follow Clean Architecture with strict dependency direction: outer layers depend on
inner layers; the domain layer MUST NOT depend on infrastructure or presentation concerns.

**Required project layers** (under `src/`):

- `application` — use cases, application services, orchestration
- `domain` — entities, value objects, domain services, repository interfaces
- `infrastructure` — Prisma repositories, external integrations, DI bindings
- `presentation` — Express controllers, routes, middleware, OpenAPI definitions
- `shared` — cross-cutting types, errors, utilities with no layer-specific coupling

**Non-negotiable rules:**

- Controllers MUST contain no business logic; they delegate to application services only.
- Business logic MUST live in the service/application layer.
- All database access MUST go through the Repository Pattern; Prisma MUST NOT be used directly
  from controllers or application services.
- Dependency Injection MUST be used throughout; concrete implementations are wired in
  infrastructure, not constructed ad hoc in presentation code.
- Prefer composition over inheritance; avoid deep class hierarchies.

**Rationale:** Layer boundaries keep the system testable, swappable, and maintainable as the
API grows.

### II. Type Safety & Code Discipline

TypeScript MUST run in **strict mode**. Generated and hand-written code MUST be production-ready,
modular, testable, and maintainable.

**Non-negotiable rules:**

- The `any` type MUST NOT be used; use `unknown`, generics, or explicit types instead.
- Async operations MUST use `async`/`await` only; callback-style async and raw `.then()` chains
  in application code are prohibited except where required by third-party APIs.
- All exported functions MUST include JSDoc describing purpose, parameters, and return value.
- Code MUST be concise, readable, and reusable with meaningful naming.
- ESLint and Prettier MUST be configured and enforced; CI MUST fail on lint or format violations.

**Rationale:** Strict typing and consistent style prevent runtime defects and reduce review friction.

### III. Security & Data Protection

Security is a first-class requirement, not an afterthought.

**Non-negotiable rules:**

- Authentication MUST use JWT access tokens and refresh tokens with secure issuance, rotation,
  and revocation semantics.
- Passwords MUST be hashed with bcrypt; plaintext passwords MUST NEVER be stored or logged.
- Express MUST be hardened with Helmet, CORS (explicit allowlist), rate limiting, input
  sanitization, and secure HTTP headers.
- Environment configuration MUST use dotenv (or equivalent typed env loader); secrets MUST NOT be
  committed to source control.
- Internal errors, stack traces, and sensitive data MUST NEVER be exposed in API responses or
  logs intended for external consumption.

**Rationale:** APIs are attack surfaces; defense-in-depth and secret hygiene are mandatory for
production readiness.

### IV. API Standards & Validation

Every endpoint MUST follow consistent request/response contracts.

**Non-negotiable rules:**

- Request and response payloads MUST use DTOs; domain entities MUST NOT leak to the HTTP layer.
- Input validation MUST use Zod schemas at the presentation boundary before invoking services.
- A global error-handling middleware MUST normalize all errors into the standard API response
  format.
- All successful and error responses MUST use the standard envelope (see Development Workflow).
- Pagination, filtering, and sorting MUST follow project-wide conventions (query param names,
  defaults, and response metadata shape).
- API documentation MUST be maintained via OpenAPI/Swagger and kept in sync with implemented
  endpoints.

**Rationale:** Predictable contracts reduce client integration cost and enable automated testing.

### V. Testing & Quality Gates

Code without tests is incomplete.

**Non-negotiable rules:**

- Vitest MUST be the test runner for unit, integration, and contract tests.
- Services and use cases MUST have unit tests; repositories and HTTP endpoints MUST have
  integration tests where behavior crosses layer boundaries.
- New features MUST NOT regress existing test suites; CI MUST run all tests on every push/PR.
- Tests MUST be independent, deterministic, and runnable without manual setup beyond documented
  `docker compose` or env configuration.

**Rationale:** Automated tests are the safety net for refactoring within Clean Architecture.

### VI. Observability & Operations

Production systems MUST be diagnosable and deployable.

**Non-negotiable rules:**

- Logging MUST use Pino with structured JSON output; log levels MUST be used consistently
  (`fatal`, `error`, `warn`, `info`, `debug`).
- Each request SHOULD carry a correlation/request ID through logs.
- The runtime MUST target **Node.js LTS**.
- Docker support MUST be provided (`Dockerfile`, `docker-compose` for local dev with PostgreSQL).
- GitHub Actions MUST run lint, test, and build on every PR and protected-branch push.

**Rationale:** Structured logging and containerized deployment are prerequisites for operating the
API in production.

### VII. Simplicity & Pragmatism (SOLID, DRY, KISS, YAGNI)

Design principles guide trade-offs; simplicity wins when requirements are ambiguous.

**Non-negotiable rules:**

- Apply SOLID, DRY, KISS, and YAGNI in design reviews and implementation.
- New dependencies MUST be justified; prefer standard library or existing project utilities over
  adding packages.
- Abstractions MUST solve a present problem; speculative generalization is prohibited.
- Complexity beyond this constitution MUST be documented in the plan's Complexity Tracking table
  with rejected alternatives.

**Rationale:** Restraint keeps the codebase approachable and reduces operational burden.

## Technology Stack

| Concern              | Standard                                        |
| -------------------- | ----------------------------------------------- |
| Language             | TypeScript (strict mode)                        |
| Runtime              | Node.js LTS                                     |
| Framework            | Express.js                                      |
| Architecture         | Clean Architecture (see Principle I)            |
| Database             | PostgreSQL                                      |
| ORM                  | Prisma (infrastructure layer only)              |
| Validation           | Zod                                             |
| Authentication       | JWT access & refresh tokens                     |
| Password hashing     | bcrypt                                          |
| Logging              | Pino (structured)                               |
| Testing              | Vitest                                          |
| API docs             | OpenAPI / Swagger                               |
| Linting / formatting | ESLint, Prettier                                |
| Configuration        | dotenv (typed env validation recommended)       |
| Security middleware  | Helmet, CORS, rate limiting, input sanitization |
| CI/CD                | GitHub Actions                                  |
| Containerization     | Docker                                          |

## Development Workflow & Quality Gates

### Standard API Response Envelope

All HTTP handlers MUST return responses in this shape:

```json
{
  "success": true,
  "data": {},
  "meta": {},
  "error": null
}
```

On failure, `success` is `false`, `data` is `null`, and `error` contains a safe, client-facing
code and message (never internal details).

### Pagination, Filtering & Sorting Conventions

| Concern        | Query parameter                         | Default           | Notes                                 |
| -------------- | --------------------------------------- | ----------------- | ------------------------------------- |
| Page           | `page`                                  | `1`               | 1-based index                         |
| Page size      | `limit`                                 | `20`              | Max `100` unless documented otherwise |
| Sort field     | `sortBy`                                | resource-specific | MUST be allowlisted per endpoint      |
| Sort direction | `sortOrder`                             | `asc`             | `asc` or `desc` only                  |
| Filters        | `filter[field]` or documented flat keys | none              | MUST be validated via Zod             |

List responses MUST include pagination metadata in `meta`:

```json
{
  "page": 1,
  "limit": 20,
  "total": 150,
  "totalPages": 8
}
```

### Pull Request Checklist

Every PR MUST verify:

1. Layer boundaries respected (no Prisma or Express types in domain).
2. Zod validation on all new/changed endpoints.
3. DTOs for request and response bodies.
4. No `any`; strict TypeScript passes.
5. JSDoc on new exported functions.
6. Unit and/or integration tests for changed behavior.
7. OpenAPI spec updated for API changes.
8. No secrets, internal errors, or sensitive data in responses/logs.
9. ESLint and Prettier clean.

### Feature Workflow

1. Spec (`spec.md`) defines user scenarios and requirements.
2. Plan (`plan.md`) passes Constitution Check before implementation.
3. Tasks (`tasks.md`) are organized by user story with foundational phase first.
4. Implementation follows layer order: domain → application → infrastructure → presentation.

## Governance

This constitution supersedes ad hoc conventions and conflicting guidance in feature specs. When a
spec conflicts with the constitution, the constitution wins unless explicitly amended.

**Amendment procedure:**

1. Propose changes with rationale and version bump type (MAJOR / MINOR / PATCH).
2. Update `.specify/memory/constitution.md` and propagate to dependent templates.
3. Record changes in the Sync Impact Report HTML comment at the top of the constitution file.
4. MAJOR amendments require team review and a migration plan for in-flight features.

**Versioning policy:**

- **MAJOR** — backward-incompatible principle removals or redefinitions.
- **MINOR** — new principles or materially expanded guidance.
- **PATCH** — clarifications, wording, typo fixes.

**Compliance review:** Constitution Check in `plan.md` is a mandatory gate before Phase 0
research and MUST be re-verified after Phase 1 design. Reviewers MUST reject PRs that violate
non-negotiable rules without an approved Complexity Tracking entry.

**Version**: 1.0.0 | **Ratified**: 2026-07-06 | **Last Amended**: 2026-07-06
