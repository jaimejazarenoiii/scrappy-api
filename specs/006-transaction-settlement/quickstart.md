# Quickstart: Transaction Settlement (P005)

**Feature**: `006-transaction-settlement`  
**Purpose**: Validate P005 settlement workflow end-to-end after implementation.

See also: [spec.md](./spec.md) | [plan.md](./plan.md) | [data-model.md](./data-model.md) | [contracts/openapi.yaml](./contracts/openapi.yaml)

## Prerequisites

- P001–P004 implemented and migrated
- Seed data: `pnpm run db:seed` (owner, manager, employee accounts)
- Employee timed in for transaction creation
- At least one Draft transaction with items, or create one per P004 quickstart

## Scenario 1: Transaction Number at Creation

1. Authenticate as timed-in Employee.
2. `POST /api/v1/transactions` — create Draft with direction `BUY` and one item.
3. `GET /api/v1/transactions/{transactionId}` — confirm `transactionNumber` matches
   `IN-{YYYYMMDD}-{sequence}` format.

**Expected**: Number present on first response; immutable on subsequent reads.

## Scenario 2: Employee Submit (Finish)

1. Authenticate as assigned Employee on a complete Draft.
2. `POST /api/v1/transactions/{transactionId}/finish`.
3. Confirm `status: READY_FOR_PAYMENT`, `submittedAt` set, `transactionNumber` unchanged.
4. Attempt `PATCH /api/v1/transactions/{transactionId}` as Employee — expect 403.

**Expected**: Submit succeeds; Employee locked out of edits.

## Scenario 3: Manager Review and Return to Draft

1. Authenticate as Manager.
2. `PATCH /api/v1/transactions/{transactionId}` on READY_FOR_PAYMENT — confirm edit succeeds.
3. `POST /api/v1/transactions/{transactionId}/return-to-draft` with optional reason.
4. Confirm `status: DRAFT`; Employee can edit again.

**Expected**: Manager can edit and return; status transitions correctly.

## Scenario 4: Settlement (Mark Paid)

1. Re-finish transaction to READY_FOR_PAYMENT (or use another submitted transaction).
2. Authenticate as Manager.
3. `POST /api/v1/transactions/{transactionId}/settle`.
4. Confirm `status: PAID`, `paidAt` and `paidByUserId` populated.
5. Attempt second settle — expect 409 LIFECYCLE_CONFLICT.

**Expected**: Single settlement; duplicate rejected.

## Scenario 5: Receipt

1. On Paid transaction: `GET /api/v1/transactions/{transactionId}/receipt`.
2. Confirm receipt contains transactionNumber, company, directionLabel, partyName, items,
   grandTotal, paidByDisplayName, paidAt.
3. On READY_FOR_PAYMENT transaction: same endpoint — expect 409.

**Expected**: Receipt only for Paid transactions.

## Scenario 6: Owner Reopen

1. Authenticate as Owner on Paid transaction.
2. `POST /api/v1/transactions/{transactionId}/reopen` with `{ "reason": "Incorrect amount" }`.
3. Confirm `status: READY_FOR_PAYMENT`, `paidAt` cleared.
4. Authenticate as Manager — attempt reopen — expect 403.
5. Re-settle and confirm new `paidAt`.

**Expected**: Owner-only reopen; re-settlement works.

## Scenario 7: Search by Transaction Number

1. `GET /api/v1/transactions/by-number/{transactionNumber}` — exact match.
2. `GET /api/v1/transactions?transactionNumber=IN-2026` — prefix filter as Manager.
3. Cross-company lookup with another tenant token — expect 404.

**Expected**: Lookup within tenant scope; number search on list.

## Scenario 8: Cancel Extensions

1. Cancel READY_FOR_PAYMENT transaction as Manager — expect `status: CANCELLED`.
2. Attempt finish/settle/receipt on Cancelled — expect 409.
3. Attempt cancel on Paid — expect 409.

**Expected**: Cancel from Draft and READY_FOR_PAYMENT only.

## Scenario 9: Authorization Matrix Smoke Test

| Action          | Employee    | Manager | Owner |
| --------------- | ----------- | ------- | ----- |
| Finish          | ✅ assigned | ❌      | ❌    |
| Settle          | ❌          | ✅      | ✅    |
| Return to draft | ❌          | ✅      | ✅    |
| Reopen          | ❌          | ❌      | ✅    |
| Receipt         | ✅ view     | ✅      | ✅    |

Run one forbidden case per row and confirm 403.

## Scenario 10: Concurrency (Transaction Number)

1. Run parallel creates (script or concurrent requests) for same company/direction/day.
2. Verify all returned `transactionNumber` values are unique sequential suffixes.

**Expected**: No duplicate numbers under concurrent load.
