# Implementation Plan: P010 - Activity Logs

**Branch**: `013-activity-logs` | **Date**: 2026-07-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/013-activity-logs/spec.md`

**Note**: This plan is the definitive technical design for Activity Logs — not implementation
code. It follows architecture and conventions from P001–P012 without redefining them. Activity
Logs are an append-only event sink with a read API; they are not a CRUD module.

## Summary

Introduce a new `activity-log` module that **persists immutable Activity Log rows** for significant
business events and exposes **read-only** list/get APIs for Owners and Managers. Recording happens
through a shared `ActivityLogRecorder` application port invoked from existing module use cases
(alongside today’s Pino audit helpers). Existing structured log audits remain for ops observability;
Activity Logs become the queryable Company audit trail. Design the recorder/event taxonomy so
Notifications, Webhooks, and Event Streaming can subscribe later without redesigning the entity.

## Technical Context

**Language/Version**: TypeScript (strict mode) on Node.js LTS (≥22)

**Primary Dependencies**: Express.js, Prisma ORM, PostgreSQL, Zod, JWT, Pino, Swagger/OpenAPI,
Vitest, Supertest — **no new runtime dependencies**

**Storage**: New `ActivityLog` table (append-only). Logical references to User/Employee/resources;
no FK cascades that delete logs when source rows change.

**Testing**: Vitest (unit/integration), Supertest (API/authz/search/filter/pagination/event gen)

**Target Platform**: Linux server (Docker); local dev via docker-compose

**Project Type**: modular REST API — new `activity-log` module + thin recorder hooks in producers

**Performance Goals**: List p95 under interactive latency for page size ≤100 with company + date
indexes; recording must not block business success if persistence fails (best-effort with error
log; see research)

**Constraints**: Company tenant boundary; Owners/Managers only; Employees denied; immutable;
no client create/update/delete; no secrets in description/metadata; cross-company forbidden

**Scale/Scope**: 1 new module, 1 table, recorder port + Prisma repo, list + get endpoints, event
taxonomy constants, instrumentation of listed producer actions across existing modules

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate                             | Pre-Design | Post-Design | Notes                                          |
| -------------------------------- | ---------- | ----------- | ---------------------------------------------- |
| Layer boundaries                 | ✅         | ✅          | Domain free of Prisma; recorder in application |
| No business logic in controllers | ✅         | ✅          | Controllers → list/get use cases only          |
| Repository pattern               | ✅         | ✅          | `ActivityLogRepository` append + query         |
| Dependency injection             | ✅         | ✅          | Wired in `container.ts`                        |
| Zod validation                   | ✅         | ✅          | List query + id params schemas                 |
| DTOs                             | ✅         | ✅          | Response DTOs; no entity leak                  |
| Standard response envelope       | ✅         | ✅          | `success()` list/detail                        |
| Pagination conventions           | ✅         | ✅          | `page`, `limit`, `sortBy`, `sortOrder`         |
| Security                         | ✅         | ✅          | JWT + `authorize(['OWNER','MANAGER'])`         |
| No `any`                         | ✅         | ✅          | Strict TypeScript                              |
| Error handling                   | ✅         | ✅          | Existing HTTP exceptions                       |
| Logging                          | ✅         | ✅          | Keep Pino audits; log recorder failures        |
| Tests                            | ✅         | ✅          | Unit, API, authz, search, event gen            |
| OpenAPI                          | ✅         | ✅          | `activity-log.openapi.ts` + common schemas     |
| Simplicity                       | ✅         | ✅          | Sync recorder MVP; async bus deferred          |

## Project Structure

### Documentation (this feature)

```text
specs/013-activity-logs/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/openapi.yaml
└── tasks.md              # Phase 2 — /speckit-tasks
```

### Source code (new / extensions)

```text
src/modules/activity-log/
├── domain/
│   ├── activity-log.entity.ts
│   ├── activity-log.repository.ts          # append + findById + list
│   ├── activity-modules.ts                 # module enum
│   └── activity-actions.ts                 # action constants / taxonomy
├── application/
│   ├── dto/
│   │   ├── activity-log.response.ts
│   │   └── list-activity-logs.query.ts
│   ├── services/
│   │   └── activity-log-recorder.service.ts  # record(event) → repository.append
│   └── use-cases/
│       ├── list-activity-logs.use-case.ts
│       └── get-activity-log.use-case.ts
├── infrastructure/
│   ├── mappers/activity-log.mapper.ts
│   └── activity-log.prisma-repository.ts
└── presentation/
    ├── activity-log.controller.ts
    ├── activity-log.routes.ts
    ├── activity-log.schemas.ts
    └── activity-log.openapi.ts

src/shared/activity-log/   # optional shared types for producers
└── record-activity-log.input.ts

# Producer modules (MOD — call recorder after success):
# auth, user (password), employee, branch, warehouse, vehicle,
# transaction, trip, expense, attendance, leave, cash-advance, payroll, company
```

---

## 1. Module Architecture

### Responsibilities

| Concern                                         | Owner                                                             |
| ----------------------------------------------- | ----------------------------------------------------------------- |
| Persist immutable Activity Logs                 | `activity-log` module                                             |
| Record events after successful business actions | `ActivityLogRecorder` called by producer use cases                |
| Query list/search/filter/sort/paginate/get      | `ListActivityLogsUseCase`, `GetActivityLogUseCase`                |
| Authorize read access                           | Route `authorize(['OWNER','MANAGER'])` + company scope in queries |
| Ops observability (existing)                    | Keep module `*-audit.service.ts` Pino logs                        |

### Read-only architecture

- HTTP surface is **GET only** (list + detail).
- Repository exposes **`append`** (internal) and **query** methods; no `update` / `delete` on the
  domain port used by HTTP.
- Controllers never accept bodies that mutate Activity Logs.

### Event-driven design (MVP)

- MVP is **synchronous in-process recording**: after a producer use case commits its business
  change, it calls `activityLogRecorder.record(...)`.
- The recorder is the **single write API** for Activity Logs — producers do not touch the
  repository directly.
- Event shape is stable (`module`, `action`, `description`, actor, resource, metadata) so a
  future async publisher can fan-out the same payload to Notifications / Webhooks / streams.

### Why an event sink (not CRUD)

- Audit history must be **append-only** and system-authored; CRUD would allow rewriting history.
- Business modules remain sources of truth for operations; Activity Logs **observe** outcomes.
- Central sink avoids each module inventing its own queryable history table.
- Same event payload can later feed multiple sinks without changing producers’ call sites much.

### Dependencies

- **Inbound**: auth, company, employee, org, transaction, trip, expense, workforce, user password
  use cases → `ActivityLogRecorder`.
- **Outbound**: `ActivityLogRepository` → Prisma; optional User/Employee lookups for display
  enrichment on read (names), without requiring related rows to still exist.

### Shared services / integration strategy

1. Define `ActivityLogRecorder.record(input)` with taxonomy constants.
2. Inject recorder into producer use cases via DI (same pattern as existing audit helpers).
3. Prefer **dual emit**: keep Pino `logXAudit` for ops; add `recorder.record` for persistence.
4. Gradually wrap or replace audit helpers to also call the recorder (implementation tasks may
   batch by module).
5. Do **not** parse Pino logs to build Activity Logs.

---

## 2. Entity Design

### Purpose

Store one immutable row per significant business event for Company audit and troubleshooting.

### Fields

| Field            | Required | Purpose                                                              |
| ---------------- | -------- | -------------------------------------------------------------------- |
| `id`             | yes      | Stable identifier                                                    |
| `companyId`      | yes      | Tenant scope                                                         |
| `eventType`      | yes      | High-level category (e.g. AUTHENTICATION, EMPLOYEE, TRANSACTION)     |
| `module`         | yes      | Product module (auth, employee, transaction, …)                      |
| `action`         | yes      | Specific action code (e.g. `transaction.paid`)                       |
| `description`    | yes      | Human-readable summary (no secrets)                                  |
| `userId`         | yes*     | Actor User (`*` required for user-driven events in v1)               |
| `employeeId`     | no       | Actor’s linked Employee when available                               |
| `resourceType`   | no       | Related resource kind                                                |
| `resourceId`     | no       | Related resource id                                                  |
| `resourceNumber` | no       | Denormalized number/name for search (txn/trip/expense numbers, etc.) |
| `ipAddress`      | no       | Request IP when available                                            |
| `userAgent`      | no       | Request UA when available                                            |
| `metadata`       | no       | Structured JSON extras (ids, status transitions) — never passwords   |
| `createdAt`      | yes      | Event time (set at append; immutable)                                |

No `updatedAt`, `deletedAt`, or status field — immutability by design.

### Relationships

- **Company** (required logical tenant): every row scoped by `companyId`.
- **User** (actor): logical reference via `userId` — prefer soft reference (no ON DELETE CASCADE).
- **Employee** (optional actor profile): `employeeId` when known.
- **Referenced resource**: logical (`resourceType` + `resourceId` + optional `resourceNumber`);
  Activity Log does **not** own the resource.

### Indexes (design intent — not Prisma dump)

- `(companyId, createdAt DESC)` — primary list path
- `(companyId, module, createdAt DESC)` — module filter
- `(companyId, action, createdAt DESC)` — action filter
- `(companyId, userId, createdAt DESC)` — user filter
- `(companyId, eventType, createdAt DESC)` — activity type filter
- `(companyId, resourceType, resourceId)` — resource lookup
- `(companyId, resourceNumber)` — number search (trigram/ILIKE acceptable v1)

### Composite indexes

- Prefer composites above over single-column indexes for tenant queries.
- Avoid over-indexing writes; append volume is moderate relative to reads for Owners/Managers.

### Constraints

- `companyId` NOT NULL
- `eventType`, `module`, `action`, `description` NOT NULL
- Append-only application rule (no update/delete repository methods for HTTP)
- Description/metadata MUST NOT contain password material

### Retention considerations

- v1: retain indefinitely in primary table.
- Future: archive cold partitions by `createdAt`; optional purge after policy window.
- See §13 Retention Strategy.

### Future extensibility

- `metadata` holds before/after snapshots later without new required columns.
- Optional later table `ActivityLogChange` for field-level history keyed by `activityLogId`.
- Event bus can republish the same append payload.

---

## 3. Event Design

### Naming conventions

- **`eventType`**: SCREAMING_SNAKE category — `AUTHENTICATION`, `COMPANY`, `EMPLOYEE`,
  `ORGANIZATION`, `TRANSACTION`, `TRIP`, `EXPENSE`, `WORKFORCE`
- **`module`**: lowercase product module — `auth`, `company`, `employee`, `branch`, `warehouse`,
  `vehicle`, `transaction`, `trip`, `expense`, `attendance`, `leave`, `cash-advance`, `payroll`,
  `user`
- **`action`**: `{domain}.{verb_past_or_noun}` kebab/dot — e.g. `auth.login`, `transaction.paid`,
  `employee.account_disabled`
- **`description`**: short English sentence for UI, e.g. `User logged in`, `Transaction TRX-001 marked paid`

### Taxonomy (v1 required coverage)

| eventType      | module examples                          | Actions                                                                                                |
| -------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| AUTHENTICATION | auth, user                               | Login, Logout, Password Changed, Password Reset                                                        |
| COMPANY        | company                                  | Company Updated                                                                                        |
| EMPLOYEE       | employee                                 | Created, Updated, Archived, Account Created, Account Disabled                                          |
| ORGANIZATION   | branch, warehouse, vehicle               | Branch/Warehouse/Vehicle Created; Vehicle Updated (+ Branch/Warehouse Updated if already instrumented) |
| TRANSACTION    | transaction                              | Created, Updated, Submitted, Returned to Draft, Paid, Cancelled                                        |
| TRIP           | trip                                     | Created, Started, Completed, Cancelled                                                                 |
| EXPENSE        | expense                                  | Created, Recorded, Cancelled                                                                           |
| WORKFORCE      | attendance, leave, cash-advance, payroll | Time In, Time Out, Leave Recorded, Cash Advance Created, Payroll Paid                                  |

Constants live in `activity-actions.ts` / `activity-modules.ts` so producers cannot invent free-form
strings ad hoc without review.

---

## 4. Relationship Design

```text
Company
  └── ActivityLog[]   (1:N, tenant ownership of history)

ActivityLog
  ├── User            (N:1 logical actor via userId)
  ├── Employee?       (N:1 optional actor profile via employeeId)
  └── Resource?       (logical: resourceType + resourceId [+ resourceNumber])
```

```text
Producer Use Case (success)
        │
        ▼
ActivityLogRecorder.record(...)
        │
        ▼
ActivityLogRepository.append(...)
        │
        ▼
ActivityLog row (immutable)
```

### Why reference without owning

- Source modules own lifecycle (archive, cancel, soft-delete).
- Audit must **survive** resource archival/cancellation.
- Cascading FK deletes would erase history — forbidden for audit.
- `resourceNumber` denormalization keeps search useful after renames/archives when ids alone are
  opaque.

---

## 5. Event Recording Strategy

### When events are created

- **After** successful completion of the business operation (after persistence of the source
  change).
- Not on validation failures or authorization denials (unless a future security-signal story
  asks for failed-login logs — out of v1 list).

### Required information

- `companyId`, `eventType`, `module`, `action`, `description`, `userId`, `createdAt`

### Optional

- `employeeId`, `resourceType`/`resourceId`/`resourceNumber`, `ipAddress`, `userAgent`, `metadata`

### Ordering / timestamp

- `createdAt = now()` at append time (server clock).
- List default sort: `createdAt DESC`, then `id DESC` for stable ordering.

### Idempotency

- v1: **at-least-once acceptable** for rare double-submit edge cases (duplicate logs preferred
  over silent gaps).
- Optional later: idempotency key in metadata (`requestId` + action) with unique partial index.

### Failure policy

- Recorder failures are **logged** and **do not roll back** the business transaction (source of
  truth wins). Aligns with spec edge case.
- Prefer try/catch around `record` in producers or inside recorder.

### Future asynchronous publishing

- Extract `ActivityLogEvent` DTO identical to append input.
- After successful append (or instead, via outbox), publish to queue/bus for Notifications,
  Webhooks, SIEM — **same taxonomy**, no producer rewrite beyond injecting a publisher.

---

## 6. API Design

Base: `/api/v1`. Auth: Bearer JWT. Roles: OWNER, MANAGER.

### List Activity Logs

| Field    | Value                                                                                                                                                                                                                                                                                                |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose  | Searchable, filterable, sortable, paginated Company Activity Logs                                                                                                                                                                                                                                    |
| URI      | `/activity-logs`                                                                                                                                                                                                                                                                                     |
| Method   | `GET`                                                                                                                                                                                                                                                                                                |
| Request  | Query: `q` (search text), `searchBy` (`employeeName` \| `transactionNumber` \| `tripNumber` \| `expenseNumber` \| `user` \| `action`), `module`, `action`, `userId`, `eventType`, `dateFrom`, `dateTo`, `page`, `limit`, `sortBy` (`createdAt` \| `module` \| `user`), `sortOrder` (`asc` \| `desc`) |
| Response | `200` envelope with `data: ActivityLog[]` and pagination meta                                                                                                                                                                                                                                        |
| Errors   | `401`, `403`, `400` validation                                                                                                                                                                                                                                                                       |

### Get Activity Log

| Field    | Value                                 |
| -------- | ------------------------------------- |
| Purpose  | Single Activity Log detail in Company |
| URI      | `/activity-logs/{activityLogId}`      |
| Method   | `GET`                                 |
| Request  | Path `activityLogId` (uuid)           |
| Response | `200` single Activity Log DTO         |
| Errors   | `401`, `403`, `404`, `400`            |

### Unsupported

`POST` / `PATCH` / `PUT` / `DELETE` on `/activity-logs` → `405` or routed 404; document as
unsupported in OpenAPI.

---

## 7. Validation Design (Zod)

### Search

- `q`: optional string, trim, min 1 if present, max 200
- `searchBy`: optional enum; required if `q` present (or default `action` — **Decision**: require
  `searchBy` when `q` provided)

### Filter

- `module`, `action`, `eventType`, `userId` (uuid) optional enums/uuid
- `dateFrom` / `dateTo`: ISO datetime/date; refine `dateFrom <= dateTo`

### Pagination / sort

- Reuse product conventions: `page` ≥ 1, `limit` 1–100 (default 20)
- `sortBy`: `createdAt` \| `module` \| `user` (map `user` → `userId`/joined name)
- `sortOrder`: `asc` \| `desc`, default `desc` for `createdAt`

### Business validation

- Actor role Owner/Manager only (middleware)
- Always force `companyId` from `req.auth.companyId`
- Get-by-id must 404 if other company

### Shared validators

- Extract `activityLogListQuerySchema` in `activity-log.schemas.ts`
- Action/module enums shared with recorder constants

---

## 8. Authorization Matrix

| Action                          | Owner | Manager | Employee |
| ------------------------------- | ----- | ------- | -------- |
| List Activity Logs              | ✅    | ✅      | ❌       |
| Get Activity Log                | ✅    | ✅      | ❌       |
| Create/Edit/Delete Activity Log | ❌    | ❌      | ❌       |

Managers have **Company-wide** Activity Log visibility (same as Owners) for this release.

---

## 9. Business Rules

1. Activity Logs are immutable after append.
2. Activity Logs are generated automatically by the system.
3. Activity Logs belong to exactly one Company.
4. Activity Logs cannot be edited or deleted via API.
5. Every significant listed business action should generate an Activity Log on success.
6. Cross-company access is forbidden.
7. No secrets in description/metadata.
8. Related resources are logical references only.

---

## 10. Error Scenarios

| Scenario                                     | Response                                                               |
| -------------------------------------------- | ---------------------------------------------------------------------- |
| Unauthenticated                              | `401`                                                                  |
| Employee / unauthorized role                 | `403`                                                                  |
| Cross-company get                            | `404` (no leakage)                                                     |
| Invalid filters / search / sort / pagination | `400` VALIDATION_ERROR                                                 |
| Activity Log not found                       | `404`                                                                  |
| Referenced resource no longer exists         | Still return Activity Log; related display may show id/number only     |
| Large result sets                            | Pagination required; enforce max `limit`; indexes on company+createdAt |
| Client write attempt                         | `405` / not implemented                                                |

---

## 11. Swagger Design

- **Tag**: `Activity Logs`
- **Schemas**: `ActivityLog`, `ActivityLogListResponse` (via envelope), `ActivityLogMetadata`
  (object additionalProperties), enums for `eventType`, `module`, `searchBy`, `sortBy`
- **Parameters**: document all list query params
- **Examples**: login event; transaction paid with `resourceNumber`; password reset without secrets
- **Errors**: standard envelope 400/401/403/404

Update `activity-log.openapi.ts` and `src/swagger/common-schemas.ts`; register in OpenAPI builder.

---

## 12. Testing Strategy

### Unit (Vitest)

- Recorder maps input → append payload; strips/forbids password keys in metadata
- List use case applies company scope + filter composition
- Get use case 404 cross-company
- Taxonomy constants coverage

### Integration

- Prisma append + list by company/date
- Index-friendly queries smoke

### API (Supertest)

- Owner/Manager success; Employee 403
- Search by transaction number / employee name / user / action
- Filters module, action, userId, eventType, date range
- Sort createdAt/module/user
- Pagination meta
- Get by id
- Write methods rejected

### Event generation

- Representative producer flows (login, create employee, pay transaction, time-in, etc.) assert
  an Activity Log row exists with expected action/module

### Large dataset

- Seed many rows; ensure list with limit remains bounded and ordered

---

## 13. Retention Strategy

| Topic             | v1 Decision                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------- |
| Long-term storage | Keep in primary `ActivityLog` table                                                         |
| Archiving         | Deferred — optional cold table/partition by month later                                     |
| Performance       | Composite indexes; pagination; discourage unbounded exports in v1                           |
| Future purge      | Policy-driven delete/archive by `createdAt` older than N years; never user-initiated delete |
| Compliance        | Immutable operational audit; export may be added later without changing append model        |

---

## 14. Acceptance Criteria (Engineering)

- **AC-001**: Listed producer successes create Activity Log rows with required fields.
- **AC-002**: Owner/Manager list+get work; Employee always 403.
- **AC-003**: Search/filter/sort/pagination behave per contracts.
- **AC-004**: No HTTP mutate path succeeds.
- **AC-005**: Cross-company isolation holds.
- **AC-006**: Password events never store plaintext secrets.
- **AC-007**: OpenAPI + `docs/api-reference.md` updated.
- **AC-008**: Unit + API tests pass in CI.
- **AC-009**: Recorder failure does not fail the originating business use case.

---

## 15. Future Extensibility

| Capability                   | Fit                                                     |
| ---------------------------- | ------------------------------------------------------- |
| Notifications / Email Alerts | Subscribe to recorder/outbox events by `action`         |
| Webhooks                     | Publish ActivityLogEvent JSON to endpoints              |
| Event Streaming              | Same payload to Kafka/SQS after append                  |
| Field-Level Change History   | Child rows or richer `metadata.before`/`metadata.after` |
| Before/After Comparisons     | Store snapshots in metadata; UI renders diffs           |
| Compliance Reporting         | Read API / export over ActivityLog                      |
| SIEM Integrations            | Stream or batch export of append events                 |

No redesign of Company-scoped immutable Activity Log core required.

---

## Phase 0 / Phase 1 Artifacts

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/openapi.yaml](./contracts/openapi.yaml)
- [quickstart.md](./quickstart.md)

## Implementation Notes for Tasks Phase

1. Prisma model + migration for ActivityLog (+ indexes)
2. Domain entity, repository, mapper, in-memory repo for tests
3. ActivityLogRecorder + taxonomy constants
4. List/Get use cases, Zod schemas, routes, OpenAPI, DI
5. Instrument producer use cases (batch by module)
6. Tests + docs
