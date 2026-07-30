#!/bin/bash
cd /home/z/my-project
while true; do
  bun .next/standalone/server.js >> dev.log 2>&1
  echo "[$(date '+%H:%M:%S')] Server exited (code $?), restarting in 2s..." >> dev.log
  sleep 2
done
