#!/usr/bin/env bash
# Permanent watchdog — ensures the dev server is ALWAYS running.
# Survives session cleanup via setsid + nohup + signal traps.
# Restarts the server automatically if it dies (OOM, crash, etc.).
#
# Usage: .zscripts/watchdog.sh &
# Or:    nohup setsid .zscripts/watchdog.sh > /dev/null 2>&1 &

cd /home/z/my-project

# Critical: use absolute DB path so Prisma always finds it
export DATABASE_URL="file:/home/z/my-project/prisma/db/app.db"
export PORT=3000
# Limit memory to avoid OOM killer (sandbox has ~4GB)
export NODE_OPTIONS="--max-old-space-size=1024"

# Ignore all signals that would kill the watchdog itself
# (allows KILL -9 from OOM, which is unavoidable)
trap '' SIGTERM SIGINT SIGHUP SIGQUIT

LOG="/home/z/my-project/dev.log"
PIDFILE="/home/z/my-project/dev.pid"
MAX_RESTARTS=20
RESTART_COUNT=0
RESTART_WINDOW=60  # seconds — reset count after this
LAST_RESTART=0

ensure_prereqs() {
  # Ensure node_modules exists (sandbox may wipe it between sessions)
  if [ ! -d node_modules ]; then
    echo "[watchdog $(date '+%H:%M:%S')] node_modules missing — running bun install" >> "$LOG"
    bun install >> "$LOG" 2>&1
  fi
  # Ensure DB exists
  if [ ! -f prisma/db/app.db ]; then
    echo "[watchdog $(date '+%H:%M:%S')] DB missing — running db:push + db:seed" >> "$LOG"
    mkdir -p prisma/db
    bun run db:push >> "$LOG" 2>&1
    bun run db:seed >> "$LOG" 2>&1
  fi
}

while true; do
  ensure_prereqs

  # Check if port 3000 is already listening (avoid duplicate instances)
  if ss -tlnp 2>/dev/null | grep -q ':3000 '; then
    sleep 10
    continue
  fi

  # Rate-limit restarts to avoid crash loop
  NOW=$(date +%s)
  ELAPSED=$((NOW - LAST_RESTART))
  if [ $ELAPSED -lt $RESTART_WINDOW ]; then
    RESTART_COUNT=$((RESTART_COUNT + 1))
    if [ $RESTART_COUNT -ge $MAX_RESTARTS ]; then
      echo "[watchdog $(date '+%H:%M:%S')] too many restarts ($RESTART_COUNT in ${RESTART_WINDOW}s), backing off 60s" >> "$LOG"
      sleep 60
      RESTART_COUNT=0
    fi
  else
    RESTART_COUNT=0
  fi
  LAST_RESTART=$NOW

  echo "[watchdog $(date '+%H:%M:%S')] starting dev server (DATABASE_URL=$DATABASE_URL)" >> "$LOG"

  # Start dev server in background, detached from this session
  setsid bun run dev >> "$LOG" 2>&1 &
  SERVER_PID=$!
  echo $SERVER_PID > "$PIDFILE"

  # Wait for the server to either be ready or die
  READY=0
  for i in $(seq 1 30); do
    sleep 2
    if ss -tlnp 2>/dev/null | grep -q ':3000 '; then
      READY=1
      break
    fi
    # Check if process died
    if ! kill -0 $SERVER_PID 2>/dev/null; then
      echo "[watchdog $(date '+%H:%M:%S')] server process died during startup (attempt $i)" >> "$LOG"
      break
    fi
  done

  if [ $READY -eq 1 ]; then
    echo "[watchdog $(date '+%H:%M:%S')] server ready (PID $SERVER_PID)" >> "$LOG"
    # Wait for the server process to exit (it will when killed/OOM)
    wait $SERVER_PID 2>/dev/null
    echo "[watchdog $(date '+%H:%M:%S')] server exited, will restart in 5s" >> "$LOG"
  else
    echo "[watchdog $(date '+%H:%M:%S')] server failed to start, retrying in 10s" >> "$LOG"
  fi

  sleep 5
done
