# Implementation Plan: Company & Identity Foundation

**Branch**: `002-company-identity-foundation` | **Date**: 2026-07-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-company-identity-foundation/spec.md`

**Note**: This plan establishes the backend foundation for Company tenancy, identity,
authentication, roles, employee management, and tenant-isolated access patterns that future
Scrappy modules will inherit.

## Summary

Build the technical foundation for multi-tenant Company ownership and identity in Scrappy. The
implementation must support Company onboarding with an initial Owner, authenticated Company-bound
sessions, foundational roles (`OWNER`, `MANAGER`, `EMPLOYEE`), employee lifecycle management,
reusable tenant isolation, and stable API contracts for all future modules.

Technical approach: modular Clean Architecture with business modules for `company`, `auth`,
`user`, and `employee`; PostgreSQL + Prisma for relational persistence; JWT access and refresh
authentication; Zod boundary validation; policy-based authorization; OpenAPI contracts; Vitest and
Supertest coverage; and shared tenant-isolation primitives used across every protected resource.

## Technical Context

**Language/Version**: TypeScript (strict mode) on Node.js LTS

**Primary Dependencies**: Express.js, Prisma ORM, PostgreSQL, Zod, JWT, bcrypt, Pino,
Swagger/OpenAPI, Vitest, Supertest, pnpm, Docker

**Storage**: PostgreSQL with Prisma repositories confined to the infrastructure layer

**Testing**: Vitest for unit and integration tests; Supertest for HTTP/API contract coverage

**Target Platform**: Linux server runtime with Docker for local and deployment parity

**Project Type**: modular REST API backend

**Performance Goals**: authentication and protected foundation endpoints support low-latency
interactive use for day-to-day business operations, with tenant isolation checks applied on every
protected request

**Constraints**: Company is the hard tenant boundary; no cross-company reads/writes; all protected
routes require authentication; archived resources are soft-deleted; all responses must use the
standard envelope; repository pattern and DTO boundaries are mandatory

**Scale/Scope**: foundation modules for Company, Auth, User, Employee, Session, Role, shared
policies, tenant resolution, audit logging, and reusable contract/validation patterns for future
business modules

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate                             | Pre-Design | Post-Design | Notes                                                                                                  |
| -------------------------------- | ---------- | ----------- | ------------------------------------------------------------------------------------------------------ |
| Layer boundaries                 | ✅         | ✅          | Module internals follow domain → application → infrastructure → presentation flow                      |
| No business logic in controllers | ✅         | ✅          | Controllers map transport only and delegate to services/use cases                                      |
| Repository pattern               | ✅         | ✅          | All persistence goes through Company/User/Employee/Session repositories                                |
| Dependency injection             | ✅         | ✅          | Module services, policies, and repositories are wired in infrastructure container                      |
| Zod validation                   | ✅         | ✅          | Request boundary validation for body, params, query, auth payloads                                     |
| DTOs                             | ✅         | ✅          | Request/response DTOs isolate HTTP contracts from domain entities                                      |
| Standard response envelope       | ✅         | ✅          | Success and error envelopes standardized across all endpoints                                          |
| Pagination conventions           | ✅         | ✅          | Employee and future list endpoints use `page`, `limit`, `sortBy`, `sortOrder`, and allowlisted filters |
| Security                         | ✅         | ✅          | JWT access/refresh, bcrypt, CORS, Helmet, rate limiting, secure headers                                |
| No `any`                         | ✅         | ✅          | Strict TypeScript with typed policies and repository interfaces                                        |
| Error handling                   | ✅         | ✅          | Global exception pipeline with business/auth/database exception mapping                                |
| Logging                          | ✅         | ✅          | Request, auth, error, and audit logging with request IDs                                               |
| Tests                            | ✅         | ✅          | Unit, integration, and API tests defined for modules and protected flows                               |
| OpenAPI                          | ✅         | ✅          | Module-grouped contracts and reusable schemas                                                          |
| Simplicity                       | ✅         | ✅          | Fixed foundational roles and module boundaries avoid premature permission-engine complexity            |

## Architecture

### Overall backend architecture

Use a **modular Clean Architecture** organized by business module while preserving strict internal
layering.

```text
Request -> Presentation -> Application -> Domain -> Infrastructure
                               ^                |
                               |________________|
```

Each business module owns its own domain concepts, use cases, repositories, DTOs, validators, and
HTTP surfaces while relying on shared cross-cutting services only where reuse is justified.

### Domain-driven module organization

Core modules for this feature:

- `company`
- `auth`
- `user`
- `employee`
- `session`
- `shared/tenant`
- `shared/policy`
- `shared/audit`

### Request lifecycle

1. Request ID is assigned
2. Request logging starts
3. Security and CORS headers applied
4. Authentication context resolved
5. Company context resolved from authenticated identity or onboarding contract
6. Authorization policies evaluated
7. Request DTOs validated
8. Controller maps request to use case/service
9. Application layer orchestrates domain and repository operations
10. Response DTO returned in standard envelope
11. Errors are normalized by the global error handler

### Layer responsibilities

- **Presentation**: routes, controllers, request parsing, validation middleware, OpenAPI docs
- **Application**: use cases, services, DTO mappers, orchestration, transaction boundaries
- **Domain**: entities, value objects, repository interfaces, policy contracts, domain errors
- **Infrastructure**: Prisma repositories, JWT/bcrypt providers, session persistence, logger,
  config, DI
- **Shared**: envelope helpers, error codes, pagination primitives, audit contracts, common utils

### Dependency flow

- Presentation depends on Application DTOs/contracts only
- Application depends on Domain interfaces/entities and shared abstractions
- Infrastructure depends on Domain repository interfaces and Application provider contracts
- Domain depends on nothing outside itself except extremely limited shared primitives if needed

### Shared modules

Shared reusable capabilities:

- tenant context resolution
- authorization policy evaluation
- pagination/filter primitives
- audit metadata helpers
- error code catalog
- JWT and password policy provider contracts

### Module boundaries

- `company` owns onboarding and company lifecycle rules
- `auth` owns login/logout/refresh/forgot-password placeholder flow
- `user` owns identity retrieval and user lifecycle support
- `employee` owns employee lifecycle and employee-user linking
- `session` owns refresh token persistence and lifecycle semantics

## Project Structure

Recommended structure:

```text
src/
├── modules/
│   ├── company/
│   ├── auth/
│   ├── user/
│   ├── employee/
│   └── session/
├── shared/
│   ├── auth/
│   ├── tenant/
│   ├── policy/
│   ├── audit/
│   ├── errors/
│   ├── http/
│   ├── pagination/
│   └── utils/
├── config/
├── database/
├── middleware/
├── validations/
├── swagger/
└── utilities/
```

Directory responsibilities:

- `modules/`: domain-owned features with internal layers (domain, application, infrastructure,
  presentation)
- `shared/`: stable cross-cutting contracts and reusable building blocks
- `config/`: environment parsing, application settings, security configuration
- `database/`: Prisma client, repository adapters, transaction helpers, migrations boundary
- `middleware/`: request pipeline orchestration that is globally shared
- `validations/`: shared validators and cross-module schema composition helpers
- `swagger/`: OpenAPI document assembly, reusable schemas, common responses, tagging strategy
- `utilities/`: low-level helper functions that do not contain business logic

## Domain Models

### Company

- One Company has many Users
- One Company has many Employees
- One Company has many future operational entities
- Owner onboarding creates the first User in role `OWNER`
- Soft delete strategy: `status = ARCHIVED`, `archivedAt`
- Audit fields: `createdAt`, `updatedAt`, `createdByUserId`, `updatedByUserId`
- Extensible for branches, legal metadata, settings, reporting boundaries

### User

- Many Users belong to one Company
- One User may link to zero or one Employee
- One User has many Refresh Sessions
- Constraints: unique login identity per chosen policy, same-company-only relationships,
  foundational role required
- Soft delete strategy: `status = ARCHIVED`, `archivedAt`
- Audit fields: `createdAt`, `updatedAt`, `lastLoginAt`, actor references
- Extensible for profile settings, MFA, notifications, approvals

### Employee

- Many Employees belong to one Company
- One Employee may link to zero or one User
- Constraints: same-company-only linkage, valid lifecycle state, optional employee code uniqueness
  within company
- Soft delete strategy: `status = ARCHIVED`, `archivedAt`
- Audit fields: `createdAt`, `updatedAt`, `createdByUserId`, `updatedByUserId`
- Extensible for workforce, attendance, payroll, assignments, HR metadata

## Database Design

### Prisma schema strategy

Do not generate schema here; apply the following conventions:

- Model names singular PascalCase (`Company`, `User`, `Employee`, `RefreshSession`)
- Database table names plural snake_case where mapping is desired (`companies`, `users`, etc.)
- Use stable primary IDs across all models; prefer UUID/ULID-style opaque identifiers
- Every tenant-owned table includes `companyId` except `Company` itself
- Foreign keys are explicit and named consistently
- Composite indexes must prioritize tenant isolation (`companyId + resource-specific key`)
- Add indexes for lookup-heavy fields: login identifier, employee code, status, archivedAt,
  createdAt
- Use composite unique constraints for tenant-scoped uniqueness where appropriate, such as
  `companyId + email` or `companyId + employeeCode`
- Cascading rules: avoid broad hard-delete cascades; prefer restricted deletes and explicit archive
  lifecycle handling
- Nullable strategy: fields are nullable only when business rules allow optionality (for example,
  `userId` on `Employee`, `archivedAt`, `revokedAt`)
- Timestamp strategy: all core models use `createdAt` and `updatedAt`; archive/session lifecycle
  fields add `archivedAt`, `expiresAt`, `revokedAt`, or `lastLoginAt` where needed

## API Design

### Standards

- Base path: `/api/v1`
- Use plural resource naming: `/companies`, `/employees`
- Use canonical REST methods: `POST`, `GET`, `PATCH`
- Use sub-action endpoints only when lifecycle or association actions do not map cleanly to CRUD
- Pagination: `page`, `limit`
- Filtering: allowlisted flat or grouped filters, always tenant-scoped
- Sorting: `sortBy`, `sortOrder`
- Searching: explicit `search` query param only where supported

### Response structure

All responses follow the constitution envelope:

```json
{
  "success": true,
  "data": {},
  "meta": {},
  "error": null
}
```

List endpoints return pagination metadata in `meta`.

### Error response structure

```json
{
  "success": false,
  "data": null,
  "meta": {},
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have access to this resource.",
    "details": []
  }
}
```

## Authentication Design

- JWT access token: short-lived, bearer token for protected API access
- Refresh token: longer-lived, rotated on refresh, persisted as a hash in session storage
- Login flow:
  1. validate credentials
  2. verify user and company lifecycle state
  3. issue access token + refresh token
  4. persist refresh session metadata
- Logout flow:
  1. authenticate request
  2. revoke current refresh session (or all sessions if future policy allows)
  3. return confirmation
- Refresh flow:
  1. validate refresh token
  2. check stored session status and company alignment
  3. rotate refresh token
  4. issue new access token and refresh token
- Password hashing strategy: bcrypt with centrally configured cost factor; compare hashes only,
  never store plaintext or reversible secrets

## Authorization Design

- Role middleware resolves authenticated role and tenant context
- Authorization strategy uses policy objects or guards in the application layer, not ad hoc
  controller checks
- Route protection: all protected routes require authenticated identity before controller entry
- Company isolation strategy: every protected repository query receives `companyId` explicitly
- Ownership validation: Owner-only actions (for example, Company update/archive) are enforced via
  policies before mutation occurs

## Validation Strategy

Using Zod:

- Request validation for body, params, and query at the presentation boundary
- Response validation is optional but recommended for shared envelopes and high-risk auth/session
  responses
- DTO organization: request DTOs and response DTOs live per module; shared DTO fragments live only
  when cross-module reuse is stable
- Shared schemas: identifiers, pagination, sort order, archived state filters, email/login fields
- Reusable validators: same-company linkage, role eligibility, lifecycle transition checks are
  composed in application/domain logic rather than only transport schemas

## Middleware Pipeline

Execution order:

1. Request ID assignment
2. Request logging start
3. CORS
4. Security headers
5. Rate limiting (where configured globally or auth-scoped)
6. Authentication resolution
7. Company resolution
8. Authorization middleware/guards
9. Validation middleware
10. Controllers
11. Error handler
12. Response logging completion/audit side effects

## Service Layer

- **Controllers**: translate HTTP input/output only
- **Services / Use cases**: implement onboarding, auth, employee linkage, lifecycle changes,
  orchestration, and policy invocation
- **Repositories**: abstract data access and enforce company-scoped query primitives
- **Policies**: centralize role and tenant access decisions
- **Validators**: transport validation in presentation; business validation in application/domain
- **DTOs**: isolate external contracts from domain entities

## Error Handling

Design a unified exception model:

- Global exception handler maps all thrown errors to the standard envelope
- Business exceptions: lifecycle conflict, duplicate identity, invalid linkage, company mismatch
- Validation exceptions: malformed input, invalid filters, missing required fields
- Authentication exceptions: invalid credentials, expired session, revoked session,
  unauthenticated request
- Authorization exceptions: forbidden action, cross-company access, role restriction
- Database exceptions: uniqueness conflicts, missing record, transaction failure, mapped to
  client-safe error codes

Suggested error codes:

- `VALIDATION_ERROR`
- `UNAUTHENTICATED`
- `INVALID_CREDENTIALS`
- `SESSION_EXPIRED`
- `SESSION_REVOKED`
- `FORBIDDEN`
- `COMPANY_SCOPE_VIOLATION`
- `RESOURCE_NOT_FOUND`
- `DUPLICATE_RESOURCE`
- `LIFECYCLE_CONFLICT`
- `INTERNAL_ERROR`

## Logging Strategy

- **Request logging**: path, method, status, duration, requestId, actor/company context when known
- **Error logging**: structured exception logs with sanitized details
- **Authentication logging**: login success/failure, refresh, logout, revoked session events
- **Audit logging**: Company creation, Company archive/update, Employee create/update/archive,
  Employee-user link/unlink, role-sensitive changes

No secrets, plaintext passwords, raw refresh tokens, or internal stack traces are exposed in
client responses.

## Swagger Strategy

- API grouping by tags: `Company`, `Authentication`, `Users`, `Employees`
- Document bearer authentication once via reusable security scheme
- Use reusable schemas for envelopes, error bodies, identifiers, session summaries, Company/User/
  Employee summaries
- Use reusable common responses for `401`, `403`, `404`, `409`, `422`, and standard validation
  errors

## Testing Strategy

Using Vitest and Supertest:

- **Unit testing**: use cases, policies, validators, token services, password services
- **Integration testing**: repositories, session persistence, tenant-scoped queries, transaction
  behavior
- **API testing**: onboarding, login/logout/refresh, `/users/me`, employee lifecycle, cross-company
  rejection paths
- **Test fixtures**: factory helpers for Company, User, Employee, Session, role states, archived
  states
- **Test database strategy**: isolated test database with repeatable setup/teardown; use seeded
  factories and transaction resets where practical

## Security

- Password hashing with bcrypt
- JWT security: short-lived access tokens, signed refresh tokens, rotation and revocation support
- Refresh token storage: store hashed refresh tokens only
- Rate limiting: at minimum auth endpoints and optionally broader API defaults
- CORS: explicit allowlist from configuration
- Helmet: secure default headers
- Environment variables: validated at startup
- Secrets management: never commit secrets; distinct signing secrets per environment
- SQL injection protection: Prisma parameterization and repository-layer query discipline
- Input sanitization: validate and normalize all transport inputs before use

## Coding Standards

- Naming conventions: PascalCase types/classes, camelCase variables/functions, SCREAMING_SNAKE_CASE
  constants
- Module conventions: one business module per domain boundary with internal clean layering
- Service conventions: one use case or service per business action/orchestration concern
- Repository conventions: interface in domain, implementation in infrastructure, all protected
  methods company-scoped
- DTO conventions: explicit request/response DTOs, no domain entity leakage to HTTP
- File naming: kebab-case or dotted action names consistently across the project
- API naming: plural resources, clear sub-actions for lifecycle/linkage flows
- Prisma conventions: singular model names, explicit relation names where ambiguity exists,
  company-scoped indexes first

## Risks & Future Extensibility

### Risks

- Weak tenant isolation can create severe data exposure risk if repository methods omit `companyId`
- Auth/session bugs can affect every future protected module
- Role checks scattered outside policies can cause inconsistent authorization behavior
- Over-coupling employee and user logic can constrain future workforce evolution

### Future extensibility

This architecture supports future modules without structural change because:

- **Organization** can add branches, warehouses, and vehicles under `companyId`
- **Workforce** can extend Employee with attendance, assignments, and payroll while reusing role,
  linkage, and company boundaries
- **Transactions** can attach all operational records to Company and actor context using existing
  repository and audit patterns
- **Trips** can reuse employee, vehicle, and tenant policies
- **Expenses** can reuse company ownership, actor audit, and approval policies
- **Analytics** can aggregate tenant-scoped events and records without redefining ownership
- **Reports** can rely on the same tenant boundary, authorization policy layer, and standardized
  query/filter contracts

No future module should need to redefine Company ownership, authenticated Company context, or the
foundational role model unless the constitution and this foundation are explicitly amended.

## Project Structure

### Documentation (this feature)

```text
specs/002-company-identity-foundation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── modules/
│   ├── company/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   ├── auth/
│   ├── user/
│   ├── employee/
│   └── session/
├── shared/
│   ├── auth/
│   ├── tenant/
│   ├── policy/
│   ├── audit/
│   ├── errors/
│   ├── http/
│   ├── pagination/
│   └── utils/
├── config/
├── database/
├── middleware/
├── validations/
├── swagger/
└── utilities/
```

**Structure Decision**: organize code by business module while preserving strict internal
clean-architecture layering, so future Scrappy modules can extend the platform without flattening
ownership or crossing domain boundaries.

## Complexity Tracking

| Violation                                     | Why Needed                                                       | Simpler Alternative Rejected Because                                                    |
| --------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Separate `User` and `Employee` models         | Product spec requires optional linkage and independent lifecycle | Single combined identity cannot represent non-login employees cleanly                   |
| Refresh session persistence                   | Constitution requires robust rotation and revocation semantics   | Purely stateless refresh flow weakens logout and session invalidation                   |
| Module-first organization inside clean layers | Future modules will grow around business domains                 | Pure layer-first organization becomes harder to scale for ownership and maintainability |

## Artifacts Generated

| Artifact           | Path                                               | Phase                |
| ------------------ | -------------------------------------------------- | -------------------- |
| Research decisions | [research.md](./research.md)                       | 0                    |
| Data model         | [data-model.md](./data-model.md)                   | 1                    |
| API contract       | [contracts/openapi.yaml](./contracts/openapi.yaml) | 1                    |
| Validation guide   | [quickstart.md](./quickstart.md)                   | 1                    |
| Task breakdown     | `tasks.md`                                         | 2 (`/speckit-tasks`) |

## Acceptance Criteria

- [ ] Company onboarding creates a Company and initial Owner in one workflow
- [ ] Protected routes reject unauthenticated requests consistently
- [ ] Cross-company reads/writes are blocked across Company, User, Employee, and Session access
- [ ] Login, logout, and refresh follow documented lifecycle and revocation rules
- [ ] Employee create/view/update/archive/link flows work within one Company boundary
- [ ] API contracts match `contracts/openapi.yaml`
- [ ] Global error and response envelopes follow the constitution standard
- [ ] Unit, integration, and API tests cover tenant isolation, auth flows, lifecycle rules, and
      role-sensitive actions
- [ ] Architecture supports future Organization, Workforce, Transactions, Trips, Expenses,
      Analytics, and Reports modules without redefining Company ownership

## Next Step

Run **`/speckit-tasks`** to generate file-level implementation tasks for Company, Auth, User,
Employee, Session, tenant policies, contracts, and tests.
