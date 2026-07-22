#!/usr/bin/env bash
cd /home/z/my-project
export PORT=3000
export DATABASE_URL="file:/home/z/my-project/prisma/db/app.db"
export NODE_ENV=production
trap '' SIGTERM SIGINT SIGHUP SIGQUIT
while true; do
  bun .next/standalone/server.js 2>&1
  sleep 1
done
