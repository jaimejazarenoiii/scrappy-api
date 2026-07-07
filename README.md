# Scrappy API

**Scrappy** is a multi-tenant junkshop and recycling operations API. The backend includes the Company & Identity Foundation (P001) and Organization Management (P002) for branches, warehouses, and vehicles.

## Current API Surface

The repository currently exposes:

- `GET /` - application identity
- `GET /health` - health status
- `GET /docs` - Swagger UI
- `POST /api/v1/companies` - create a Company with its initial Owner
- `GET|PATCH|POST /api/v1/companies/:companyId[/archive]` - Company read, update, and archive flows
- `POST /api/v1/auth/login|logout|refresh|forgot-password` - authentication lifecycle
- `GET /api/v1/users/me` - current authenticated user
- `POST|GET|PATCH /api/v1/employees...` - employee create, view, update, archive, and user-link flows
- `POST|GET|PATCH /api/v1/branches...` - branch create, list, view, update, and archive (Owner/Manager write; Employee read)
- `POST|GET|PATCH /api/v1/warehouses...` - warehouse create, list, view, update, and archive
- `POST|GET|PATCH /api/v1/vehicles...` - vehicle create, list, view, update, and archive

## Architecture

The codebase uses modular Clean Architecture with feature modules under `src/modules/` and shared cross-cutting services under `src/shared/`, `src/middleware/`, `src/config/`, and `src/database/`.

## Setup

```bash
pnpm install
cp .env.example .env
pnpm prisma:generate
pnpm dev
```

## Environment Variables

| Variable                 | Required | Default            | Description                     |
| ------------------------ | -------- | ------------------ | ------------------------------- |
| `PORT`                   | No       | `3000`             | HTTP server port                |
| `DATABASE_URL`           | Yes      | -                  | PostgreSQL connection string    |
| `NODE_ENV`               | No       | `development`      | Runtime environment             |
| `LOG_LEVEL`              | No       | `info`             | Pino log level                  |
| `JWT_ACCESS_SECRET`      | Yes      | local dev fallback | Access-token signing secret     |
| `JWT_REFRESH_SECRET`     | Yes      | local dev fallback | Refresh-token signing secret    |
| `JWT_ACCESS_EXPIRES_IN`  | No       | `15m`              | Access-token TTL                |
| `JWT_REFRESH_EXPIRES_IN` | No       | `7d`               | Refresh-token TTL               |
| `BCRYPT_ROUNDS`          | No       | `10`               | Password hashing cost           |
| `CORS_ORIGIN`            | No       | `*`                | Comma-separated allowed origins |
| `RATE_LIMIT_WINDOW_MS`   | No       | `60000`            | Rate-limit window               |
| `RATE_LIMIT_MAX`         | No       | `100`              | Rate-limit request ceiling      |

## Validation

```bash
pnpm build
pnpm test
pnpm lint
```

The suite covers bootstrap routes, Company creation, authentication, protected identity access, employee lifecycle flows, and organization resource management (branches, warehouses, vehicles).
