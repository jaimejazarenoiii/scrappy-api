# Implementation Plan: P006 Addendum — Trip Load Management

**Branch**: `015-trip-load-management` | **Date**: 2026-07-14 | **Spec**: [spec.md](./spec.md)

**Input**: Technical design brief for Trip Load Management + product spec (always-on, optional
per trip). Extends Trip aggregate. **Not** implementation code. Follows P001–P011 standards.
No Prisma schema blocks (see [data-model.md](./data-model.md)).

## Summary

Extend the **Trip** aggregate with optional **TripLoad** / **TripLoadItem**, per-trip flags
`loadEnabled` and `strictLoadValidation`, remaining-quantity calculation against outbound
transaction weights, and optional outbound validation (block or warn). Feature is **always
available**; optionality is per trip. Not inventory. Transactions and expenses stay independent.

## Technical Context

**Language/Version**: TypeScript (strict) on Node.js LTS (≥22)

**Primary Dependencies**: Express, Prisma, PostgreSQL, Zod, JWT, Pino, OpenAPI, Vitest,
Supertest — **no new runtime dependencies**

**Storage**: Extend `Trip`; add `TripLoad`, `TripLoadItem` (+ optional Company defaults columns)

**Testing**: Vitest unit + Supertest API (lifecycle, remaining, validation, authz)

**Target Platform**: Linux (Docker); local docker-compose

**Project Type**: modular REST API — Trip module extension + transaction create hook

**Performance Goals**: Remaining/summary O(items + outbound lines for trip); validation on
create uses indexed trip load + trip transactions

**Constraints**: ≤1 TripLoad per Trip; Draft-only mutations; never persist remaining; always-on
product feature; no inventory writes

**Scale/Scope**: Trip extension, load CRUD + summary + enable/disable, transaction validation
hook, OpenAPI/docs/tests

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate                             | Pre-Design | Post-Design | Notes                                   |
| -------------------------------- | ---------- | ----------- | --------------------------------------- |
| Layer boundaries                 | ✅         | ✅          | Domain free of Prisma                   |
| No business logic in controllers | ✅         | ✅          | Controllers → use cases                 |
| Repository pattern               | ✅         | ✅          | TripLoad repository; Trip repo extended |
| Dependency injection             | ✅         | ✅          | `container.ts`                          |
| Zod validation                   | ✅         | ✅          | Load bodies/params                      |
| DTOs                             | ✅         | ✅          | Request/response DTOs                   |
| Standard response envelope       | ✅         | ✅          | `success()` + optional warning meta     |
| Pagination conventions           | ✅         | ✅          | N/A for summary; items small lists      |
| Security                         | ✅         | ✅          | JWT + Owner/Manager/Employee            |
| No `any`                         | ✅         | ✅          | Strict TS                               |
| Error handling                   | ✅         | ✅          | Lifecycle + validation errors           |
| Logging                          | ✅         | ✅          | Activity Log for load mutations         |
| Tests                            | ✅         | ✅          | Unit + API                              |
| OpenAPI                          | ✅         | ✅          | Trip Load tags                          |
| Simplicity                       | ✅         | ✅          | Inside trip module                      |

## Project Structure

### Documentation (this feature)

```text
specs/015-trip-load-management/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/openapi.yaml
└── tasks.md              # /speckit-tasks
```

### Source code (extensions)

```text
src/modules/trip/
├── domain/
│   ├── trip-load.entity.ts
│   ├── trip-load-item.entity.ts
│   ├── trip-load.repository.ts
│   ├── material-name.ts              # normalize + unique
│   └── remaining-quantity.service.ts # pure calc
├── application/
│   ├── dto/
│   ├── services/
│   │   └── trip-load-validation.service.ts  # used by transaction create
│   └── use-cases/
│       ├── enable-trip-load.use-case.ts
│       ├── disable-trip-load.use-case.ts
│       ├── create-trip-load.use-case.ts
│       ├── get-trip-load.use-case.ts
│       ├── update-trip-load.use-case.ts
│       ├── delete-trip-load.use-case.ts
│       ├── add-trip-load-item.use-case.ts
│       ├── update-trip-load-item.use-case.ts
│       ├── remove-trip-load-item.use-case.ts
│       └── get-trip-load-summary.use-case.ts
├── infrastructure/
│   ├── mappers/
│   └── trip-load.prisma-repository.ts
└── presentation/
    ├── trip-load.controller.ts
    ├── trip-load.routes.ts
    ├── trip-load.schemas.ts
    └── trip-load.openapi.ts

# Hook
src/modules/transaction/.../create-transaction.use-case.ts  # call validation service
```

**Structure Decision**: Extend Trip module (aggregate ownership). Inject validation into
transaction create without circular domain deps (application-service interface).

## Complexity Tracking

> No constitution violations requiring justification.

---

## 1. Module Architecture

### Responsibilities

| Concern                                 | Owner                                               |
| --------------------------------------- | --------------------------------------------------- |
| TripLoad / items CRUD & lifecycle locks | Trip module use cases                               |
| `loadEnabled` / `strictLoadValidation`  | Trip entity + enable/disable use cases              |
| Remaining quantity                      | Pure domain service + summary use case              |
| Outbound sell validation                | `TripLoadValidationService` from transaction create |
| Expenses                                | None (read trip link only as today)                 |
| Analytics                               | Future projections; summary API is MVP surface      |

### Why Trip Load belongs to the Trip aggregate

1. Lifetime is the Trip — no independent commercial identity.
2. Mutability is Trip status (Draft vs Started/Completed/Cancelled).
3. Sold quantities are sums of that Trip’s outbound transaction items.
4. Prevents orphan loads and inventory-style shared stock semantics.

### Dependencies

- **Inbound**: Authenticated Owner/Manager/Employee HTTP; transaction create.
- **Outbound**: Trip repository, TripLoad repository, Transaction repository (sum weights),
  Activity Log.

### Integrations

| System       | Integration                                                          |
| ------------ | -------------------------------------------------------------------- |
| Trips        | Extend Trip fields; nest load routes under `/trips/{tripId}/...`     |
| Transactions | On OUTBOUND create (and item add if applicable), run load validation |
| Expenses     | No change                                                            |
| Analytics    | Optional future; summary endpoint sufficient for ops                 |

---

## 2. Entity Design

See [data-model.md](./data-model.md). Highlights:

### Trip (extension)

- `loadEnabled` (bool, default false)
- `strictLoadValidation` (bool, default false → warn)

### TripLoad

- id, tripId (unique), notes, createdByUserId, updatedByUserId, createdAt, updatedAt

### TripLoadItem

- id, tripLoadId, materialName, quantity, unit, notes?, createdAt, updatedAt

Do **not** generate Prisma schema in this plan.

---

## 3. Relationship Design

```text
┌──────────────┐
│     Trip     │◄──── loadEnabled, strictLoadValidation
└──────┬───────┘
       │ 0..1
┌──────▼───────┐
│   TripLoad   │
└──────┬───────┘
       │ *
┌──────▼───────┐
│ TripLoadItem │
└──────────────┘

Trip ──*── Transaction (reference / sum outbound weights)
Trip ──*── Expense     (reference only; unchanged)
```

**Aggregate ownership**: Trip owns TripLoad and TripLoadItems. Transactions reference Trip;
load validation reads transactions but never owns or rewrites them (except reject create when
strict).

---

## 4. Business Workflow

```text
Draft Trip
  → Enable load (optional) / Create TripLoad + items
  → Edit/remove while Draft
  → Start Trip  (load & flags freeze)
  → Outbound Transactions  (remaining ↓; optional validate)
  → Complete Trip  (read-only load history)
```

**Editing**: Draft only for enable/disable, load notes, items.

**Locking**: Started+ → no mutation of load or flags.

**Validation**: See §6.

**Lifecycle**: Cancelled Draft with load → read-only; same immutability as Completed.

---

## 5. Remaining Quantity Strategy

```text
Remaining = LoadedQuantity − Σ Outbound TransactionItem.weight
            (same Trip, matching normalized materialName + unit)
```

- Never persisted; computed on summary/detail GET.
- Include all OUTBOUND txs linked to tripId (non-cancelled per existing P004 rules — exclude
  CANCELLED transactions from the sum).
- Negative remaining allowed when warn mode or validation off.

---

## 6. Validation Strategy

Applies when **all** are true:

1. `Trip.loadEnabled === true`
2. Transaction direction is **Outbound**
3. Matching TripLoadItem exists (normalized name + unit)

Then: `loaded` vs `soldSoFar + currentLine` (same unit).

| `strictLoadValidation` | Behavior                                       |
| ---------------------- | ---------------------------------------------- |
| `true`                 | Block create with business conflict/validation |
| `false`                | Persist + warning in success meta/envelope     |

**Inbound**: never validate against Trip Load.

Company defaults may seed `strictLoadValidation` when enabling load; runtime uses Trip flags.

---

## 7. API Design

Aligned with [contracts/openapi.yaml](./contracts/openapi.yaml). Envelope `success(data, meta)`.
Auth: Company-scoped JWT. Owner/Manager mutate; Employee read if trip member.

### Enable Trip Load

- **Purpose**: Set `loadEnabled = true` on Draft trip (optionally set `strictLoadValidation`).
- **Method**: `POST`
- **URI**: `/api/v1/trips/{tripId}/load/enable`
- **Request**: optional `{ strictLoadValidation?: boolean }`
- **Response**: Trip load flags (+ empty load stub info)
- **Errors**: 404, 403, 409 not Draft / lifecycle

### Disable Trip Load

- **Purpose**: Draft only — `loadEnabled = false`; remove TripLoad if present.
- **Method**: `POST`
- **URI**: `/api/v1/trips/{tripId}/load/disable`
- **Request**: none / optional
- **Response**: confirmation
- **Errors**: 404, 403, 409 not Draft

### Create Trip Load

- **Purpose**: Create load + items on Draft; sets `loadEnabled = true`.
- **Method**: `POST`
- **URI**: `/api/v1/trips/{tripId}/load`
- **Request**: notes?, items[{ materialName, quantity, unit, notes? }]
- **Response**: 201 TripLoad detail
- **Errors**: 400 validation/duplicate material; 409 load exists / not Draft; 403; 404

### Get Trip Load

- **Method**: `GET` `/api/v1/trips/{tripId}/load`
- **Response**: Load + items; remaining when Started/Completed
- **Errors**: 404 no load; 403 Employee non-member

### Update Trip Load (notes)

- **Method**: `PATCH` `/api/v1/trips/{tripId}/load`
- **Request**: notes
- **Errors**: not Draft; 404; 403

### Delete Trip Load

- **Method**: `DELETE` `/api/v1/trips/{tripId}/load`
- **Response**: success; may set `loadEnabled = false`
- **Errors**: not Draft; 404; 403

### Trip Load Items

| Purpose     | Method | URI                                          |
| ----------- | ------ | -------------------------------------------- |
| Add item    | POST   | `/api/v1/trips/{tripId}/load/items`          |
| Update item | PATCH  | `/api/v1/trips/{tripId}/load/items/{itemId}` |
| Remove item | DELETE | `/api/v1/trips/{tripId}/load/items/{itemId}` |

Draft only; Manager/Owner.

### Trip Load Summary / Remaining Quantity

- **Purpose**: Per-item loaded, sold, remaining.
- **Method**: `GET`
- **URI**: `/api/v1/trips/{tripId}/load/summary`
- **Response**: items[{ materialName, unit, loadedQuantity, outboundQuantity, remainingQuantity }],
  notes, tripStatus, loadEnabled, strictLoadValidation
- **Errors**: 404 no load; 403

### Company settings (defaults)

- `GET/PATCH /api/v1/companies/me/trip-load-settings` — `defaultStrictLoadValidation` only
  (no feature enable flag). Owner/Manager.

---

## 8. Validation Design (Zod)

- **Load create**: notes max 2000; items min 1 on create body; each item schema.
- **Item**: materialName trim min 1 max 200; quantity positive decimal; unit enum matching
  `TransactionItemUnit`; notes optional.
- **Enable**: optional boolean strictLoadValidation.
- **Business (application)**: Draft only; unique normalized material; ≤1 load; authz;
  outbound validation arithmetic in trip-load-validation service.
- **Shared**: reuse tripId UUID params; decimal positive refine helpers.

---

## 9. Authorization Matrix

| Action                             | OWNER | MANAGER | EMPLOYEE (assigned) | EMPLOYEE (not assigned) |
| ---------------------------------- | ----- | ------- | ------------------- | ----------------------- |
| Enable / disable load              | ✅    | ✅      | ❌                  | ❌                      |
| Create / update / delete load      | ✅    | ✅      | ❌                  | ❌                      |
| Item mutations                     | ✅    | ✅      | ❌                  | ❌                      |
| Get load / summary                 | ✅    | ✅      | ✅                  | ❌                      |
| Company trip-load-settings         | ✅    | ✅      | ❌                  | ❌                      |
| Create outbound (subject to rules) | ✅    | ✅      | ✅ (existing P004)  | per workforce rules     |

Cross-company: 404/403 as elsewhere.

---

## 10. Business Rules

1. Trip Load is optional; feature always available.
2. At most one TripLoad per Trip.
3. TripLoad belongs to exactly one Trip.
4. Items belong only to one TripLoad.
5. Transactions independent — no required load-item selection.
6. Load does not create/modify transaction rows (validation may reject create).
7. Not inventory — no warehouse balances.
8. Remaining is calculated.
9. Completed / Cancelled / Started: no load mutations.
10. Disable only in Draft.

---

## 11. Error Scenarios

| Scenario                 | Outcome                            |
| ------------------------ | ---------------------------------- |
| Trip already started     | 409 lifecycle — mutations rejected |
| Completed / cancelled    | 409 lifecycle                      |
| TripLoad already exists  | 409 / 400                          |
| TripLoad missing         | 404 on get/mutate items            |
| Invalid quantity         | 400 Zod                            |
| Duplicate materials      | 400                                |
| Strict exceed outbound   | 409/400 business rule              |
| Unauthorized role        | 403                                |
| Cross-company            | 404                                |
| Employee non-member read | 403                                |

---

## 12. Swagger Design

- **Tags**: `Trip Load`
- **Schemas**: TripLoad, TripLoadItem, TripLoadSummary, EnableTripLoadRequest,
  CreateTripLoadRequest, TripLoadSettings
- **Examples**: create with 3 materials; summary with remaining; warn vs block note
- Register in `openapi.builder.ts` / `common-schemas.ts`
- Document warning shape for non-strict exceed on transaction create responses

---

## 13. Testing Strategy

**Vitest + Supertest**

| Layer            | Coverage                                                          |
| ---------------- | ----------------------------------------------------------------- |
| Unit             | normalize material; remaining calc; validation service block/warn |
| API              | enable/disable, CRUD load/items, summary                          |
| Workflow         | Draft edit → start → outbound → remaining → complete locked       |
| Authz            | Owner/Manager vs Employee                                         |
| Validation       | inbound skip; unmatched material skip; strict block               |
| Large load       | e.g. 50 items list/summary within reasonable time                 |
| Tenant isolation | company A trip id inaccessible from company B                     |

---

## 14. Acceptance Criteria (engineering)

1. Owner/Manager enable load and CRUD Draft load/items successfully.
2. Employee assigned can GET load/summary; cannot mutate.
3. Duplicate create load rejected; unique materials enforced.
4. After start, mutations rejected; summary remaining matches formula.
5. Strict trip: exceeding outbound blocked; non-strict: warn + success.
6. Inbound never load-validated.
7. Trip without loadEnabled proceeds with normal transactions.
8. OpenAPI + api-reference updated.
9. Activity Logs for load create/update/delete/enable/disable.
10. Quickstart scenarios pass.

---

## 15. Future Extensibility

| Capability          | Hook                                                       |
| ------------------- | ---------------------------------------------------------- |
| Warehouse inventory | Optional post-start deduction service; TripLoadItem.sku FK |
| Barcode / QR        | Capture path writes same item fields                       |
| Weight scale        | Maps to `quantity` on create/update item                   |
| Vehicle stock       | Cross-trip projection; TripLoad stays per-trip snapshot    |
| Return loads        | New child collection on Trip; reuse item shape             |

Core aggregate (Trip → TripLoad → Items + calculated remaining) stays stable.

---

## Phase 0 / Phase 1 Outputs

| Artifact   | Path                                               |
| ---------- | -------------------------------------------------- |
| Research   | [research.md](./research.md)                       |
| Data model | [data-model.md](./data-model.md)                   |
| Contracts  | [contracts/openapi.yaml](./contracts/openapi.yaml) |
| Quickstart | [quickstart.md](./quickstart.md)                   |

## Engineering Decisions (index)

Documented in [research.md](./research.md): aggregate ownership, always-on vs `loadEnabled`,
strict flag, quantity↔weight mapping, trip module placement, material normalization.
