# Scrappy API

**Scrappy** is a modern junkshop management system for the Philippines. This repository contains the backend API — a production-ready foundation built with Clean Architecture, ready for future business feature specifications.

## Project Overview

Scrappy API provides a scalable, maintainable backend for junkshop operations including (in future specs) customers, inventory, buying, sales, and reports. This initial release includes only bootstrap infrastructure:

- `GET /` — application identity
- `GET /health` — health status with database connectivity check
- `GET /docs` — interactive OpenAPI documentation

No business features, authentication, or database models are implemented yet.

## Architecture

Clean Architecture with strict dependency direction (outer → inner):

```text
presentation  →  application  →  domain
      ↓               ↓
infrastructure ────────┘
      ↑
   shared (cross-cutting utilities)
```

| Layer              | Responsibility                                         |
| ------------------ | ------------------------------------------------------ |
| **domain**         | Entities, value objects, errors, repository interfaces |
| **application**    | Use cases, services, DTOs                              |
| **infrastructure** | Prisma, config, logging, DI container                  |
| **presentation**   | Controllers, routes, middleware, Swagger               |
| **shared**         | API envelope types, constants, utilities               |

Governance: see `.specify/memory/constitution.md`.

## Folder Structure

```text
src/
├── application/     # Use cases, services, DTOs
├── domain/          # Entities, value objects, errors, repository interfaces
├── infrastructure/  # Prisma, config, logger, DI providers
├── presentation/    # Controllers, routes, middleware, docs
├── shared/          # Constants, types, utilities
├── app.ts           # Express app factory
└── server.ts        # HTTP server bootstrap

prisma/              # Prisma schema (no models yet)
tests/               # Unit and integration tests
```

## Prerequisites

- Node.js 22.x LTS
- pnpm 9+
- PostgreSQL 16+ (local or Docker)
- Docker & Docker Compose (optional, for containerized dev)

## Setup

```bash
git clone <repository-url> scrappy-api
cd scrappy-api
pnpm install
cp .env.example .env
# Edit .env with your DATABASE_URL

pnpm prisma:generate
pnpm dev
```

API available at [http://localhost:3000](http://localhost:3000).  
Swagger UI at [http://localhost:3000/docs](http://localhost:3000/docs).

## Environment Variables

| Variable       | Required | Default       | Description                            |
| -------------- | -------- | ------------- | -------------------------------------- |
| `PORT`         | No       | `3000`        | HTTP server port                       |
| `DATABASE_URL` | Yes      | —             | PostgreSQL connection string           |
| `NODE_ENV`     | No       | `development` | `development`, `production`, or `test` |
| `LOG_LEVEL`    | No       | `info`        | Pino log level                         |

## Docker

Start the full stack (API + PostgreSQL):

```bash
docker compose up --build
```

Stop:

```bash
docker compose down
```

## Development Workflow

1. Create a feature branch from `main`
2. Make changes following Clean Architecture layer rules
3. Run `pnpm lint` and `pnpm test` before committing
4. Husky pre-commit runs lint-staged (ESLint + Prettier)
5. Open a PR — GitHub Actions runs lint, build, and tests

## Available Scripts

| Script                 | Description                               |
| ---------------------- | ----------------------------------------- |
| `pnpm dev`             | Start development server with hot reload  |
| `pnpm build`           | Compile TypeScript to `dist/`             |
| `pnpm start`           | Run compiled production build             |
| `pnpm lint`            | Run ESLint                                |
| `pnpm lint:fix`        | Run ESLint with auto-fix                  |
| `pnpm format`          | Format code with Prettier                 |
| `pnpm format:check`    | Check Prettier formatting                 |
| `pnpm test`            | Run Vitest test suite                     |
| `pnpm test:watch`      | Run Vitest in watch mode                  |
| `pnpm prisma:generate` | Generate Prisma client                    |
| `pnpm prisma:migrate`  | Run Prisma migrations (when models exist) |
| `pnpm prisma:studio`   | Open Prisma Studio                        |

## API Response Format

All endpoints use the standard envelope:

```json
{
  "success": true,
  "data": {},
  "meta": {},
  "error": null
}
```

## Future Roadmap

Each item will have its own Speckit specification:

- Authentication & authorization (JWT)
- Users & roles
- Customers
- Inventory & stock
- Buying & purchases
- Sales & transactions
- Suppliers
- Reports & dashboard
- Pricing, QR codes, barcodes
- Notifications & file uploads

## License

Proprietary — All rights reserved.
