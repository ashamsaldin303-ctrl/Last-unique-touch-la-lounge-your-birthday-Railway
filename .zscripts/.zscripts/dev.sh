#!/bin/bash
# Custom dev script for sandbox — runs production standalone server
# This is executed by /start.sh during boot

cd /home/z/my-project

# Ensure standalone build exists
if [ ! -f ".next/standalone/server.js" ]; then
  echo "[DEV] Building standalone server..."
  bunx next build
  cp -r .next/static .next/standalone/.next/
  cp -r public .next/standalone/
fi

# Start the standalone production server (no SWC needed, very stable)
echo "[DEV] Starting standalone production server..."
exec node .next/standalone/server.js
