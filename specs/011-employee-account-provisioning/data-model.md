# Data Model: Employee Account Provisioning

**Feature**: `011-employee-account-provisioning`  
**Date**: 2026-07-13

## Overview

No new tables. Extends usage of existing `Employee` and `User` models and their optional 1:1 link.

```text
Company 1──* Employee
Company 1──* User
Employee 0..1──0..1 User   (Employee.userId ↔ User.employeeId, both unique)
```

## Entities (existing, usage notes)

### Employee

| Field          | Type            | Notes                                     |
| -------------- | --------------- | ----------------------------------------- |
| id             | UUID            | PK                                        |
| companyId      | UUID            | From auth; never from client              |
| userId         | UUID?           | Unique; set on provision/grant            |
| employeeNumber | string?         | Unique per company                        |
| firstName      | string          | Required                                  |
| middleName     | string?         |                                           |
| lastName       | string          | Required                                  |
| suffix         | string?         |                                           |
| contactNumber  | string?         |                                           |
| weeklySalary   | decimal         | Required                                  |
| status         | ACTIVE/INACTIVE | Workforce lifecycle; independent of login |
| deletedAt      | datetime?       | Soft archive                              |

**Rules**

- May exist with `userId = null`.
- At most one User.
- Archive (`deletedAt` / INACTIVE) blocks **grant**; does not auto-disable User (explicit disable is separate; implementers SHOULD disable User when archiving if not already — optional follow-up, not required by this addendum).

### User

| Field        | Type                   | Notes                                              |
| ------------ | ---------------------- | -------------------------------------------------- |
| id           | UUID                   | PK                                                 |
| companyId    | UUID                   | From auth on provision                             |
| employeeId   | UUID?                  | Unique; required for Users created by this feature |
| email        | string                 | Globally unique                                    |
| passwordHash | string                 | bcrypt; never returned                             |
| role         | OWNER/MANAGER/EMPLOYEE | Assigned at provision                              |
| status       | ACTIVE/INACTIVE        | Login eligibility                                  |
| lastLoginAt  | datetime?              | Unchanged by disable/enable                        |
| deletedAt    | datetime?              | Soft delete; not used for disable                  |

**Rules**

- Email globally unique (DB unique constraint).
- Provisioned Users start `ACTIVE` and linked.
- Disable → `INACTIVE`; Enable → `ACTIVE`.
- Login requires `status === ACTIVE` and `deletedAt === null` (existing policy).

## State transitions

### System access state (User.status for linked accounts)

```text
[no User] --grant/createAccount--> ACTIVE --disable--> INACTIVE --enable--> ACTIVE
                                      |
                                      +-- (Employee remains ACTIVE unless archived separately)
```

| From     | Action                      | To       | Side effects                |
| -------- | --------------------------- | -------- | --------------------------- |
| (none)   | grant / create with account | ACTIVE   | Create User + link          |
| ACTIVE   | disable                     | INACTIVE | Revoke refresh sessions     |
| INACTIVE | enable                      | ACTIVE   | None                        |
| ACTIVE   | enable                      | —        | Conflict (already active)   |
| INACTIVE | disable                     | —        | Conflict (already inactive) |
| (none)   | disable/enable              | —        | Conflict (no linked user)   |

### Employee.status

Unaffected by disable/enable. Archive remains existing Employee archive flow.

## Validation rules (persistence-facing)

- `companyId` on both entities must equal acting user's company.
- Bidirectional link must be consistent after provision/grant.
- Cannot grant if `Employee.userId` set or `User` already references employee.
- Cannot create second User with same email.

## Indexes / constraints (existing)

- `User.email` UNIQUE
- `User.employeeId` UNIQUE
- `Employee.userId` UNIQUE
- `Employee (companyId, employeeNumber)` UNIQUE

No migration required unless repository helpers need transactional APIs only (code-level).

## DTO projections

### LinkedUserSummary

```text
id, email, role, status
```

Omit: `passwordHash`, `deletedAt` internals as needed by existing response style.
