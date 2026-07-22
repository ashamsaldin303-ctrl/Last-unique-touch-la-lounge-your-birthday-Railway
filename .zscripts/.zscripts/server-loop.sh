#!/bin/bash
# Auto-restart loop for the production server
cd /home/z/my-project
export PORT=3000
export DATABASE_URL="file:/home/z/my-project/prisma/db/app.db"
export NODE_ENV=production
export HOSTNAME=0.0.0.0

while true; do
  echo "[$(date)] Starting server..." >> /tmp/server-loop.log
  node .next/standalone/server.js >> /tmp/server-loop.log 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 2s..." >> /tmp/server-loop.log
  sleep 2
done
