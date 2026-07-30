#!/usr/bin/env bash
# Fast dev server startup — fixes .env + ensures DB + starts server.
# This is the most reliable approach given sandbox constraints.
cd /home/z/my-project

# Fix .env to correct DB path (sandbox overwrites it with wrong path)
if ! grep -q 'prisma/db/app.db' .env 2>/dev/null; then
  echo 'DATABASE_URL="file:./db/app.db"' > .env
  echo "[start-dev] fixed .env DATABASE_URL" >&2
fi

# Ensure node_modules
if [ ! -d node_modules ]; then
  echo "[start-dev] installing node_modules..." >&2
  bun install > /dev/null 2>&1
fi

# Ensure DB
if [ ! -f prisma/db/app.db ]; then
  echo "[start-dev] creating DB..." >&2
  mkdir -p prisma/db
  bun run db:push > /dev/null 2>&1
  bun run db:seed > /dev/null 2>&1
fi

export DATABASE_URL="file:./db/app.db"
export PORT=3000
export NODE_OPTIONS="--max-old-space-size=1024"

# Start server
exec bun run dev
