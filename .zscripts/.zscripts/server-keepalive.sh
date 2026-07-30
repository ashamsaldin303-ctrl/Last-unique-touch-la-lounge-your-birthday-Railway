#!/usr/bin/env bash
# Robust server keepalive — survives sandbox process cleanup by running
# in a new session (setsid) with all signals ignored.
cd /home/z/my-project
export PORT=3000
export DATABASE_URL="file:/home/z/my-project/prisma/db/app.db"
export NODE_ENV=production
export HOSTNAME=0.0.0.0

# Ignore signals that would kill the keepalive
trap '' SIGTERM SIGINT SIGHUP SIGQUIT SIGPIPE

while true; do
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting production server..." >&2
  # Use exec so bun replaces the shell (fewer processes)
  exec bun .next/standalone/server.js 2>&1
  # If exec fails or server exits, wait and restart
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Server exited (code=$?), restarting in 2s..." >&2
  sleep 2
done
