#!/usr/bin/env bash
# Watchdog: restart the production server if it's not running.
cd /home/z/my-project
if ! pgrep -f "server.js" > /dev/null 2>&1; then
  nohup env PORT=3000 DATABASE_URL="file:/home/z/my-project/prisma/db/app.db" NODE_ENV=production node .next/standalone/server.js > /home/z/my-project/.zscripts/dev.log 2>&1 &
  disown $! 2>/dev/null
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Server restarted (PID: $!)" >> /home/z/my-project/.zscripts/watchdog.log
fi
