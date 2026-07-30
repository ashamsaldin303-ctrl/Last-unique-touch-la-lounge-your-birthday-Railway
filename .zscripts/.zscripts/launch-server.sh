#!/usr/bin/env bash
# Fully detached server launcher.
# Uses setsid to create a new session + closes ALL file descriptors
# so the process is not tied to any terminal/bash session.
cd /home/z/my-project
export PORT=3000
export DATABASE_URL="file:/home/z/my-project/prisma/db/app.db"
export NODE_ENV=production
export HOSTNAME=0.0.0.0

# Close ALL file descriptors (0-9) and redirect to /dev/null
exec 0</dev/null 1>/dev/null 2>/dev/null 3>&- 4>&- 5>&- 6>&- 7>&- 8>&- 9>&-

# Replace this shell with node — setsid already detached us
exec node .next/standalone/server.js
