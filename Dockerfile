# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# --- Dependencies ---
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# --- Build (generate Prisma client + compile TypeScript) ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml tsconfig.json tsconfig.build.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src
# prisma.config.ts requires DATABASE_URL; no live DB needed for generate
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public"
RUN pnpm exec prisma generate && pnpm exec tsc -p tsconfig.build.json

# --- Runtime ---
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000

COPY package.json pnpm-lock.yaml prisma.config.ts ./
COPY prisma ./prisma
COPY scripts ./scripts
COPY --from=builder /app/dist ./dist
# Use builder node_modules so generated Prisma client (+ tsx) is included
COPY --from=builder /app/node_modules ./node_modules
COPY docker/entrypoint.sh ./docker/entrypoint.sh

RUN chmod +x ./docker/entrypoint.sh \
  && addgroup -S scrappy \
  && adduser -S scrappy -G scrappy \
  && mkdir -p /app/uploads \
  && chown -R scrappy:scrappy /app

USER scrappy

EXPOSE 3000

# migrate deploy (needs prisma CLI) then start — no prisma generate at runtime
ENTRYPOINT ["./docker/entrypoint.sh"]
