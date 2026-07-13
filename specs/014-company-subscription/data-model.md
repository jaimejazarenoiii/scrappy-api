# Data Model: P011 - Company Subscription Management

**Feature**: `014-company-subscription`  
**Date**: 2026-07-13

## Overview

```text
Company 1──* CompanySubscription
User (SUPER_ADMIN) ──creates──> CompanySubscription (createdBy logical)
```

- **Company.subscriptionStatus** = operational access gate (auth).
- **CompanySubscription** = historical/commercial periods (support, renewals, audit).

Login reads **Company.subscriptionStatus only** — never scans history.

## Company (extension)

| Field              | Type | Required | Notes                                                             |
| ------------------ | ---- | -------- | ----------------------------------------------------------------- |
| subscriptionStatus | enum | yes      | `TRIAL` \| `ACTIVE` \| `GRACE_PERIOD` \| `EXPIRED` \| `SUSPENDED` |

### Purpose

Fast entitlement check during authentication and support visibility.

### Default

`TRIAL` for newly created Companies (unless Super Admin overrides via subscription flows).

### Business rules

- Kept in sync with entitlement via cascade (see below); not an independent parallel policy.
- Allowed subscription (`TRIAL` / `ACTIVE` / `GRACE_PERIOD`) ⇒ Company account `ACTIVE` + all Users `ACTIVE`.
- Blocked subscription (`EXPIRED` / `SUSPENDED`) ⇒ Company account `INACTIVE` + all Users `INACTIVE` + sessions revoked.
- Only Super Admin subscription use cases may change `subscriptionStatus` (except future
  automation writing through the same application services).

### Account lifecycle cascade

| subscriptionStatus          | Company.status | User.status (all company users) | Sessions |
| --------------------------- | -------------- | ------------------------------- | -------- |
| TRIAL, ACTIVE, GRACE_PERIOD | ACTIVE         | ACTIVE                          | —        |
| EXPIRED, SUSPENDED          | INACTIVE       | INACTIVE                        | revoked  |

### Indexes

- `(subscriptionStatus)` optional for ops reporting.
- Existing PK/unique on Company unchanged.

### Future extensibility

Add fields later (e.g. `graceEndsAt`, `billingCustomerId`) without changing the status enum
semantics or history table.

---

## CompanySubscription

| Field     | Type     | Required | Notes                                              |
| --------- | -------- | -------- | -------------------------------------------------- |
| id        | UUID     | yes      | PK                                                 |
| companyId | UUID     | yes      | Owning Company                                     |
| planName  | string   | yes      | Display/commercial label (not a catalog FK in MVP) |
| startsAt  | datetime | yes      | Period start (inclusive)                           |
| endsAt    | datetime | yes      | Period end (inclusive)                             |
| status    | enum     | yes      | `PENDING` \| `ACTIVE` \| `EXPIRED` \| `CANCELLED`  |
| notes     | string   | no       | Free-text ops notes                                |
| createdBy | UUID     | yes      | Super Admin user id (logical)                      |
| createdAt | datetime | yes      |                                                    |
| updatedAt | datetime | yes      | Updated only on allowed period transitions         |

### Purpose

One row per subscription period in Company history.

### Relationships

| From    | To                            | Cardinality | Notes                                                                                        |
| ------- | ----------------------------- | ----------- | -------------------------------------------------------------------------------------------- |
| Company | CompanySubscription           | 1:N         | Historical ownership; restrict delete of Company if subscriptions exist or soft-archive only |
| User    | CompanySubscription.createdBy | 1:N logical | No cascade                                                                                   |

### Indexes / constraints (design)

- `(companyId, startsAt DESC)` — history listing
- `(companyId, status)` — find current ACTIVE
- **Partial unique**: at most one row per `companyId` where `status = ACTIVE`
- **Exclusion / application overlap**: no overlapping `[startsAt, endsAt]` per `companyId`
- Check: `startsAt <= endsAt`

### Unique rules

- `id` globally unique.
- No second ACTIVE period for same Company.

### Audit strategy

- `createdBy` + Activity Log events on create/renew/expire/suspend.
- Closed periods (`EXPIRED`/`CANCELLED`) immutable in application layer.

### Future extensibility

Later add `planId`, `amount`, `currency`, `externalInvoiceId`, `autoRenew` without splitting
history from Company status.

---

## Enums

### CompanySubscriptionStatus (Company)

`TRIAL` | `ACTIVE` | `GRACE_PERIOD` | `EXPIRED` | `SUSPENDED`

### SubscriptionPeriodStatus (CompanySubscription)

`PENDING` | `ACTIVE` | `EXPIRED` | `CANCELLED`

### UserRole extension

Add `SUPER_ADMIN` alongside `OWNER` | `MANAGER` | `EMPLOYEE`.

---

## State transitions

### Subscription period

```text
PENDING → ACTIVE → EXPIRED
                ↘ CANCELLED
PENDING → CANCELLED
```

Invalid: EXPIRED→*, CANCELLED→*, ACTIVE→PENDING, skip ACTIVE without PENDING if create starts ACTIVE (allowed: create directly as ACTIVE).

### Company operational status (admin-driven MVP)

```text
TRIAL ↔ ACTIVE ↔ GRACE_PERIOD
              ↘ EXPIRED
              ↘ SUSPENDED
EXPIRED → ACTIVE|TRIAL|GRACE_PERIOD (via renew/create)
SUSPENDED → ACTIVE|TRIAL|GRACE_PERIOD (resume) or EXPIRED
```

---

## Validation summary

- planName: required, trimmed, max length (e.g. 120)
- notes: optional, max length (e.g. 2000)
- startsAt ≤ endsAt
- no overlap with existing periods for company
- ≤1 ACTIVE period
- only SUPER_ADMIN mutates
