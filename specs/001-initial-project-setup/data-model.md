# Data Model: Initial Project Setup

**Feature**: `001-initial-project-setup`  
**Date**: 2026-07-06

## Overview

This feature introduces **no persistent business entities**. The database layer is scaffolded only:
Prisma is configured, PostgreSQL connection is validated, and no models or migrations are created.

Runtime-only value objects support bootstrap endpoints.

---

## Runtime Value Objects (Non-Persisted)

### ServiceIdentity

Represents the API identity returned by `GET /`.

| Field   | Type   | Source                   | Notes                                   |
| ------- | ------ | ------------------------ | --------------------------------------- |
| name    | string | constant (`Scrappy API`) | Display name                            |
| version | string | `package.json` version   | Semver                                  |
| status  | string | runtime                  | Always `running` when endpoint responds |

**Validation**: None required (no request body). Response wrapped in standard API envelope.

---

### HealthStatus

Represents operational health returned by `GET /health`.

| Field  | Type              | Source                 | Notes                                                    |
| ------ | ----------------- | ---------------------- | -------------------------------------------------------- |
| status | enum              | health check aggregate | `healthy` \| `unhealthy`                                 |
| checks | object (optional) | infrastructure probes  | e.g. `{ database: "up" \| "down" }` for future expansion |

**State transitions**:

```text
[startup] → probe database
  ├── DB reachable  → status: healthy
  └── DB unreachable → status: unhealthy (HTTP 503)
```

**Validation**: None required (no request parameters for bootstrap).

---

## Database Schema

**Status**: Empty — `prisma/schema.prisma` contains generator and datasource only.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

No `model` blocks. No migration files until a future business feature spec.

---

## Repository Interfaces (Pattern Placeholder)

No repository interfaces are implemented in this feature. Directory placeholders:

- `src/domain/repositories/` — `.gitkeep` or README noting future interfaces live here
- `src/infrastructure/database/repositories/` — empty until first entity spec

**Pattern rule** (from constitution FR-014): When entities arrive in future specs, interfaces
are defined in `domain/repositories/` and implementations in
`infrastructure/database/repositories/`.

---

## DTOs (Presentation Layer)

### RootResponseDto

| Field   | Type   |
| ------- | ------ |
| name    | string |
| version | string |
| status  | string |

### HealthResponseDto

| Field  | Type                                |
| ------ | ----------------------------------- |
| status | `healthy` \| `unhealthy`            |
| checks | `Record<string, string>` (optional) |

DTOs live in `src/application/dtos/`; mappers convert use case output → response envelope in
controllers.

---

## Relationships

None — no persisted entities in this feature.
