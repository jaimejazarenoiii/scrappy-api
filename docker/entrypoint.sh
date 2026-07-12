#!/bin/sh
set -e

if [ -z "${DATABASE_URL}" ]; then
  echo "ERROR: DATABASE_URL is not set."
  echo "On Railway: set DATABASE_URL from the Postgres plugin (e.g. \${{Postgres.DATABASE_URL}})."
  exit 1
fi

case "${DATABASE_URL}" in
  *@localhost:*|*@127.0.0.1:*|*@localhost/*|*@127.0.0.1/*)
    echo "ERROR: DATABASE_URL points to localhost — invalid on Railway/cloud."
    exit 1
    ;;
esac

echo "Applying database migrations..."
pnpm exec prisma migrate deploy

echo "Starting Scrappy API..."
exec node dist/server.js
