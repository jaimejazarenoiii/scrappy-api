# Data Model: Password Management

**Feature**: `012-password-management`  
**Date**: 2026-07-13

## Overview

Extend existing `User` only. No new tables. Employee unchanged.

```text
User
  ├── passwordHash (existing)
  ├── passwordChangeRequired (new, boolean, default false)
  └── passwordChangedAt (new, datetime?, default null)
```

## User field additions

| Field                  | Type     | Default | Nullable | Notes                                      |
| ---------------------- | -------- | ------- | -------- | ------------------------------------------ |
| passwordChangeRequired | Boolean  | false   | no       | Forced change after admin reset            |
| passwordChangedAt      | DateTime | —       | yes      | Last credential mutation (change or reset) |

Existing fields (`id`, `companyId`, `employeeId`, `email`, `passwordHash`, `role`, `status`,
`lastLoginAt`, soft-delete) unchanged in meaning.

## State transitions

```text
passwordChangeRequired:
  false --admin reset--> true --successful change password--> false
```

| Event            | passwordHash | passwordChangeRequired | passwordChangedAt                                                         |
| ---------------- | ------------ | ---------------------- | ------------------------------------------------------------------------- |
| Admin reset      | updated      | `true`                 | set to now                                                                |
| Change password  | updated      | `false`                | set to now                                                                |
| Login            | unchanged    | unchanged              | unchanged                                                                 |
| Provision create | set          | `false`                | null or now (prefer null until first change; provisioning may leave null) |

**Provisioning note**: New Users from company create / account provisioning keep
`passwordChangeRequired=false` unless product later chooses to force first login change (out of
scope).

## Relationships

- Admin reset: `Employee (company-scoped) → userId → User`
- Change/status: `auth.userId → User`
- No Employee column updates

## Validation (persistence-facing)

- `passwordHash` never exposed in API responses
- Email uniqueness and company scoping unchanged
- Inactive Users should not receive admin reset (`409`)

## Migration note (implement phase)

Add columns with defaults so existing rows remain valid:

- `password_change_required BOOLEAN NOT NULL DEFAULT false`
- `password_changed_at TIMESTAMPTZ NULL`

(Exact SQL/Prisma syntax belongs in implementation tasks, not this design doc’s narrative schema dump.)
