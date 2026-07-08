# Research: Transaction Settlement (P005)

**Feature**: `006-transaction-settlement`  
**Date**: 2026-07-08

## 1. Settlement as Transaction aggregate extension

**Decision**: Implement P005 entirely within the existing `transaction` module. Settlement is not a
separate bounded context; it extends the `Transaction` aggregate root with new status values,
settlement metadata, Transaction Number, receipt read model, and lifecycle use cases.

**Rationale**: P004 established Transaction as the lifecycle authority. Settlement transitions
(`READY_FOR_PAYMENT`, `PAID`) are root-level invariants. Items and attachments inherit editability
from root status. Receipt is a derived view of a Paid transaction, not a separate aggregate.

**Alternatives considered**:

- Separate `settlement` module with its own aggregate — rejected; duplicates lifecycle ownership and
  risks inconsistent state between modules.
- Event-sourced settlement ledger — rejected; exceeds scope and constitution simplicity principle.

## 2. Transaction Number generation and concurrency

**Decision**: Assign `transactionNumber` atomically inside the same database transaction as
`CreateTransactionUseCase`. Use a dedicated sequence counter table keyed by
`(companyId, direction, sequenceDate)` where `sequenceDate` is `YYYYMMDD` derived from
`transactionDate` at creation (UTC date part, consistent with P004 datetime storage).

Increment pattern:

1. Upsert or lock sequence row for `(companyId, direction, sequenceDate)`.
2. Increment `lastSequence` and read new value.
3. Format: `{IN|OUT}-{YYYYMMDD}-{sequence padded to 6 digits}`.
4. Persist on Transaction with unique constraint `(companyId, transactionNumber)`.

**Rationale**: Per-company per-direction per-day sequences match the business format. Row-level lock
or atomic `UPDATE ... RETURNING` prevents duplicate suffixes under concurrent creates.

**Alternatives considered**:

- Application-level random suffix — rejected; not sequential, harder for operators.
- Max+1 query without lock — rejected; race condition under concurrency.
- Global company-wide sequence ignoring direction — rejected; violates IN/OUT prefix separation.

## 3. Status enum extension strategy

**Decision**: Extend `TransactionStatus` to `DRAFT | READY_FOR_PAYMENT | PAID | CANCELLED`. Map API
and storage as `SCREAMING_SNAKE_CASE` per P004 convention. Domain entity gains
`isReadyForPayment()`, `isPaid()`, and updated editability helpers.

**Rationale**: Single enum column extension is the minimal migration path anticipated in P004
data-model future extensibility notes.

**Alternatives considered**:

- Separate `settlementStatus` column — rejected; splits lifecycle across two fields and complicates
  invariants.

## 4. Editability matrix by status

**Decision**:

| Status            | Employee (assigned)      | Manager/Owner                 |
| ----------------- | ------------------------ | ----------------------------- |
| DRAFT             | Edit header/items/photos | Edit any Company draft        |
| READY_FOR_PAYMENT | Read-only                | Edit header/items/photos      |
| PAID              | Read-only                | Read-only (Owner reopen only) |
| CANCELLED         | Read-only                | Read-only                     |

Finish (submit) is Employee-only on assigned Draft. Settle and return-to-draft are Manager/Owner.
Reopen is Owner-only on Paid.

**Rationale**: Matches product spec separation of operational entry vs financial settlement.

## 5. Audit trail approach

**Decision**: Record lifecycle actors on the Transaction root:

- `submittedAt` + `submittedByUserId` on finish
- `paidAt` + `paidByUserId` on settle
- `cancelledAt` + `cancelledByUserId` on cancel (extend P004 `cancelledAt` only)
- `reopenedAt` + `reopenedByUserId` + `reopenReason` on reopen (new fields for audit)

Emit existing audit service events for each transition (`transaction.finished`,
`transaction.settled`, `transaction.reopened`, etc.).

**Rationale**: Root-level audit columns support receipts and reports without a separate audit
aggregate. Audit service preserves event log for compliance.

**Alternatives considered**:

- Separate `TransactionStatusHistory` table — deferred to future reporting spec; root columns
  sufficient for P005.

## 6. Receipt delivery model

**Decision**: Receipt is a **computed DTO** returned by `GET /transactions/{id}/receipt`. No
persistent Receipt table in P005. Assembler loads Transaction (Paid), Company, Items, and resolves
`paidByDisplayName` from User/Employee profile.

**Rationale**: Receipt content is fully determined by Paid transaction state; avoids sync issues.
PDF/email rendering deferred to future spec.

## 7. Route registration order

**Decision**: Register `GET /transactions/by-number/:transactionNumber` before
`GET /transactions/:transactionId`. Existing P004 ordering for `/assigned` and `/suggestions/*`
unchanged. New POST routes mount as sub-resources:
`/transactions/:transactionId/finish|return-to-draft|settle|reopen|receipt`.

**Rationale**: Prevents Express param shadowing (`by-number` captured as transactionId).

## 8. Completeness validation on finish

**Decision**: Reuse P004 `assertLocationFields`, item count check, and positive `grandTotal` check
in `assertFinishable(transaction, items)`. No new completeness rules beyond spec.

**Rationale**: Finish is the gate from operational draft to financial queue; same invariants as
"complete for handoff" noted in P004 FR-022.

## 9. Backfill strategy for existing transactions

**Decision**: Migration backfills `transactionNumber` for existing rows using the same sequence
table logic based on `createdAt` date and `direction`, processed in creation order per
company/direction/day batch.

**Rationale**: Dev/staging databases may have P004 seed data without numbers; backfill prevents
null numbers on upgraded environments.

## 10. Integration with future modules

**Decision**: Expose stable identifiers for downstream specs:

- `transactionNumber` — external reference
- `status = PAID` + `paidAt` — financial recognition timestamp
- `direction` — cash flow semantics (company pays vs receives)

Trips (P006) link via existing optional `tripId`. Expenses may reference `transactionId` and
`transactionNumber`. Analytics aggregate on `paidAt` and `status`.

**Rationale**: No schema redesign required for P006+ if these fields remain stable on the root.
