# Data Model: Company & Identity Foundation

**Feature**: `002-company-identity-foundation`  
**Date**: 2026-07-07

## Overview

This feature introduces the foundational tenant and identity models used by all future Scrappy
modules.

## Entities

### Company

Represents one tenant business operating on Scrappy.

| Field           | Type       | Required | Notes                                            |
| --------------- | ---------- | -------- | ------------------------------------------------ |
| id              | identifier | Yes      | Primary business/technical identifier            |
| code            | string     | Yes      | Stable business-readable company code if adopted |
| name            | string     | Yes      | Primary company name                             |
| displayName     | string     | Yes      | Customer-facing display name                     |
| status          | enum       | Yes      | `ACTIVE` or `ARCHIVED`                           |
| archivedAt      | datetime   | No       | Set when archived                                |
| createdAt       | datetime   | Yes      | Audit field                                      |
| updatedAt       | datetime   | Yes      | Audit field                                      |
| createdByUserId | identifier | No       | Optional audit link                              |
| updatedByUserId | identifier | No       | Optional audit link                              |

**Relationships**:

- One Company has many Users
- One Company has many Employees
- One Company will have many Branches, Warehouses, Vehicles, Transactions, Trips, Expenses,
  Attendance, Payroll, and Reports in future modules

**Constraints**:

- Company is the mandatory owner of every future protected business record
- Company archive is soft delete only
- Company name/code uniqueness should be enforced according to final business policy

---

### User

Represents an authenticated identity operating inside one Company.

| Field           | Type       | Required | Notes                                           |
| --------------- | ---------- | -------- | ----------------------------------------------- |
| id              | identifier | Yes      | Primary identity identifier                     |
| companyId       | identifier | Yes      | Mandatory tenant boundary                       |
| email           | string     | Yes      | Login identifier; unique within business policy |
| passwordHash    | string     | Yes      | Stored hash only                                |
| role            | enum       | Yes      | `OWNER`, `MANAGER`, `EMPLOYEE`                  |
| status          | enum       | Yes      | `ACTIVE`, `DISABLED`, `ARCHIVED`                |
| lastLoginAt     | datetime   | No       | Audit/ops field                                 |
| archivedAt      | datetime   | No       | Set when archived                               |
| createdAt       | datetime   | Yes      | Audit field                                     |
| updatedAt       | datetime   | Yes      | Audit field                                     |
| createdByUserId | identifier | No       | Audit link                                      |
| updatedByUserId | identifier | No       | Audit link                                      |

**Relationships**:

- Many Users belong to one Company
- One User may link to zero or one Employee
- One User may create/update many Company or Employee records via audit links
- One User may own many refresh sessions/tokens

**Constraints**:

- User belongs to exactly one Company in this foundation
- Owner is created together with Company
- Cross-company user access is invalid

---

### Employee

Represents a workforce identity inside one Company.

| Field           | Type       | Required | Notes                            |
| --------------- | ---------- | -------- | -------------------------------- |
| id              | identifier | Yes      | Primary employee identifier      |
| companyId       | identifier | Yes      | Mandatory tenant boundary        |
| employeeCode    | string     | No       | Business-specific internal code  |
| firstName       | string     | Yes      | Required profile field           |
| middleName      | string     | No       | Optional                         |
| lastName        | string     | Yes      | Required profile field           |
| displayName     | string     | No       | Derived or explicitly stored     |
| role            | enum       | Yes      | Foundational role responsibility |
| status          | enum       | Yes      | `ACTIVE` or `ARCHIVED`           |
| userId          | identifier | No       | Optional same-company user link  |
| archivedAt      | datetime   | No       | Set when archived                |
| createdAt       | datetime   | Yes      | Audit field                      |
| updatedAt       | datetime   | Yes      | Audit field                      |
| createdByUserId | identifier | No       | Audit link                       |
| updatedByUserId | identifier | No       | Audit link                       |

**Relationships**:

- Many Employees belong to one Company
- One Employee may link to zero or one User
- One User may link to zero or one Employee

**Constraints**:

- Employee-to-User link must be same-company only
- Employee may exist without a User account
- Archived Employee remains historically referenceable

---

### Refresh Session

Represents one refresh-capable authenticated session.

| Field               | Type       | Required | Notes                     |
| ------------------- | ---------- | -------- | ------------------------- |
| id                  | identifier | Yes      | Session identifier        |
| companyId           | identifier | Yes      | Tenant context            |
| userId              | identifier | Yes      | Owning user               |
| tokenHash           | string     | Yes      | Stored refresh token hash |
| issuedAt            | datetime   | Yes      | Lifecycle audit           |
| expiresAt           | datetime   | Yes      | Refresh expiry            |
| revokedAt           | datetime   | No       | Logout / invalidation     |
| replacedBySessionId | identifier | No       | Rotation chain support    |
| ipAddress           | string     | No       | Optional audit field      |
| userAgent           | string     | No       | Optional audit field      |
| createdAt           | datetime   | Yes      | Audit field               |
| updatedAt           | datetime   | Yes      | Audit field               |

**Relationships**:

- Many Refresh Sessions belong to one User
- Many Refresh Sessions belong to one Company

**Constraints**:

- Refresh session must remain bound to the same Company as the User
- Revoked or expired sessions cannot refresh authentication

## Enumerations

### CompanyStatus

- `ACTIVE`
- `ARCHIVED`

### UserRole

- `OWNER`
- `MANAGER`
- `EMPLOYEE`

### UserStatus

- `ACTIVE`
- `DISABLED`
- `ARCHIVED`

### EmployeeStatus

- `ACTIVE`
- `ARCHIVED`

## Relationship Summary

- Company `1 -> many` Users
- Company `1 -> many` Employees
- User `1 -> 0..1` Employee
- User `1 -> many` Refresh Sessions
- Company `1 -> many` Refresh Sessions

## State Transitions

### Company

- `ACTIVE -> ARCHIVED`
- Archived Company cannot be treated as active without an explicit restore policy in a future spec

### User

- `ACTIVE -> DISABLED`
- `ACTIVE -> ARCHIVED`
- `DISABLED -> ACTIVE` (if future business policy allows)

### Employee

- `ACTIVE -> ARCHIVED`

### Refresh Session

- `ACTIVE -> REVOKED`
- `ACTIVE -> EXPIRED`
- `ACTIVE -> REPLACED`

## Validation Rules Derived from Spec

- Company create requires company identity fields and Owner onboarding fields
- User login requires valid identifier and password
- Employee create requires same-company administrative context
- Employee link-to-user requires same-company relationship and valid lifecycle states
- Protected resources require authenticated same-company access

## Future Extensibility

This model supports future modules without redefining the tenant boundary:

- Branches, Warehouses, Vehicles, Transactions, Trips, Expenses, Attendance, Payroll, and Reports
  can all attach to `companyId`
- Role and policy enforcement can expand without changing Company ownership semantics
- Workforce modules can extend Employee with profiles, assignments, payroll, and attendance
- Organization modules can extend Company with branches and operational hierarchies
