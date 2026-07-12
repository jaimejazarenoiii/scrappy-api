#!/bin/sh
set -e

echo "Applying database migrations..."
pnpm exec prisma migrate deploy

echo "Starting Scrappy API..."
exec node dist/server.js
