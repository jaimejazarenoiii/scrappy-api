# Implementation Plan: P005 - Transaction Settlement

**Branch**: `006-transaction-settlement` | **Date**: 2026-07-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-transaction-settlement/spec.md`

**Note**: This plan extends P004 Transaction Management with settlement workflow, Transaction Number,
receipt generation, and audit trail. It is the definitive technical design for implementation — not
implementation code.

## Summary

Extend the existing `transaction` module in place. The `Transaction` aggregate root gains immutable
`transactionNumber`, statuses `READY_FOR_PAYMENT` and `PAID`, submission/payment audit fields, five
new lifecycle use cases (finish, return-to-draft, settle, reopen, get-receipt), lookup by Transaction
Number, and extended authorization/validation rules. Transaction Numbers are allocated atomically at
creation via a sequence counter table. Receipts are computed DTOs for Paid transactions only. All
endpoints follow established P001–P004 patterns: Zod validation, JWT auth, tenant isolation,
standard envelope, OpenAPI, Vitest/Supertest coverage.

## Technical Context

**Language/Version**: TypeScript (strict mode) on Node.js LTS

**Primary Dependencies**: Express.js, Prisma ORM, PostgreSQL, Zod, JWT (P001), Pino, Swagger/OpenAPI,
Vitest, Supertest (unchanged from P004)

**Storage**: PostgreSQL; new `TransactionNumberSequence` supporting table; extended `Transaction`
columns; no Receipt table

**Testing**: Vitest (unit/integration), Supertest (API/workflow/authorization/concurrency)

**Target Platform**: Linux server (Docker); local dev via docker-compose

**Project Type**: modular REST API extending P004 `transaction` module only

**Performance Goals**: Transaction Number allocation under concurrent create without duplicates;
settlement transitions complete in single request-response; receipt assembly under 1 second for
typical item counts; list/search by transactionNumber uses indexed lookup

**Constraints**: Company tenant boundary; Employee submit only on assigned Draft; Manager/Owner
settle; Owner-only reopen; Paid immutable except reopen; archived transactions excluded from
settlement; positive grand total required to finish

**Scale/Scope**: 6 new endpoints, 1 extended lookup route, 4 extended existing behaviors (create,
update, cancel, list); 1 new infrastructure sequence repository; ~12 new/updated use cases

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate                             | Pre-Design | Post-Design | Notes                                                      |
| -------------------------------- | ---------- | ----------- | ---------------------------------------------------------- |
| Layer boundaries                 | ✅         | ✅          | Extensions stay in `transaction` module layers             |
| No business logic in controllers | ✅         | ✅          | New controller methods delegate to use cases               |
| Repository pattern               | ✅         | ✅          | Sequence repo + extended transaction repo                  |
| Dependency injection             | ✅         | ✅          | Wired in `src/config/container.ts`                         |
| Zod validation                   | ✅         | ✅          | New schemas for settle/reopen/return; extended list query  |
| DTOs                             | ✅         | ✅          | ReceiptDto, extended TransactionDetailDto                  |
| Standard response envelope       | ✅         | ✅          | Reuses P001 helpers                                        |
| Pagination conventions           | ✅         | ✅          | Extended list filters only                                 |
| Security                         | ✅         | ✅          | Extended authorization policy                              |
| No `any`                         | ✅         | ✅          | Strict TypeScript                                          |
| Error handling                   | ✅         | ✅          | Lifecycle/business rule errors for invalid transitions     |
| Logging                          | ✅         | ✅          | Audit events for settlement transitions                    |
| Tests                            | ✅         | ✅          | Unit, integration, API, workflow, concurrency              |
| OpenAPI                          | ✅         | ✅          | Settlement + Receipt tags; extended TransactionStatus enum |
| Simplicity                       | ✅         | ✅          | No new modules; sequence table justified for concurrency   |

## Project Structure

### Documentation (this feature)

```text
specs/006-transaction-settlement/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/openapi.yaml
└── tasks.md              # Phase 2 — /speckit-tasks
```

### Source code changes (extends P004)

```text
src/modules/transaction/
├── domain/
│   ├── transaction.entity.ts              # extended props + status helpers
│   ├── transaction-status.ts            # + READY_FOR_PAYMENT, PAID
│   ├── transaction-number.ts            # format + parse value object
│   ├── transaction-rules.ts             # + finish/settle/reopen assertions
│   ├── transaction-lifecycle.ts         # transition matrix
│   ├── transaction.repository.ts        # + findByNumber, sequence hook
│   └── transaction-number-sequence.repository.ts  # NEW interface
├── application/
│   ├── dto/
│   │   ├── receipt.response.ts          # NEW
│   │   └── transaction.response.ts      # + transactionNumber, settlement
│   ├── use-cases/
│   │   ├── create-transaction.use-case.ts       # MOD: assign number
│   │   ├── update-transaction.use-case.ts       # MOD: READY_FOR_PAYMENT edit
│   │   ├── cancel-transaction.use-case.ts       # MOD: from READY_FOR_PAYMENT
│   │   ├── finish-transaction.use-case.ts       # NEW
│   │   ├── return-to-draft.use-case.ts          # NEW
│   │   ├── settle-transaction.use-case.ts       # NEW
│   │   ├── reopen-transaction.use-case.ts       # NEW
│   │   ├── get-receipt.use-case.ts              # NEW
│   │   ├── get-transaction-by-number.use-case.ts # NEW
│   │   └── list-transactions.use-case.ts        # MOD: number filter
│   ├── policies/
│   │   └── transaction-authorization.policy.ts # extended
│   └── services/
│       ├── transaction-number.service.ts        # NEW
│       └── receipt-assembler.service.ts         # NEW
├── infrastructure/
│   ├── transaction.prisma-repository.ts         # MOD
│   └── transaction-number-sequence.prisma-repository.ts  # NEW
└── presentation/
    ├── transaction.controller.ts                # MOD
    ├── transaction.routes.ts                    # MOD route order
    ├── transaction.schemas.ts                   # MOD
    └── transaction.openapi.ts                   # MOD

src/shared/transactions/
└── transaction-number-format.ts                 # NEW shared formatter

tests/
├── unit/transaction/                            # lifecycle, number, rules
├── integration/transaction/                     # sequence concurrency, persistence
└── api/transaction/                             # workflow, auth, receipt
```

**Structure Decision**: Single-module extension per research; no new top-level module.

---

## 1. Module Architecture

### Responsibilities

| Component                                     | P005 responsibility                                             |
| --------------------------------------------- | --------------------------------------------------------------- |
| `transaction` module                          | Settlement lifecycle, Transaction Number, receipt read model    |
| `Transaction` aggregate root                  | Status transitions, settlement metadata, editability invariants |
| `TransactionNumberService`                    | Format and allocate numbers via sequence repository             |
| `ReceiptAssemblerService`                     | Build receipt DTO from Paid transaction + Company + User        |
| `transaction-authorization.policy`            | Role/status matrix for submit, settle, reopen, edit             |
| `transaction-rules` / `transaction-lifecycle` | Transition validation, completeness checks                      |

### Aggregate extension

P005 extends — does not fork — the P004 aggregate:

- Root carries new fields and statuses; children unchanged structurally
- Item/attachment use cases call updated `assertEditable(transaction, auth)` instead of
  draft-only check
- Cancel use case accepts `READY_FOR_PAYMENT` source status

### Service boundaries

```text
[Client]
  → transaction.routes (authn + companyResolution + authorize)
  → transaction.controller
  → settlement use cases
       → transaction.repository
       → transaction-number-sequence.repository (create only)
       → company.repository (receipt)
       → user/employee repositories (display names)
       → audit.service
```

No cross-module writes except read-only Company/User lookups for receipt assembly.

### Dependencies on Transaction aggregate (P004)

| P004 capability      | P005 usage                                    |
| -------------------- | --------------------------------------------- |
| Create transaction   | Hook number assignment                        |
| Update transaction   | Extend editability to READY_FOR_PAYMENT (mgr) |
| Cancel transaction   | Allow from READY_FOR_PAYMENT                  |
| List/get transaction | Include transactionNumber; new filters        |
| Item/attachment CRUD | Extend editability rules                      |
| Authorization policy | Extend with settlement permissions            |
| Audit service        | New event types                               |

### Interaction with future modules

| Future module | Integration point                                         |
| ------------- | --------------------------------------------------------- |
| Trips (P006)  | `tripId` on Transaction; settlement unchanged             |
| Expenses      | Reference `transactionId`, `transactionNumber`, `paidAt`  |
| Analytics     | Aggregate on `status`, `paidAt`, `direction`, `companyId` |
| Reports       | Filter by `transactionNumber`, settlement date range      |

### Why settlement belongs in the Transaction aggregate

1. **Single lifecycle authority** — `status` drives all editability; splitting settlement would
   duplicate state synchronization.
2. **Invariant locality** — "only READY_FOR_PAYMENT may be paid" is a root rule.
3. **Receipt derivation** — receipt is a projection of Paid root + children; no separate aggregate.
4. **P004 anticipation** — data-model explicitly reserved status enum extension on root.

---

## 2. Entity Extension Design

See [data-model.md](./data-model.md) for full field tables.

### Transaction Number

| Property          | Design                                                   |
| ----------------- | -------------------------------------------------------- |
| Purpose           | Human-readable immutable business identifier per Company |
| Inbound format    | `IN-YYYYMMDD-000001`                                     |
| Outbound format   | `OUT-YYYYMMDD-000001`                                    |
| Generation timing | Synchronously at create, before first commit             |
| Date component    | UTC calendar date from `transactionDate` at creation     |
| Sequence scope    | Per `(companyId, direction, sequenceDate)`               |
| Uniqueness        | DB unique `(companyId, transactionNumber)`               |
| Immutability      | No update path; excluded from PATCH body                 |
| After cancel      | Number retained                                          |
| After reopen      | Number retained; payment fields cleared                  |

### Additional Transaction fields

| Field             | Purpose                                  | Relationships      |
| ----------------- | ---------------------------------------- | ------------------ |
| transactionNumber | Business identifier                      | Unique per company |
| submittedAt       | When Employee submitted for settlement   | Set on finish      |
| submittedByUserId | Who submitted                            | FK → User          |
| paidAt            | When settlement recorded                 | Set on settle      |
| paidByUserId      | Who settled                              | FK → User          |
| cancelledByUserId | Who cancelled (extends P004 cancelledAt) | FK → User          |
| reopenedAt        | Last Owner reopen timestamp              | Audit              |
| reopenedByUserId  | Who reopened                             | FK → User          |
| reopenReason      | Required reopen justification            | Audit text         |

### Status enum

```typescript
// domain/transaction-status.ts
['DRAFT', 'READY_FOR_PAYMENT', 'PAID', 'CANCELLED'];
```

| Status            | Purpose                                      |
| ----------------- | -------------------------------------------- |
| DRAFT             | Operational entry in progress                |
| READY_FOR_PAYMENT | Submitted; awaiting Manager/Owner settlement |
| PAID              | Financially settled; locked                  |
| CANCELLED         | Voided; terminal                             |

### Indexes

- UNIQUE `(companyId, transactionNumber)`
- `(companyId, paidAt)` — future reporting
- `(companyId, submittedAt)` — submission queue ordering
- Existing P004 indexes retained

### Future extensibility

- `paymentReference` column (nullable) reserved for bank integration
- `TransactionStatusHistory` table optional later
- Receipt PDF generation as presentation adapter without schema change

---

## 3. State Machine Design

### Allowed transitions

| From              | To                | Action          | Actor             |
| ----------------- | ----------------- | --------------- | ----------------- |
| DRAFT             | READY_FOR_PAYMENT | finish          | Assigned Employee |
| DRAFT             | CANCELLED         | cancel          | Per P004 auth     |
| READY_FOR_PAYMENT | PAID              | settle          | Manager, Owner    |
| READY_FOR_PAYMENT | DRAFT             | return-to-draft | Manager, Owner    |
| READY_FOR_PAYMENT | CANCELLED         | cancel          | Manager, Owner    |
| PAID              | READY_FOR_PAYMENT | reopen          | Owner             |

### Invalid transitions (reject with `LIFECYCLE_CONFLICT`)

- DRAFT → PAID (must submit first)
- DRAFT → reopen
- PAID → CANCELLED (must reopen first)
- PAID → DRAFT (must reopen → optional return-to-draft)
- CANCELLED → any
- Any → DRAFT except return-to-draft from READY_FOR_PAYMENT
- finish when not DRAFT
- settle when not READY_FOR_PAYMENT
- reopen when not PAID

### Reopen behavior

1. Validate Owner role
2. Assert `status === PAID`
3. Set `status = READY_FOR_PAYMENT`
4. Clear `paidAt`, `paidByUserId`
5. Set `reopenedAt`, `reopenedByUserId`, `reopenReason`
6. Retain `submittedAt` / `submittedByUserId` (submission history preserved)
7. Emit audit event

### State ownership

| Concern          | Owner layer                         |
| ---------------- | ----------------------------------- |
| Transition rules | `domain/transaction-lifecycle.ts`   |
| Enforcement      | Use cases before repository persist |
| Persistence      | `transaction.repository`            |

### Locking behavior

| Status            | Header edit | Item edit | Photo edit | Settle | Reopen |
| ----------------- | ----------- | --------- | ---------- | ------ | ------ |
| DRAFT             | Per P004    | Per P004  | Per P004   | ❌     | ❌     |
| READY_FOR_PAYMENT | Mgr/Owner   | Mgr/Owner | Mgr/Owner  | Mgr    | ❌     |
| PAID              | ❌          | ❌        | ❌         | ❌     | Owner  |
| CANCELLED         | ❌          | ❌        | ❌         | ❌     | ❌     |

---

## 4. Business Workflow

### Employee

1. **Create Draft** — P004 flow; receives `transactionNumber` immediately
2. **Edit Draft** — P004 PATCH/items/photos while assigned
3. **Submit** — `POST .../finish` when complete; status → READY_FOR_PAYMENT; locked for Employee

### Manager

1. **Review** — list/filter `status=READY_FOR_PAYMENT`; view detail by id or transactionNumber
2. **Edit** — PATCH header/items on READY_FOR_PAYMENT transactions
3. **Return to Draft** — `POST .../return-to-draft` for Employee correction
4. **Mark Paid** — `POST .../settle`; records payment metadata
5. **Cancel** — from Draft or READY_FOR_PAYMENT
6. **Generate Receipt** — `GET .../receipt` after Paid

### Owner

- All Manager capabilities
- **Reopen Paid** — `POST .../reopen` with required reason; enables correction cycle

### End-to-end flow

```text
Employee: create (number assigned) → edit draft → finish
Manager:  review queue → [edit | return-to-draft | settle | cancel]
Owner:    reopen if settlement error → manager re-settles
Anyone authorized: receipt after Paid
```

---

## 5. Transaction Number Strategy

### Generation timing

Inside `CreateTransactionUseCase.execute()` within a DB transaction:

1. Allocate sequence for `(companyId, direction, date)`
2. Format number
3. Insert Transaction with `transactionNumber`

### Uniqueness

- Application: sequence counter per day/direction/company
- Database: UNIQUE `(companyId, transactionNumber)`

### Concurrency handling

`TransactionNumberSequenceRepository.allocateNext()` uses:

```text
BEGIN
  INSERT ... ON CONFLICT DO UPDATE SET lastSequence = lastSequence + 1 RETURNING lastSequence
  -- or SELECT FOR UPDATE on existing row
COMMIT
```

Same pattern wrapped in Prisma `$transaction()`.

### Searching

- `GET /transactions/by-number/{transactionNumber}` — exact match, tenant-scoped
- `GET /transactions?transactionNumber={prefix}` — `startsWith` filter
- `search` query param also matches `transactionNumber` partial

### Formatting examples

| Direction | transactionDate (UTC) | Sequence | Result              |
| --------- | --------------------- | -------- | ------------------- |
| INBOUND   | 2026-07-08            | 1        | IN-20260708-000001  |
| INBOUND   | 2026-07-08            | 2        | IN-20260708-000002  |
| OUTBOUND  | 2026-07-08            | 1        | OUT-20260708-000001 |
| INBOUND   | 2026-07-09            | 1        | IN-20260709-000001  |

### After cancellation

Number unchanged; transaction searchable by number with `status=CANCELLED`.

### After reopening

Number unchanged; `paidAt`/`paidByUserId` cleared; new settlement produces new paid metadata.

---

## 6. Receipt Design

### Receipt contents

| Field             | Source                                                   |
| ----------------- | -------------------------------------------------------- |
| transactionNumber | Transaction                                              |
| company           | Company (name, contact, email, address)                  |
| direction         | Transaction.direction                                    |
| directionLabel    | BUY / SELL mapper                                        |
| partyName         | Transaction.partyName                                    |
| transactionDate   | Transaction.transactionDate                              |
| items             | TransactionItem[] (material, weight, unit, price, total) |
| grandTotal        | Sum of item totals                                       |
| paidByDisplayName | User email or Employee full name                         |
| paidAt            | Transaction.paidAt                                       |

### Generation rules

- Only when `status === PAID`
- Idempotent read — same data on repeat GET
- Not persisted; assembled per request
- Not available for Draft, READY_FOR_PAYMENT, Cancelled, or archived

### Future extensibility

- `Accept: application/pdf` content negotiation in future adapter
- Optional `paymentReference` on receipt when column added
- Company logo URL from Company.logoUrl

---

## 7. API Design

All endpoints: `/api/v1`, Bearer auth, standard envelope, tenant-scoped.

### Submit Transaction (Finish)

|              |                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------- |
| **Purpose**  | Employee submits Draft for settlement                                                    |
| **Method**   | `POST`                                                                                   |
| **URI**      | `/transactions/{transactionId}/finish`                                                   |
| **Request**  | none                                                                                     |
| **Response** | `TransactionDetail` with `status: READY_FOR_PAYMENT`, `submittedAt`, `transactionNumber` |
| **Errors**   | 400 incomplete, 403 not assigned, 404, 409 not draft / archived                          |

### Return To Draft

|              |                                                            |
| ------------ | ---------------------------------------------------------- |
| **Purpose**  | Manager/Owner returns submitted transaction for correction |
| **Method**   | `POST`                                                     |
| **URI**      | `/transactions/{transactionId}/return-to-draft`            |
| **Request**  | `{ reason?: string }`                                      |
| **Response** | `TransactionDetail` with `status: DRAFT`                   |
| **Errors**   | 403 Employee, 409 not READY_FOR_PAYMENT                    |

### Mark Paid (Settle)

|              |                                                                   |
| ------------ | ----------------------------------------------------------------- |
| **Purpose**  | Record financial settlement                                       |
| **Method**   | `POST`                                                            |
| **URI**      | `/transactions/{transactionId}/settle`                            |
| **Request**  | `{ settlementNote?: string }`                                     |
| **Response** | `TransactionDetail` with `status: PAID`, `paidAt`, `paidByUserId` |
| **Errors**   | 403 Employee, 409 not READY_FOR_PAYMENT / already paid            |

### Cancel Transaction (extended)

|              |                                                                   |
| ------------ | ----------------------------------------------------------------- |
| **Purpose**  | Cancel Draft or READY_FOR_PAYMENT                                 |
| **Method**   | `POST`                                                            |
| **URI**      | `/transactions/{transactionId}/cancel`                            |
| **Request**  | `{ cancellationReason?: string }`                                 |
| **Response** | `TransactionDetail` with `status: CANCELLED`, `cancelledByUserId` |
| **Errors**   | 409 Paid / Cancelled                                              |

### Reopen Transaction

|              |                                                                           |
| ------------ | ------------------------------------------------------------------------- |
| **Purpose**  | Owner reverses settlement                                                 |
| **Method**   | `POST`                                                                    |
| **URI**      | `/transactions/{transactionId}/reopen`                                    |
| **Request**  | `{ reason: string }` required                                             |
| **Response** | `TransactionDetail` with `status: READY_FOR_PAYMENT`, cleared paid fields |
| **Errors**   | 403 Manager/Employee, 409 not PAID                                        |

### Generate Receipt

|              |                                         |
| ------------ | --------------------------------------- |
| **Purpose**  | Retrieve settlement receipt             |
| **Method**   | `GET`                                   |
| **URI**      | `/transactions/{transactionId}/receipt` |
| **Request**  | none                                    |
| **Response** | `Receipt` DTO                           |
| **Errors**   | 409 not PAID, 403, 404                  |

### Search By Transaction Number

|              |                                               |
| ------------ | --------------------------------------------- |
| **Purpose**  | Direct lookup by business number              |
| **Method**   | `GET`                                         |
| **URI**      | `/transactions/by-number/{transactionNumber}` |
| **Request**  | path: transactionNumber                       |
| **Response** | `TransactionDetail`                           |
| **Errors**   | 404, 403 cross-tenant                         |

### Extended: List / Update

- `GET /transactions` — add `transactionNumber` query filter; `status` includes new values
- `PATCH /transactions/{id}` — allow Manager/Owner edit on READY_FOR_PAYMENT

**Route order** (critical):

```text
/transactions/suggestions/*
/transactions/assigned
/transactions/by-number/:transactionNumber   # NEW — before :transactionId
/transactions/:transactionId/finish
/transactions/:transactionId/return-to-draft
/transactions/:transactionId/settle
/transactions/:transactionId/reopen
/transactions/:transactionId/receipt
/transactions/:transactionId/...
```

---

## 8. Validation Design (Zod)

### Settlement validation schemas

| Schema                         | Location               | Rules                           |
| ------------------------------ | ---------------------- | ------------------------------- |
| `finishParamsSchema`           | transaction.schemas.ts | uuid transactionId              |
| `returnToDraftSchema`          | transaction.schemas.ts | optional reason max 500         |
| `settleTransactionSchema`      | transaction.schemas.ts | optional settlementNote max 500 |
| `reopenTransactionSchema`      | transaction.schemas.ts | required reason min 1 max 1000  |
| `transactionNumberParamSchema` | transaction.schemas.ts | regex `^(IN\|OUT)-\d{8}-\d{6}$` |

### Status validation

- `listTransactionsQuerySchema.status` — extend enum with `READY_FOR_PAYMENT`, `PAID`
- Reject client-supplied `transactionNumber` on create/update bodies (strip unknown keys)

### Transition validation (domain — not Zod)

`assertTransition(from, to, actor)` in `transaction-lifecycle.ts` called by each use case.

### Receipt validation

- Use case asserts `transaction.isPaid()` before assembly
- No request body

### Business validation (domain rules)

| Rule                     | Function                     |
| ------------------------ | ---------------------------- |
| Draft-only finish        | `assertFinishable()`         |
| At least one item        | `assertHasItems()`           |
| Positive grand total     | `assertPositiveGrandTotal()` |
| Location complete        | `assertLocationFields()`     |
| Not archived             | `assertNotArchived()`        |
| Ready for payment settle | `assertReadyForPayment()`    |
| Paid reopen              | `assertPaid()`               |

### Shared validators

Reuse P004: `assertLocationFields`, `assertItemTotal`, pagination query schema, uuid params.

---

## 9. Authorization Matrix

| Action           | Owner | Manager | Employee                   |
| ---------------- | ----- | ------- | -------------------------- |
| Submit (finish)  | ❌    | ❌      | ✅ assigned Draft only     |
| Review (view)    | ✅    | ✅      | ✅ assigned                |
| Edit Draft       | ✅    | ✅      | ✅ assigned                |
| Edit Submitted   | ✅    | ✅      | ❌                         |
| Return to draft  | ✅    | ✅      | ❌                         |
| Mark paid        | ✅    | ✅      | ❌                         |
| Cancel Draft     | ✅    | ✅      | ✅ assigned (P004)         |
| Cancel Submitted | ✅    | ✅      | ❌                         |
| Reopen paid      | ✅    | ❌      | ❌                         |
| Generate receipt | ✅    | ✅      | ✅ if can view transaction |
| Lookup by number | ✅    | ✅      | ✅ if can view transaction |

Policy functions to add:

- `assertCanFinish(auth, { isAssigned })`
- `assertCanSettle(auth)`
- `assertCanReturnToDraft(auth)`
- `assertCanReopen(auth)` — Owner only
- `assertCanEditTransaction(auth, transaction, { isAssigned })` — status-aware

---

## 10. Business Rules

1. Only Draft transactions may be submitted (finish).
2. Only Ready for Payment transactions may be marked Paid.
3. Employees cannot modify submitted (READY_FOR_PAYMENT) or Paid transactions.
4. Managers and Owners may edit submitted transactions.
5. Paid transactions are immutable except Owner reopen.
6. Only Owners may reopen Paid transactions.
7. Transaction Numbers never change after creation.
8. Receipts are only available after Paid.
9. Inbound settle = Company pays Party; Outbound settle = Company receives from Party.
10. Cancelled transactions cannot be finished, settled, reopened, or receipted.
11. Archived transactions cannot enter settlement workflow.
12. Grand total must be positive to finish.

---

## 11. Error Scenarios

| Scenario                   | HTTP | error.code              | When                                |
| -------------------------- | ---- | ----------------------- | ----------------------------------- |
| Invalid transition         | 409  | LIFECYCLE_CONFLICT      | e.g. settle Draft, finish Paid      |
| Duplicate settlement       | 409  | LIFECYCLE_CONFLICT      | Second settle on Paid               |
| Already paid               | 409  | LIFECYCLE_CONFLICT      | Settle when PAID                    |
| Already cancelled          | 409  | LIFECYCLE_CONFLICT      | Any mutation on CANCELLED           |
| Invalid transaction number | 400  | VALIDATION_ERROR        | Malformed number in path/query      |
| Unauthorized settlement    | 403  | FORBIDDEN               | Employee calls settle/reopen/return |
| Cross-company access       | 404  | RESOURCE_NOT_FOUND      | Masked tenant violation             |
| Incomplete finish          | 400  | VALIDATION_ERROR        | Missing items/location              |
| Zero grand total           | 409  | BUSINESS_RULE_VIOLATION | Finish with zero total              |
| Receipt not paid           | 409  | LIFECYCLE_CONFLICT      | Receipt on non-Paid                 |
| Not found                  | 404  | RESOURCE_NOT_FOUND      | Invalid id or number in tenant      |

---

## 12. Swagger Design

### Tags

- `Transaction Settlement` — finish, return-to-draft, settle, reopen
- `Transaction Receipt` — get receipt
- `Transactions` — extended list, by-number lookup (update existing tag)

### Schema updates (`common-schemas.ts` + `transaction.openapi.ts`)

- Extend `TransactionStatus` enum: `READY_FOR_PAYMENT`, `PAID`
- Add `TransactionNumber` string pattern
- Add `SettlementSummary`, `Receipt`, `ReceiptItem`, `ReceiptCompany`
- Extend `TransactionDetail` / `TransactionSummary` with `transactionNumber`, settlement fields
- Request bodies: `ReturnToDraftRequest`, `SettleTransactionRequest`, `ReopenTransactionRequest`

### Examples

```json
// TransactionDetail excerpt after settle
{
  "transactionNumber": "IN-20260708-000001",
  "status": "PAID",
  "settlement": {
    "submittedAt": "2026-07-08T08:00:00.000Z",
    "paidAt": "2026-07-08T10:30:00.000Z",
    "paidByUserId": "uuid",
    "paidByDisplayName": "Manager Demo"
  }
}
```

### Error responses

Reuse `standardErrorResponses` from `openapi-helpers.ts` for all new operations.

---

## 13. Testing Strategy

### Unit tests (Vitest)

| Area                        | File pattern                                   |
| --------------------------- | ---------------------------------------------- |
| Status helpers              | `transaction.entity.test.ts`                   |
| Transition matrix           | `transaction-lifecycle.test.ts`                |
| Number formatting           | `transaction-number.test.ts`                   |
| Finish use case             | `finish-transaction.use-case.test.ts`          |
| Settle / reopen / return    | `settlement.use-cases.test.ts`                 |
| Receipt assembler           | `receipt-assembler.service.test.ts`            |
| Authorization policy        | `transaction-authorization.policy.test.ts`     |
| Updated update/cancel cases | `update-transaction.use-case.test.ts` (extend) |

### Integration tests

| Area                        | File                                              |
| --------------------------- | ------------------------------------------------- |
| Number sequence concurrency | `transaction-number-sequence.persistence.test.ts` |
| Status persistence          | `transaction-settlement.persistence.test.ts`      |
| Backfill migration          | `transaction-number-backfill.test.ts`             |

### API tests (Supertest)

| Area                 | File                                              |
| -------------------- | ------------------------------------------------- |
| Finish workflow      | `transaction-finish.api.test.ts`                  |
| Settle workflow      | `transaction-settle.api.test.ts`                  |
| Reopen workflow      | `transaction-reopen.api.test.ts`                  |
| Return to draft      | `transaction-return-draft.api.test.ts`            |
| Receipt              | `transaction-receipt.api.test.ts`                 |
| Lookup by number     | `transaction-by-number.api.test.ts`               |
| Authorization matrix | `transaction-settlement-auth.api.test.ts`         |
| Invalid transitions  | `transaction-settlement-errors.api.test.ts`       |
| Tenant isolation     | extend `transaction-tenant-isolation.api.test.ts` |

### Workflow tests

End-to-end in API layer: create → finish → settle → receipt → reopen → re-settle.

### Concurrency tests

Parallel `POST /transactions` (10+ concurrent) asserting unique sequential numbers.

### In-memory repository updates

Extend `InMemoryTransactionStore` with `transactionNumber`, new statuses, sequence simulation.

---

## 14. Acceptance Criteria (Engineering)

1. Migration adds columns and sequence table; backfills existing transactions with unique numbers.
2. `CreateTransactionUseCase` returns `transactionNumber` on every new transaction.
3. `POST .../finish` transitions Draft → READY_FOR_PAYMENT with audit fields; Employee PATCH returns 403.
4. `POST .../settle` transitions READY_FOR_PAYMENT → PAID with `paidAt`/`paidByUserId`.
5. `POST .../reopen` is Owner-only; clears paid fields; returns to READY_FOR_PAYMENT.
6. `GET .../receipt` returns full Receipt DTO for Paid only.
7. `GET .../by-number/{n}` resolves within tenant; 404 for other company.
8. List filter `transactionNumber` and extended `status` values work with pagination.
9. Manager can PATCH items on READY_FOR_PAYMENT; Employee cannot.
10. All invalid transitions return 409 without partial DB state.
11. Concurrent creates produce unique sequential numbers (integration test green).
12. OpenAPI documents all new endpoints and extended schemas.
13. Existing P004 tests remain green (regression).
14. Audit events emitted for finish, settle, reopen, return-to-draft.

---

## 15. Future Extensibility

| Module    | How P005 enables integration without redesign                    |
| --------- | ---------------------------------------------------------------- |
| Trips     | `tripId` optional; settlement independent of trip enforcement    |
| Expenses  | Link expense records to `transactionId` + `transactionNumber`    |
| Analytics | Query `status=PAID`, group by `paidAt`, `direction`, `companyId` |
| Reports   | Export by `transactionNumber` range, settlement date, party name |

Paid status is the financial recognition point. Transaction Number is the stable external key across
all future modules.

## Complexity Tracking

| Addition                        | Why needed                        | Simpler alternative rejected     |
| ------------------------------- | --------------------------------- | -------------------------------- |
| TransactionNumberSequence table | Safe concurrent suffix allocation | MAX+1 query races under load     |
| transaction-lifecycle.ts        | Central transition matrix         | Scattered if-checks in use cases |
| ReceiptAssembler service        | Isolate Company/User lookup       | Fat controller                   |

## Phase Artifacts

| Artifact              | Path                                               | Status                   |
| --------------------- | -------------------------------------------------- | ------------------------ |
| Research              | [research.md](./research.md)                       | ✅                       |
| Data model            | [data-model.md](./data-model.md)                   | ✅                       |
| API contracts         | [contracts/openapi.yaml](./contracts/openapi.yaml) | ✅                       |
| Quickstart validation | [quickstart.md](./quickstart.md)                   | ✅                       |
| Tasks (next phase)    | tasks.md                                           | Pending `/speckit-tasks` |
