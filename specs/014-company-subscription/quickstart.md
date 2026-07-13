# Quickstart: P011 - Company Subscription Management

**Feature**: `014-company-subscription`  
**Date**: 2026-07-13

Validate after `/speckit-implement`. Contracts: [contracts/openapi.yaml](./contracts/openapi.yaml).
Data model: [data-model.md](./data-model.md).

## Prerequisites

- Migrations applied (Company.subscriptionStatus + CompanySubscription)
- Seeded Super Admin (`SUPER_ADMIN`) and at least one tenant Company with Owner
- API running locally

## Scenario A — Create + login allowed

1. Login as Super Admin.
2. `POST /api/v1/admin/companies/{companyId}/subscriptions` with Active period and dates.
3. Expect `201`; Company subscription status `ACTIVE` (or chosen Trial/Grace).
4. Login as Company Owner → `200` tokens issued.

## Scenario B — Expire blocks login and inactivates accounts

1. As Super Admin, `POST .../subscriptions/expire`.
2. Company subscription status → `EXPIRED`.
3. Company account status → `INACTIVE`; all Users → `INACTIVE`; sessions revoked.
4. Owner login → denied; no tokens.
5. History still lists prior periods.

## Scenario C — Suspend blocks login; restore reactivates accounts

1. With Active Company, `POST .../subscriptions/suspend` → subscription `SUSPENDED`.
2. Company + Users → `INACTIVE`; Owner login denied.
3. Super Admin renews (or creates) into allowed status → Company + Users → `ACTIVE`.
4. Owner login succeeds again.

## Scenario D — Overlap + dual Active rejected

1. Create period Jan–Mar Active.
2. Attempt overlapping Apr start that overlaps Mar → `400`.
3. Attempt second Active while one Active exists → `400`.

## Scenario E — Authorization

1. Owner/Manager/Employee call any `/admin/companies/.../subscriptions*` → `403`.
2. Super Admin succeeds.
3. Owner `GET /api/v1/companies/me/subscription-status` → `200` read-only.

## Scenario F — Super Admin bypass

1. Put a Company in `EXPIRED`.
2. Super Admin still logs in and can manage that Company.

## Suggested tests (post-implement)

```bash
pnpm test -- tests/api/subscription tests/unit/subscription tests/api/auth
```

## Done when

- Scenarios A–F pass
- OpenAPI + `docs/api-reference.md` document admin subscription APIs and login behavior
- Activity Logs record subscription admin actions
