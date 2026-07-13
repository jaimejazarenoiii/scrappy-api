# Research: P011 - Company Subscription Management

**Feature**: `014-company-subscription`  
**Date**: 2026-07-13

## 1. Separate history rows vs Company operational status

**Decision**: Store immutable/near-immutable **CompanySubscription** period rows for history, and
keep a denormalized **`Company.subscriptionStatus`** for authentication checks.

**Rationale**: Login must be O(1) on the Company already loaded during auth. Scanning history on
every login is unnecessary and couples entitlement to date math. History remains the audit/commercial
record; operational status is the access gate.

**Alternatives considered**:

- Derive status only from history on each login — slower, more error-prone, harder to support
  Suspended without inventing fake periods.
- Only operational status, no history — fails FR for renewals and supportability.

## 2. Scrappy Super Admin identity

**Decision**: Introduce platform role **`SUPER_ADMIN`** on the existing User model (extend
`UserRole`). Seed/manage Super Admin accounts under an internal platform Company. Super Admins:

- Authenticate via existing login JWT flow.
- **Bypass** Company subscription entitlement checks (so they can manage Expired/Suspended tenants).
- Alone may call `/api/v1/admin/...` subscription endpoints.

**Rationale**: Reuses JWT, sessions, password management, and DI without a second identity stack.
Admin routes use `authorize(['SUPER_ADMIN'])` (or dedicated middleware).

**Alternatives considered**:

- Separate PlatformAdmin table + API keys — more isolation; heavier for MVP.
- Env shared secret header — weak audit trail; rejected for production admin actions.
- Reuse OWNER of a magic company — conflates tenant Owner with platform ops; rejected.

## 3. Subscription period status vs Company status

**Decision**: Use **two enums**:

| Layer               | Enum values                                               |
| ------------------- | --------------------------------------------------------- |
| Company operational | `TRIAL`, `ACTIVE`, `GRACE_PERIOD`, `EXPIRED`, `SUSPENDED` |
| Subscription period | `PENDING`, `ACTIVE`, `EXPIRED`, `CANCELLED`               |

**Rationale**: Spec and plan input require both. Period status tracks commercial period lifecycle;
Company status is the access switch (includes Trial/Grace/Suspended which are not all period states).

**Mapping rules (MVP)**:

- Create/activate/renew with period `ACTIVE` → set Company to `ACTIVE` (or `TRIAL` / `GRACE_PERIOD`
  when admin explicitly chooses those company statuses on create/renew payloads where allowed).
- Expire action → period `ACTIVE`→`EXPIRED`, Company → `EXPIRED`.
- Suspend action → Company → `SUSPENDED` only; current period may remain `ACTIVE` so resume can
  restore Company to `ACTIVE` without fabricating a new period.
- Cancel action (if exposed) → period → `CANCELLED`; Company status updated per admin intent
  (typically `EXPIRED` if no other active entitlement).

## 4. Historical immutability vs period transitions

**Decision**: Period rows may transition **only** along allowed lifecycle edges while they are the
current commercial period (`PENDING`→`ACTIVE`→`EXPIRED|CANCELLED`). Once `EXPIRED` or `CANCELLED`,
the row is **immutable** (no field updates). Renew creates a **new** row; it may transition the
previous `ACTIVE` row to `EXPIRED` as part of the renew transaction (allowed transition, not a
rewrite of historical closed periods).

**Rationale**: Aligns with “history never deleted” while allowing Active→Expired on end-of-term.

## 5. Overlap and single Active period

**Decision**: Enforce in application (and DB exclusion constraints where practical):

1. No two periods for the same Company with overlapping `[startsAt, endsAt]` (inclusive), including
   Expired/Cancelled periods (history occupies the calendar).
2. At most one period with status `ACTIVE` per Company (partial unique index).

**Rationale**: Matches FR; prevents double billing windows and ambiguous entitlement.

## 6. Login check order

**Decision**: Extend login policy after existing user/company ACTIVE checks:

1. User exists
2. User account active
3. Password valid
4. Company exists and company account ACTIVE (existing `Company.status`)
5. If user role ≠ `SUPER_ADMIN`: Company `subscriptionStatus` ∈ {`TRIAL`,`ACTIVE`,`GRACE_PERIOD`}
6. Employee active when employee-linked rules already apply elsewhere (unchanged; keep existing
   workforce/login coupling)

**Rationale**: Spec order adapted to current codebase (`assertValidLoginUser` then password then
company). Subscription gate is a new step; Super Admin bypass is required for ops.

**Failure**: Dedicated conflict/forbidden error with stable code, e.g. `SUBSCRIPTION_INACTIVE`,
message suitable for clients (no internal details). Do not issue tokens.

## 7. Activity Log integration

**Decision**: Emit Activity Logs for create/renew/expire/suspend via existing
`emitStructuredAudit` / recorder bridge with actions such as `subscription.created`,
`subscription.renewed`, `subscription.expired`, `subscription.suspended`. Actor is Super Admin
`userId`; resource is Company / Subscription.

**Rationale**: P010 already provides the sink; no parallel audit store.

## 8. Default Company.subscriptionStatus

**Decision**: Default new Companies to **`TRIAL`** so onboarding works before first paid period;
Super Admin may create an `ACTIVE` subscription immediately and set Company to `ACTIVE`
(with account cascade to Company/Users `ACTIVE`).

**Rationale**: Spec assumes Trial as an allowed access state; avoids blocking brand-new tenants.

## 9. Account lifecycle cascade with Company/User ACTIVE↔INACTIVE

**Decision**: Synchronize existing `Company.status` and all tenant `User.status` with
subscription entitlement:

| `Company.subscriptionStatus`      | Cascade                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------- |
| `TRIAL`, `ACTIVE`, `GRACE_PERIOD` | Company → `ACTIVE`; all Company Users → `ACTIVE`                                                  |
| `EXPIRED`, `SUSPENDED`            | Company → `INACTIVE`; all Company Users → `INACTIVE`; revoke all refresh sessions for those users |

Runs inside create/renew/expire/suspend (and any admin transition that sets subscription status).

**Rationale**: Ops want a single commercial action to fully cut off or restore access, consistent
with existing disable-company behavior, while subscription status remains the entitlement reason.

**Alternatives considered**:

- Keep statuses independent (login checks both) — rejected; user requires cascade both ways.
- Only inactivate Company, leave Users ACTIVE — rejected; users would still fail company checks
  inconsistently and sessions might linger.
- Track per-user “was active before expire” — nicer restore semantics; deferred; MVP restores all.

**Note**: Restoring entitlement reactivates every Company user. Manually re-disable individuals
after restore if needed.

## 10. No Prisma in design docs

**Decision**: Data model describes fields, indexes, and constraints in prose/tables only (no
Prisma schema blocks in plan artifacts). Implementation tasks will add schema later.

**Rationale**: Explicit user constraint for this feature’s design docs.
