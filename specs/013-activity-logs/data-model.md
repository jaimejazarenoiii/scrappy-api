# Data Model: Activity Logs

**Feature**: `013-activity-logs`  
**Date**: 2026-07-13

## Overview

New append-only **ActivityLog** entity. No updates/deletes in application flows. Logical
references to actors and resources.

```text
Company 1──* ActivityLog
User     1──* ActivityLog (actor, logical)
Employee 0──* ActivityLog (optional actor profile, logical)
Resource     (logical resourceType + resourceId [+ resourceNumber])
```

## ActivityLog

| Field          | Type        | Required | Notes                                                                                  |
| -------------- | ----------- | -------- | -------------------------------------------------------------------------------------- |
| id             | UUID        | yes      | PK                                                                                     |
| companyId      | UUID        | yes      | Tenant                                                                                 |
| eventType      | string/enum | yes      | AUTHENTICATION, COMPANY, EMPLOYEE, ORGANIZATION, TRANSACTION, TRIP, EXPENSE, WORKFORCE |
| module         | string/enum | yes      | auth, employee, transaction, …                                                         |
| action         | string      | yes      | e.g. `transaction.paid`                                                                |
| description    | string      | yes      | Human-readable; no secrets                                                             |
| userId         | UUID        | yes      | Actor                                                                                  |
| employeeId     | UUID        | no       | Actor employee link                                                                    |
| resourceType   | string      | no       | employee, transaction, trip, expense, vehicle, branch, warehouse, company, user        |
| resourceId     | UUID        | no       |                                                                                        |
| resourceNumber | string      | no       | Denormalized search aid                                                                |
| ipAddress      | string      | no       |                                                                                        |
| userAgent      | string      | no       |                                                                                        |
| metadata       | JSON object | no       | Additional details                                                                     |
| createdAt      | datetime    | yes      | Append timestamp                                                                       |

### Intentionally absent

- `updatedAt`, `deletedAt`, status, editable flags

## Relationships

| From        | To          | Cardinality | Ownership                |
| ----------- | ----------- | ----------- | ------------------------ |
| Company     | ActivityLog | 1:N         | Tenant scope             |
| User        | ActivityLog | 1:N         | Actor reference only     |
| Employee    | ActivityLog | 1:N         | Optional actor reference |
| ActivityLog | Resource    | N:0..1      | Logical; not owned       |

## Validation (persistence-facing)

- Required fields always set on append
- `metadata` must not contain keys like `password`, `temporaryPassword`, `passwordHash`
- `companyId` always from authenticated producer context

## Indexes (design)

- `(companyId, createdAt DESC)`
- `(companyId, module, createdAt DESC)`
- `(companyId, action, createdAt DESC)`
- `(companyId, userId, createdAt DESC)`
- `(companyId, eventType, createdAt DESC)`
- `(companyId, resourceType, resourceId)`
- `(companyId, resourceNumber)`

## State transitions

None — append-only. Rows are never transitioned.

## Retention

v1 retain all rows. Future archive/purge by `createdAt` without changing write model.

## Mapping from recorder input

| Recorder input         | Column                 |
| ---------------------- | ---------------------- |
| companyId              | companyId              |
| eventType              | eventType              |
| module                 | module                 |
| action                 | action                 |
| description            | description            |
| actorUserId            | userId                 |
| actorEmployeeId        | employeeId             |
| resource.*             | resourceType/Id/Number |
| request.ip / userAgent | ipAddress / userAgent  |
| metadata               | metadata               |
| (server)               | createdAt, id          |
