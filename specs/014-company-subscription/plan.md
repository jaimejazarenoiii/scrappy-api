# Implementation Plan: P011 - Company Subscription Management

**Branch**: `014-company-subscription` | **Date**: 2026-07-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/014-company-subscription/spec.md`

**Note**: Software architecture and technical design only — not implementation code. Follows
P001–P010 standards without redefining them. No Prisma schema in this document (see
[data-model.md](./data-model.md)).

## Summary

Add a `subscription` module for **Scrappy Super Admin** management of Company subscription
periods, extend **Company** with denormalized `subscriptionStatus` for fast login gating, and
integrate entitlement checks into authentication. History rows are separate from operational
status. Online billing is out of scope. Activity Logs record admin subscription actions.

## Technical Context

**Language/Version**: TypeScript (strict mode) on Node.js LTS (≥22)

**Primary Dependencies**: Express.js, Prisma ORM, PostgreSQL, Zod, JWT, Pino, Swagger/OpenAPI,
Vitest, Supertest — **no new runtime dependencies**

**Storage**: Extend `Company`; new `CompanySubscription` table. Logical `createdBy` user ref.

**Testing**: Vitest (unit/integration), Supertest (API, authz, login entitlement, overlap)

**Target Platform**: Linux server (Docker); local dev via docker-compose

**Project Type**: modular REST API — new `subscription` module + auth/company extensions

**Performance Goals**: Login subscription check is O(1) on Company row already loaded; history
list p95 interactive for page ≤100 with `(companyId, startsAt)` index

**Constraints**: Only `SUPER_ADMIN` mutates; tenant users read-only status; no overlap; ≤1 ACTIVE
period; closed periods immutable; no payment gateway

**Scale/Scope**: 1 module, 1 new table, Company field + UserRole extension, admin APIs, login
gate, Activity Log actions, seeds for Super Admin

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate                             | Pre-Design | Post-Design | Notes                                                  |
| -------------------------------- | ---------- | ----------- | ------------------------------------------------------ |
| Layer boundaries                 | ✅         | ✅          | Domain free of Prisma                                  |
| No business logic in controllers | ✅         | ✅          | Controllers → use cases                                |
| Repository pattern               | ✅         | ✅          | `CompanySubscriptionRepository` + Company repo updates |
| Dependency injection             | ✅         | ✅          | `container.ts`                                         |
| Zod validation                   | ✅         | ✅          | Admin body/params + dates                              |
| DTOs                             | ✅         | ✅          | Request/response DTOs                                  |
| Standard response envelope       | ✅         | ✅          | `success()`                                            |
| Pagination conventions           | ✅         | ✅          | History list                                           |
| Security                         | ✅         | ✅          | JWT + SUPER_ADMIN; login gate                          |
| No `any`                         | ✅         | ✅          | Strict TS                                              |
| Error handling                   | ✅         | ✅          | `SUBSCRIPTION_INACTIVE`, validation errors             |
| Logging                          | ✅         | ✅          | Audit + Activity Log                                   |
| Tests                            | ✅         | ✅          | Unit + API matrix                                      |
| OpenAPI                          | ✅         | ✅          | Admin + status paths                                   |
| Simplicity                       | ✅         | ✅          | No billing stack                                       |

## Project Structure

### Documentation (this feature)

```text
specs/014-company-subscription/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/openapi.yaml
└── tasks.md              # Phase 2 — /speckit-tasks
```

### Source code (new / extensions)

```text
src/modules/subscription/
├── domain/
│   ├── company-subscription.entity.ts
│   ├── company-subscription.repository.ts
│   ├── subscription-period-status.ts
│   ├── company-subscription-status.ts
│   └── subscription-overlap.service.ts          # pure overlap helpers
├── application/
│   ├── dto/
│   ├── services/
│   │   └── subscription-audit.service.ts
│   ├── policies/
│   │   └── subscription-authorization.policy.ts
│   └── use-cases/
│       ├── create-subscription.use-case.ts
│       ├── renew-subscription.use-case.ts
│       ├── expire-subscription.use-case.ts
│       ├── suspend-company-subscription.use-case.ts
│       ├── list-subscription-history.use-case.ts
│       ├── get-subscription.use-case.ts
│       ├── get-company-subscription-status.use-case.ts
│       └── get-my-subscription-status.use-case.ts
├── infrastructure/
│   ├── mappers/
│   └── company-subscription.prisma-repository.ts
└── presentation/
    ├── subscription.controller.ts
    ├── subscription.routes.ts          # /admin/...
    ├── subscription.schemas.ts
    └── subscription.openapi.ts

# Extensions
src/shared/policy/roles.ts              # + SUPER_ADMIN
src/modules/company/domain/             # + subscriptionStatus
src/modules/auth/.../login-policy       # + subscription gate
src/modules/auth/.../login.use-case.ts  # invoke gate; SUPER_ADMIN bypass
```

**Structure Decision**: Clean Architecture module per Constitution Principle I.

## Complexity Tracking

> No constitution violations requiring justification.

---

## 1. Module Architecture

### Responsibilities

| Concern                                                                       | Owner                                          |
| ----------------------------------------------------------------------------- | ---------------------------------------------- |
| Subscription period CRUD-like admin ops (create/renew/expire/suspend/history) | `subscription` module                          |
| Company operational `subscriptionStatus` updates                              | Subscription use cases via `CompanyRepository` |
| Login entitlement                                                             | Auth login policy (reads Company only)         |
| Platform authorization                                                        | `SUPER_ADMIN` role + admin routes              |
| Observability                                                                 | Subscription audit + Activity Log bridge       |

### Tenant access strategy

- **Tenant users** (OWNER/MANAGER/EMPLOYEE): company-scoped JWT; may **read** own
  `GET /companies/me/subscription-status`; **cannot** mutate subscriptions.
- **Super Admin**: platform role; accesses `/api/v1/admin/companies/{companyId}/...` for any
  Company; bypasses subscription login gate.

### Subscription lifecycle (summary)

Periods: `PENDING` → `ACTIVE` → `EXPIRED` | `CANCELLED`.  
Company: `TRIAL` | `ACTIVE` | `GRACE_PERIOD` | `EXPIRED` | `SUSPENDED` (admin-driven MVP).

### Why history and operational status are separated

1. **Auth performance**: login already loads Company; checking one enum avoids history scans and
   date arithmetic.
2. **Suspend without destroying commercial period**: Company can be `SUSPENDED` while period stays
   `ACTIVE` for clean resume.
3. **Immutable commercial audit**: closed periods remain queryable for support/billing later.
4. **Future billing**: invoices/plans attach to period rows; access gate stays on Company.

### Dependencies

- **Inbound**: Super Admin HTTP; auth login; optional company create default status.
- **Outbound**: `CompanyRepository`, `CompanySubscriptionRepository`, Activity Log recorder,
  User (createdBy / role checks).

### Integration with Authentication

Extend `assertValidLoginCompany` / login use case: after company account ACTIVE, if role ≠
`SUPER_ADMIN`, require `subscriptionStatus ∈ {TRIAL, ACTIVE, GRACE_PERIOD}`; else throw
subscription inactive error (no tokens).

### Integration with Company

- Add `subscriptionStatus` on Company entity/DTO where appropriate (admin + me status).
- Existing `Company.status` (ACTIVE/INACTIVE) is **cascaded** with subscription entitlement:
  blocked → `INACTIVE`; allowed → `ACTIVE`. Same for all tenant Users + session revoke on block.

### Integration with Activity Logs

Emit structured audits mapped to Activity Logs:

- `subscription.created`
- `subscription.renewed`
- `subscription.updated`
- `subscription.expired`
- `subscription.suspended`
- `subscription.reactivated`

### Integration with future Billing module

The subscription module is the **entitlement boundary**; a future Billing module is a **payment
and invoice producer** that writes through the same application services:

| Future Billing concern | Integration hook                                                          |
| ---------------------- | ------------------------------------------------------------------------- |
| Payment captured       | Calls `renew` or `create` use case with period dates                      |
| Invoice issued         | FK from Invoice → `CompanySubscription.id`                                |
| Failed payment         | Calls `expire` or `suspend` via shared use cases                          |
| Webhook handlers       | Idempotent calls into subscription use cases; never bypass Company status |
| Plan catalog           | `planId` on period row; `planName` denormalized for history               |

Billing MUST NOT implement a parallel access gate. **`Company.subscriptionStatus`** remains the
single login switch. Billing events update history rows and operational status through existing
use cases so authentication logic never changes when payments go online.

---

## 2. Entity Design

See [data-model.md](./data-model.md) for full field tables. Highlights:

### Company (extension)

- **Field**: `subscriptionStatus` (`TRIAL` | `ACTIVE` | `GRACE_PERIOD` | `EXPIRED` | `SUSPENDED`)
- **Purpose**: Operational access gate
- **Default**: `TRIAL`
- **Rules**: Super Admin use cases only; cascade Company/User ACTIVE↔INACTIVE with entitlement
  (see research §9 / data-model cascade table)
- **Indexes**: optional by status for ops
- **Extensibility**: add billing customer ids later without redesign

### CompanySubscription

- **Fields**: id, companyId, planName, startsAt, endsAt, activatedAt (optional), status
  (`PENDING`|`ACTIVE`|`EXPIRED`|`CANCELLED`), notes, createdBy, updatedBy (optional), createdAt,
  updatedAt
- **Purpose**: Historical subscription period
- **Relationships**: Company 1:N; createdBy / updatedBy logical User refs
- **Indexes**: `(companyId, startsAt)`, `(companyId, status)`, partial unique ACTIVE
- **Constraints**: startsAt ≤ endsAt; no overlapping ranges; ≤1 ACTIVE; `activatedAt` set on
  ACTIVE transition
- **Audit**: createdBy, updatedBy + Activity Logs; closed periods immutable
- **Extensibility**: planId, amounts, external invoice refs later

Do **not** generate Prisma schema in this plan.

---

## 3. Relationship Design

```text
┌─────────────────────┐
│      Company        │
│  subscriptionStatus │◄──── auth reads this only
└─────────┬───────────┘
          │ 1
          │
          │ *
┌─────────▼───────────┐
│ CompanySubscription │
│  periods / history  │
└─────────────────────┘
```

- **Historical ownership**: all periods belong to one Company forever.
- **Current operational status**: denormalized on Company; updated by admin use cases.
- **Authentication dependency**: login → Company.subscriptionStatus; history not consulted.

---

## 4. Subscription Lifecycle

### Period transitions

| From    | To                | Trigger                                              |
| ------- | ----------------- | ---------------------------------------------------- |
| —       | PENDING or ACTIVE | Create                                               |
| PENDING | ACTIVE            | Manual activation (create status ACTIVE or activate) |
| PENDING | CANCELLED         | Cancel before start                                  |
| ACTIVE  | EXPIRED           | Expire or Renew (close prior)                        |
| ACTIVE  | CANCELLED         | Admin cancel (rare)                                  |

Invalid: mutate EXPIRED/CANCELLED rows; ACTIVE→PENDING; second ACTIVE.

### Company status transitions (MVP manual)

| Action                    | Typical Company result        |
| ------------------------- | ----------------------------- |
| Create Trial-oriented     | TRIAL                         |
| Create/Renew Active       | ACTIVE                        |
| Set grace                 | GRACE_PERIOD                  |
| Expire                    | EXPIRED                       |
| Suspend                   | SUSPENDED                     |
| Resume (renew/reactivate) | ACTIVE / TRIAL / GRACE_PERIOD |

### Renewal workflow

1. Validate new dates (no overlap).
2. If current period ACTIVE → transition to EXPIRED.
3. Insert new period (PENDING or ACTIVE).
4. Set Company.subscriptionStatus per request (default ACTIVE).
5. Activity Log `subscription.renewed`.

### Manual suspension

1. Set Company.subscriptionStatus = SUSPENDED.
2. Do **not** require period → CANCELLED (period may stay ACTIVE).
3. Cascade: Company.status → INACTIVE; all Users → INACTIVE; revoke sessions.
4. Log `subscription.suspended`.
5. Tenant logins fail until status restored.

### Expire

1. Transition current ACTIVE period → EXPIRED (if any).
2. Set Company.subscriptionStatus = EXPIRED.
3. Cascade: Company.status → INACTIVE; all Users → INACTIVE; revoke sessions.
4. Log `subscription.expired`.

### Manual reactivation

1. Validate Company is `SUSPENDED` (or `EXPIRED` only when an ACTIVE period still exists — rare).
2. Set Company.subscriptionStatus to `ACTIVE` | `TRIAL` | `GRACE_PERIOD` (default `ACTIVE`).
3. Do **not** create a new period when resuming from suspend with existing ACTIVE period.
4. Cascade: Company.status → ACTIVE; all Users → ACTIVE.
5. Log `subscription.reactivated`.
6. If `EXPIRED` with no ACTIVE period → reject; admin must **renew** instead.

### Restore via renew (commercial)

1. Set Company.subscriptionStatus to TRIAL / ACTIVE / GRACE_PERIOD.
2. Cascade: Company.status → ACTIVE; all Users → ACTIVE.
3. Log create/renew as applicable.

---

## 5. Authentication Strategy

### Order

1. User exists
2. User account is Active (`User.status`)
3. Password valid
4. Company exists and company account Active (`Company.status`)
5. Employee is Active when employee-linked login rules apply (P003 workforce coupling)
6. **If role ≠ SUPER_ADMIN**: `Company.subscriptionStatus` ∈ {TRIAL, ACTIVE, GRACE_PERIOD}

### Allowed / blocked

| Status       | Tenant login |
| ------------ | ------------ |
| TRIAL        | Allowed      |
| ACTIVE       | Allowed      |
| GRACE_PERIOD | Allowed      |
| EXPIRED      | Blocked      |
| SUSPENDED    | Blocked      |

### Failure behavior

- Do not issue access/refresh tokens.
- Return stable error code `SUBSCRIPTION_INACTIVE` (HTTP 409 Conflict or 403 — prefer **409**
  LifecycleConflict family consistent with inactive company/user).
- Message: company subscription does not allow access (no internal details).
- No Activity Log login success; optional failed-login audit without secrets.

---

## 6. API Design

Aligned with [contracts/openapi.yaml](./contracts/openapi.yaml). All admin routes require
`SUPER_ADMIN`. Responses use standard `success(data, meta)` envelope.

### Create subscription

- **Purpose**: Create first or additional historical period; set Company operational status.
- **Method**: `POST`
- **URI**: `/api/v1/admin/companies/{companyId}/subscriptions`
- **Request**: `planName`, `startsAt`, `endsAt`, `status` (`PENDING`|`ACTIVE`), optional
  `companyStatus`, optional `notes`
- **Response**: `201` — created `CompanySubscription` + updated `subscriptionStatus`
- **Errors**: `400` overlap / dual ACTIVE / invalid dates; `401`; `403`; `404` company

### Subscription history

- **Purpose**: Paginated immutable history for support and audit.
- **Method**: `GET`
- **URI**: `/api/v1/admin/companies/{companyId}/subscriptions`
- **Request**: query `page`, `limit`, `sortOrder`
- **Response**: `200` — paginated list of periods (newest first default)
- **Errors**: `401`; `403`; `404`

### Current subscription (active period)

- **Purpose**: Return the single ACTIVE period for a Company, if any.
- **Method**: `GET`
- **URI**: `/api/v1/admin/companies/{companyId}/subscriptions/current`
- **Request**: path `companyId`
- **Response**: `200` — ACTIVE period detail; `404` when no ACTIVE period
- **Errors**: `401`; `403`; `404` company

### Get subscription by id

- **Purpose**: Retrieve one historical period.
- **Method**: `GET`
- **URI**: `/api/v1/admin/companies/{companyId}/subscriptions/{subscriptionId}`
- **Response**: `200` — period detail
- **Errors**: `401`; `403`; `404` company or subscription / cross-company

### Update subscription (open period only)

- **Purpose**: Edit dates, plan name, notes on PENDING or ACTIVE period before close.
- **Method**: `PATCH`
- **URI**: `/api/v1/admin/companies/{companyId}/subscriptions/{subscriptionId}`
- **Request**: optional `planName`, `startsAt`, `endsAt`, `notes` (overlap re-validated)
- **Response**: `200` — updated period; sets `updatedBy`
- **Errors**: `400` overlap / closed period; `401`; `403`; `404`

### Renew subscription

- **Purpose**: Add new commercial period; close prior ACTIVE → EXPIRED.
- **Method**: `POST`
- **URI**: `/api/v1/admin/companies/{companyId}/subscriptions/renew`
- **Request**: `planName`, `startsAt`, `endsAt`, optional `status`, `companyStatus`, `notes`
- **Response**: `201` — new period + updated Company status (default ACTIVE)
- **Errors**: `400` overlap; `401`; `403`; `404`

### Expire subscription

- **Purpose**: End entitlement; close ACTIVE period; set Company EXPIRED.
- **Method**: `POST`
- **URI**: `/api/v1/admin/companies/{companyId}/subscriptions/expire`
- **Request**: optional `notes`
- **Response**: `200` — `subscriptionStatus: EXPIRED`; cascade INACTIVE + session revoke
- **Errors**: `400` invalid state; `401`; `403`; `404`

### Suspend company

- **Purpose**: Block tenant access without necessarily closing ACTIVE period.
- **Method**: `POST`
- **URI**: `/api/v1/admin/companies/{companyId}/subscriptions/suspend`
- **Request**: optional `notes`
- **Response**: `200` — `subscriptionStatus: SUSPENDED`; cascade INACTIVE + session revoke
- **Errors**: `400`; `401`; `403`; `404`

### Reactivate company

- **Purpose**: Restore access from SUSPENDED (resume ops without new period when one exists).
- **Method**: `POST`
- **URI**: `/api/v1/admin/companies/{companyId}/subscriptions/reactivate`
- **Request**: optional `companyStatus` (`ACTIVE`|`TRIAL`|`GRACE_PERIOD`, default ACTIVE),
  optional `notes`
- **Response**: `200` — restored operational status; cascade ACTIVE on Company/Users
- **Errors**: `400` not suspended / expired without active period; `401`; `403`; `404`

### Admin / tenant subscription status

| Purpose                               | Method | URI                                                       |
| ------------------------------------- | ------ | --------------------------------------------------------- |
| Admin read Company operational status | GET    | `/api/v1/admin/companies/{companyId}/subscription-status` |
| Tenant read-only status               | GET    | `/api/v1/companies/me/subscription-status`                |

Both return `{ companyId, subscriptionStatus }`. Tenant route: Owner, Manager, Employee,
Super Admin (own company context).

---

## 7. Validation Design (Zod)

### Subscription

- `planName`: trim, min 1, max 120
- `notes`: optional, max 2000
- `status` on create: `PENDING` | `ACTIVE`

### Date

- coerce ISO datetime
- refine `startsAt <= endsAt`

### Status

- Company status enum whitelist
- Period status whitelist

### Overlap

- Domain service: reject if new `[startsAt, endsAt]` intersects any existing period for company

### Business

- Company must exist
- ≤1 ACTIVE period
- SUPER_ADMIN only for admin routes
- Immutable closed periods

### Shared validators

Reuse pagination query schemas; add `subscriptionPeriodStatusSchema`,
`companySubscriptionStatusSchema` in module schemas (or shared validations).

---

## 8. Authorization Matrix

| Action                                         | SUPER_ADMIN | OWNER | MANAGER | EMPLOYEE |
| ---------------------------------------------- | ----------- | ----- | ------- | -------- |
| Create / renew / expire / suspend / reactivate | ✅          | ❌    | ❌      | ❌       |
| Update open period (PATCH)                     | ✅          | ❌    | ❌      | ❌       |
| List/get history (admin)                       | ✅          | ❌    | ❌      | ❌       |
| Get current ACTIVE period (admin)              | ✅          | ❌    | ❌      | ❌       |
| Admin get status                               | ✅          | ❌    | ❌      | ❌       |
| `GET .../me/subscription-status`               | ✅*         | ✅    | ✅      | ✅       |
| Login when Company EXPIRED/SUSPENDED           | ✅ (bypass) | ❌    | ❌      | ❌       |

\* Super Admin may use me-status for their platform company; primary ops use admin status.

Cross-company admin URLs always take `{companyId}`; Super Admin may target any company; tenants
never pass another company’s id for mutation.

---

## 9. Business Rules

1. Every Company may have many historical subscriptions.
2. Only one ACTIVE subscription period at a time.
3. Periods must not overlap.
4. EXPIRED/CANCELLED periods are immutable.
5. `Company.subscriptionStatus` controls authentication entitlement.
6. History is not used in login validation.
7. Only SUPER_ADMIN manages subscriptions.
8. Cross-company modification by tenants is forbidden.
9. Suspend affects Company subscription status; expire closes ACTIVE period + Company EXPIRED.
10. **Blocked** subscription (`EXPIRED`/`SUSPENDED`) ⇒ Company + all Users `INACTIVE` + sessions revoked.
11. **Allowed** subscription (`TRIAL`/`ACTIVE`/`GRACE_PERIOD`) ⇒ Company + all Users `ACTIVE`.

---

## 10. Error Scenarios

| Scenario                       | Outcome                                                                          |
| ------------------------------ | -------------------------------------------------------------------------------- |
| Overlapping subscriptions      | 400 validation                                                                   |
| Duplicate ACTIVE               | 400 conflict/validation                                                          |
| Invalid date range             | 400                                                                              |
| Company not found              | 404                                                                              |
| Non–Super Admin admin API      | 403                                                                              |
| Expire/Suspend                 | Company EXPIRED/SUSPENDED; Company+Users INACTIVE; sessions revoked; login fails |
| Restore to Trial/Active/Grace  | Company+Users ACTIVE                                                             |
| Expired company login          | 409 `SUBSCRIPTION_INACTIVE` (accounts also INACTIVE after cascade)               |
| Suspended company login        | 409 `SUBSCRIPTION_INACTIVE` (accounts also INACTIVE after cascade)               |
| Zod failures                   | 400 ValidationAppError                                                           |
| Get subscription wrong company | 404                                                                              |

---

## 11. Swagger Design

- **Tags**: `Admin Subscriptions`, `Company Subscription Status`, extend Authentication docs
- **Schemas**: `CompanySubscription`, status enums, create/renew/expire/suspend requests,
  `SubscriptionStatusResponse`
- **Reuse**: common Unauthorized/Forbidden/NotFound/Validation responses
- **Examples**: Active create body; renew body; login failure for expired company
- Register paths in `openapi.builder.ts`; schemas in `common-schemas.ts`

---

## 12. Testing Strategy

**Vitest + Supertest** (existing layout).

| Layer            | Coverage                                                                                      |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Unit             | Overlap service; period transition rules; login policy subscription gate; use cases           |
| Integration/API  | Admin create/renew/expire/suspend/reactivate/current/history; PATCH; me status                |
| Auth             | Expired/Suspended deny; Trial/Active/Grace allow; SUPER_ADMIN bypass; cascade ACTIVE↔INACTIVE |
| Lifecycle        | Renew closes prior ACTIVE; history length increases; expire/suspend inactivate accounts       |
| Authorization    | OWNER/MANAGER/EMPLOYEE 403 on admin routes                                                    |
| Overlap          | Reject overlapping create/renew                                                               |
| Tenant isolation | Subscription id from company A not visible under company B admin path (404)                   |

---

## 13. Acceptance Criteria (engineering)

1. Super Admin can create/renew/expire/suspend and list history.
2. Overlap and dual-ACTIVE rejected 100% in tests.
3. Tenant login blocked for EXPIRED/SUSPENDED; allowed for TRIAL/ACTIVE/GRACE_PERIOD.
4. SUPER_ADMIN login works regardless of target tenant statuses they manage.
5. OWNER/MANAGER/EMPLOYEE cannot call admin subscription APIs.
6. Closed periods cannot be updated via API.
7. OpenAPI + api-reference updated.
8. Activity Logs emitted for admin subscription mutations.
9. Quickstart scenarios A–F pass.
10. Expire/Suspend cascade Company+Users to INACTIVE and revoke sessions.
11. Create/Renew into allowed status cascade Company+Users to ACTIVE.

---

## 14. Future Extensibility

| Future capability         | Hook without redesign                                                       |
| ------------------------- | --------------------------------------------------------------------------- |
| Online billing / gateways | Attach payment intents to `CompanySubscription`; status still drives access |
| Invoices                  | New Invoice entity FK → subscription id                                     |
| Automatic renewals        | Worker calls same renew use case                                            |
| Recurring billing         | Schedule + renew use case                                                   |
| Plans catalog             | `planId` FK; `planName` denormalized                                        |
| Usage-based billing       | Meter tables; Company status unchanged                                      |
| Coupons                   | Discount records on renew/create input                                      |

History + Company status split is the extension point: billing systems write periods; auth keeps
reading Company.subscriptionStatus.

---

## Phase 0 / Phase 1 Outputs

| Artifact   | Path                                               |
| ---------- | -------------------------------------------------- |
| Research   | [research.md](./research.md)                       |
| Data model | [data-model.md](./data-model.md)                   |
| Contracts  | [contracts/openapi.yaml](./contracts/openapi.yaml) |
| Quickstart | [quickstart.md](./quickstart.md)                   |

## Engineering Decisions (index)

Documented in [research.md](./research.md): dual status model, SUPER_ADMIN role, suspend vs expire
semantics, O(1) login gate, Company/User ACTIVE↔INACTIVE cascade, Activity Log integration, Trial
default, no Prisma in design docs.
