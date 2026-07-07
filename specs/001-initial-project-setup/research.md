# Research: Initial Project Setup

**Feature**: `001-initial-project-setup`  
**Date**: 2026-07-06

## 1. Node.js LTS Version

**Decision**: Target Node.js 22.x LTS (current Active LTS as of 2026).

**Rationale**: Constitution requires Node.js LTS. Node 22 provides native TypeScript support options, stable ESM/CJS interop, and long-term support suitable for production APIs.

**Alternatives considered**:

- Node 20 LTS — still supported but approaching maintenance; acceptable fallback if team standardizes on 20.
- Node Current — rejected; non-LTS unsuitable for production baseline.

## 2. Package Manager & Module System

**Decision**: pnpm with `"type": "module"` (ESM) and `moduleResolution: "NodeNext"` in TypeScript.

**Rationale**: User requirement specifies pnpm. ESM is the Node.js default direction; `NodeNext` aligns TS resolution with ESM imports.

**Alternatives considered**:

- CommonJS — simpler tooling in some cases but diverges from modern Node defaults.
- npm/yarn — rejected per project requirement.

## 3. Dependency Injection Strategy

**Decision**: Lightweight manual composition root at `src/infrastructure/providers/container.ts` — no DI framework (tsyringe, awilix, inversify).

**Rationale**: Bootstrap has two endpoints and no repositories yet. A typed factory/container wiring use cases → controllers satisfies constitution Principle I without adding dependencies (YAGNI).

**Alternatives considered**:

- tsyringe/inversify — rejected for bootstrap; adds dependency and decorator complexity before business modules exist.
- Direct `new` in controllers — rejected; violates constitution DI rule.

## 4. API Response Format

**Decision**: All bootstrap endpoints use the constitution standard envelope (`success`, `data`, `meta`, `error`).

**Rationale**: Constitution Principle IV mandates consistent envelope. Root and health payloads live inside `data`. Deviating would require a constitution exception and confuse future feature endpoints.

**Alternatives considered**:

- Flat JSON for bootstrap only — rejected; inconsistent with governance and future specs.

## 5. Health Check & Database Connectivity

**Decision**: Health use case delegates to `HealthCheckService` in application layer; infrastructure provides `PrismaHealthIndicator` executing `SELECT 1` via Prisma `$queryRaw`. Response `data.status` is `healthy` when DB ping succeeds, `degraded` when DB unreachable (HTTP 200 with degraded status for bootstrap) OR `unhealthy` with HTTP 503 — **use HTTP 503 when any critical dependency fails**.

**Rationale**: Spec requires health to reflect dependency availability. `SELECT 1` is the standard Prisma connectivity probe without requiring models/migrations.

**Alternatives considered**:

- Always return `healthy` without DB check — rejected; violates FR-006 and edge-case requirements.
- TCP-only postgres check — rejected; Prisma client validation is more representative.

## 6. Logging Stack

**Decision**: `pino` + `pino-http` for request/response logging; `pino-pretty` dev-only transport.

**Rationale**: Constitution mandates Pino structured logging. `pino-http` provides request ID (correlation), req/res serializers with redaction for `authorization`, `cookie`, `password`, `DATABASE_URL`.

**Alternatives considered**:

- winston — rejected; constitution specifies Pino.
- morgan — rejected; not structured JSON by default.

## 7. OpenAPI / Swagger

**Decision**: `swagger-ui-express` + `swagger-jsdoc` with JSDoc annotations on route definitions; served at `/docs`.

**Rationale**: Minimal setup, annotations co-located with routes, auto-generates spec from documented endpoints. Matches constitution OpenAPI requirement.

**Alternatives considered**:

- Hand-written `openapi.yaml` only — viable for 2 endpoints but harder to keep in sync; use `contracts/openapi.yaml` as reference contract and generate/sync via jsdoc.
- `@asteasolutions/zod-to-openapi` — deferred until Zod schemas exist on more endpoints.

## 8. Security Middleware (Deferred)

**Decision**: Defer Helmet, CORS, and rate limiting to the authentication/public-exposure feature spec. Bootstrap includes JSON body parser, request ID, and safe error handling only.

**Rationale**: Feature spec Assumptions explicitly defer security hardening. Constitution Principle III lists Helmet/CORS/rate-limit as requirements — documented as justified deferral in Complexity Tracking.

**Alternatives considered**:

- Add Helmet now with safe defaults — acceptable enhancement but out of user's 14-phase plan; can be added in polish without scope creep if desired.

## 9. Prisma Layout

**Decision**: `prisma/schema.prisma` at repository root (Prisma CLI convention); `src/infrastructure/database/prisma/client.ts` exports singleton Prisma client; `src/infrastructure/database/migrations/` reserved (empty until first model feature).

**Rationale**: Prisma CLI expects root `prisma/` directory. Wrapper isolates Prisma from domain/application layers.

**Alternatives considered**:

- Schema only under `src/infrastructure/database/prisma/` — rejected; non-standard Prisma CLI path.

## 10. Testing Strategy

**Decision**: Vitest + `supertest` for HTTP integration tests against `app` export (no live server port binding in tests).

**Rationale**: Constitution requires Vitest. Supertest is the standard Express integration pattern; tests run fast in CI without Docker when DB mocked or testcontainers optional.

**For bootstrap**: Health endpoint integration test mocks `HealthCheckService` or uses test DB via docker-compose in CI optional job. Default CI runs tests with mocked DB health indicator for determinism.

**Alternatives considered**:

- Jest — rejected per constitution.
- E2E only — insufficient for layer unit testing future features.

## 11. Husky & lint-staged

**Decision**: Husky v9 + lint-staged running `eslint --fix` and `prettier --write` on staged `*.{ts,json,md}` files.

**Rationale**: FR-019 requires pre-commit lint. Husky is industry standard with pnpm.

**Alternatives considered**:

- lefthook — viable but less common in Node ecosystem docs.

## 12. Environment Validation

**Decision**: Zod schema in `src/infrastructure/config/env.schema.ts`; parsed at startup in `src/infrastructure/config/index.ts`. Required vars: `PORT`, `DATABASE_URL`, `NODE_ENV`, `LOG_LEVEL`.

**Rationale**: Constitution recommends typed env validation; Zod already in stack for request validation.

**Alternatives considered**:

- envalid — rejected; duplicate validation library.

## 13. Error Class Hierarchy

**Decision**:

```
AppError (base, abstract)
├── NotFoundError (404)
└── ValidationError (400)
```

Global middleware maps to envelope `{ success: false, data: null, error: { code, message } }`. Unknown errors → 500 with generic message.

**Rationale**: FR-008/FR-009. Domain errors in `src/domain/errors/` extend or mirror shared errors as needed.

## 14. Docker Strategy

**Decision**: Multi-stage Dockerfile (build → production); `docker-compose.yml` at repo root with `api` and `postgres` services; dev uses volume mount + `pnpm dev`.

**Rationale**: User requirement and constitution Principle VI. Root-level compose matches common developer expectations.

**Alternatives considered**:

- Single-stage image — larger attack surface and image size.
