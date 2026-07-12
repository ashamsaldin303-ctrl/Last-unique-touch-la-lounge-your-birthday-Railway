#!/usr/bin/env bash
# Robust dev server keepalive.
# - setsid: new session, detached from controlling terminal
# - trap: ignore TERM/HUP (but allow KILL from OOM)
# - loop: restart on exit
# The OOM killer may kill next-server (and its parent bun), but this
# keepalive script runs in its own session and survives.
cd /home/z/my-project
export PORT=3000
export DATABASE_URL="file:/home/z/my-project/prisma/db/app.db"
export NODE_OPTIONS="--max-old-space-size=1024"

# Ignore signals that would kill the keepalive itself
trap '' SIGTERM SIGINT SIGHUP SIGQUIT

while true; do
  echo "[keepalive $(date '+%H:%M:%S')] starting bun run dev" >&2
  bun run dev 2>&1
  EXIT=$?
  echo "[keepalive $(date '+%H:%M:%S')] bun run dev exited (code=$EXIT), restarting in 5s" >&2
  sleep 5
done
