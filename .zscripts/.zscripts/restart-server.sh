#!/usr/bin/env bash
# Restart the production server if it's not running
cd /home/z/my-project
if ! pgrep -f "server.js" > /dev/null 2>&1; then
  setsid bash -c 'DATABASE_URL="file:/home/z/my-project/prisma/db/app.db" NODE_ENV=production exec bun /home/z/my-project/.next/standalone/server.js' < /dev/null > /home/z/my-project/.zscripts/dev.log 2>&1 &
  disown
  echo "[$(date)] Server restarted" >> /home/z/my-project/.zscripts/restart.log
fi
