#!/usr/bin/env bash
cd /home/z/my-project
if ! ss -tlnp 2>/dev/null | grep -q ':3000 '; then
  export DATABASE_URL="file:./db/app.db"
  export PORT=3000
  export NODE_OPTIONS="--max-old-space-size=1024"
  cd /home/z/my-project
  setsid bun run dev >> /home/z/my-project/dev.log 2>&1 &
fi
