# Quickstart: Initial Project Setup

**Feature**: `001-initial-project-setup`  
**Purpose**: Validate the bootstrap implementation end-to-end after `/speckit-implement` completes.

See also: [spec.md](./spec.md) | [plan.md](./plan.md) | [contracts/openapi.yaml](./contracts/openapi.yaml)

---

## Prerequisites

- Node.js 22.x LTS
- pnpm 9+
- Docker & Docker Compose (for containerized validation)
- Git

---

## 1. Local Setup (without Docker)

```bash
# Clone and install
git clone <repository-url> scrappy-api && cd scrappy-api
pnpm install

# Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL to a local PostgreSQL instance

# Generate Prisma client (no migrations yet)
pnpm prisma:generate

# Build and verify
pnpm lint
pnpm build
pnpm test
```

**Start PostgreSQL** locally (or skip DB for root-only test; health requires DB).

```bash
pnpm dev
```

**Expected**: Server listens on `PORT` (default `3000`).

---

## 2. Endpoint Validation

### Root — `GET /`

```bash
curl -s http://localhost:3000/ | jq
```

**Expected (200)**:

```json
{
  "success": true,
  "data": {
    "name": "Scrappy API",
    "version": "1.0.0",
    "status": "running"
  },
  "meta": {},
  "error": null
}
```

### Health — `GET /health`

```bash
curl -s -w "\nHTTP %{http_code}\n" http://localhost:3000/health | jq
```

**Expected (200 when DB up)**:

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "checks": { "database": "up" }
  },
  "meta": {},
  "error": null
}
```

**Expected (503 when DB down)**: `data.status` is `unhealthy`, `checks.database` is `down`.

### Swagger — `GET /docs`

Open [http://localhost:3000/docs](http://localhost:3000/docs) in a browser.

**Expected**: Interactive docs listing only `GET /` and `GET /health`.

### Not Found — `GET /unknown`

```bash
curl -s http://localhost:3000/unknown | jq
```

**Expected (404)**:

```json
{
  "success": false,
  "data": null,
  "meta": {},
  "error": {
    "code": "NOT_FOUND",
    "message": "Route not found"
  }
}
```

---

## 3. Docker Validation

```bash
docker compose up --build
```

**Expected**:

- `postgres` container healthy
- `api` container running
- Same curl responses against `http://localhost:3000`

```bash
docker compose down
```

---

## 4. Quality Gates

```bash
pnpm lint          # ESLint — must pass
pnpm format:check  # Prettier — must pass (if script added)
pnpm build         # TypeScript compile — must pass
pnpm test          # Vitest — root + health tests pass
```

---

## 5. CI Validation

Push a branch and open a PR. GitHub Actions workflow must:

1. Install dependencies (`pnpm install --frozen-lockfile`)
2. Run lint
3. Run build
4. Run tests

All stages green before merge.

---

## 6. Acceptance Checklist

- [ ] `pnpm build` succeeds
- [ ] `pnpm dev` starts without errors (valid `.env`)
- [ ] `GET /` returns API identity in standard envelope
- [ ] `GET /health` returns healthy when PostgreSQL is reachable
- [ ] `GET /docs` serves Swagger UI
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes
- [ ] `docker compose up` starts api + postgres
- [ ] `pnpm prisma:generate` succeeds (no models required)
- [ ] No business endpoints exist beyond `/` and `/health`
- [ ] Folder structure matches Clean Architecture layout in [plan.md](./plan.md)

---

## Troubleshooting

| Symptom                   | Likely cause                                   | Action                                                          |
| ------------------------- | ---------------------------------------------- | --------------------------------------------------------------- |
| Startup crash immediately | Missing/invalid env vars                       | Check Zod validation error message; compare with `.env.example` |
| Health returns 503        | PostgreSQL not running or wrong `DATABASE_URL` | Start DB; verify connection string                              |
| Prisma generate fails     | Schema syntax or missing `DATABASE_URL`        | Fix `prisma/schema.prisma`; set env                             |
| Lint fails on commit      | Husky/lint-staged                              | Run `pnpm lint:fix` and `pnpm format`                           |
