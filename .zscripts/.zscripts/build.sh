#!/usr/bin/env bash
# build.sh — Production build for Last Unique Touch & La Lounge & Your Birthday
#
# Flow:
#   1. bun install
#   2. prisma generate
#   3. prisma migrate deploy   (apply existing migrations — NEVER db:push)
#   4. prisma db seed           (idempotent — safe to fail)
#   5. next build (standalone)
#   6. mini-services build (if present)
#   7. package artifacts to /tmp/build_fullstack_${BUILD_ID}.tar.gz
#
# P0.3 (v8): rewritten to use migrate deploy (not db:push), correct DB path,
# and prisma generate before build so the standalone server has a working client.

# Redirect stderr to stdout for log capture.
exec 2>&1
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NEXTJS_PROJECT_DIR="/home/z/my-project"

if [ ! -d "$NEXTJS_PROJECT_DIR" ]; then
    echo "❌ ERROR: Next.js project directory does not exist: $NEXTJS_PROJECT_DIR"
    exit 1
fi

echo "🚀 Starting production build..."
echo "📁 Project: $NEXTJS_PROJECT_DIR"

cd "$NEXTJS_PROJECT_DIR"

export NEXT_TELEMETRY_DISABLED=1
# Canonical DB path — must match .env and package.json scripts.
export DATABASE_URL="file:${NEXTJS_PROJECT_DIR}/prisma/db/app.db"

PRISMA="bun ./node_modules/prisma/build/index.js"

BUILD_DIR="/tmp/build_fullstack_${BUILD_ID:-local}"
echo "📁 Build dir: $BUILD_DIR"
mkdir -p "$BUILD_DIR"

# --- 1. Install deps ---
echo "📦 Installing dependencies..."
bun install

# --- 2. Generate Prisma client (required before next build) ---
echo "🔧 Generating Prisma client..."
$PRISMA generate

# --- 3. Apply migrations (authoritative — never db:push) ---
echo "🗄️  Applying migrations..."
$PRISMA migrate deploy

# --- 4. Seed (idempotent; safe to fail) ---
echo "🌱 Seeding database..."
bun prisma/seed.ts || echo "⚠️  Seed failed (may be expected if data already exists). Continuing..."

# --- 5. Build Next.js (standalone) ---
echo "🔨 Building Next.js..."
bun run build

# --- 6. Build mini-services (if present) ---
if [ -d "${NEXTJS_PROJECT_DIR}/mini-services" ]; then
    echo "🔨 Building mini-services..."
    sh "${SCRIPT_DIR}/mini-services-install.sh"
    sh "${SCRIPT_DIR}/mini-services-build.sh"
    cp "${SCRIPT_DIR}/mini-services-start.sh" "${BUILD_DIR}/mini-services-start.sh"
    chmod +x "${BUILD_DIR}/mini-services-start.sh"
else
    echo "ℹ️  No mini-services directory; skipping."
fi

# --- 7. Collect artifacts ---
echo "📦 Collecting artifacts to ${BUILD_DIR}..."

if [ -d ".next/standalone" ]; then
    cp -r .next/standalone "${BUILD_DIR}/next-service-dist/"
else
    echo "❌ ERROR: .next/standalone not found — build failed?"
    exit 1
fi

if [ -d ".next/static" ]; then
    mkdir -p "${BUILD_DIR}/next-service-dist/.next"
    cp -r .next/static "${BUILD_DIR}/next-service-dist/.next/"
fi

if [ -d "public" ]; then
    cp -r public "${BUILD_DIR}/next-service-dist/"
fi

# Bundle the migrations + prisma schema so production can run `migrate deploy`.
if [ -d "prisma" ]; then
    mkdir -p "${BUILD_DIR}/next-service-dist/prisma"
    cp -r prisma/migrations "${BUILD_DIR}/next-service-dist/prisma/"
    cp prisma/schema.prisma "${BUILD_DIR}/next-service-dist/prisma/"
    cp prisma/seed.ts "${BUILD_DIR}/next-service-dist/prisma/" 2>/dev/null || true
fi

# Copy the seeded DB into the artifact so production starts with seed data.
if [ -f "prisma/db/app.db" ]; then
    echo "🗄️  Copying seeded database to artifact..."
    mkdir -p "${BUILD_DIR}/db"
    cp prisma/db/app.db "${BUILD_DIR}/db/"
else
    echo "❌ ERROR: prisma/db/app.db not found — production will start with empty DB."
    exit 1
fi

if [ -f "Caddyfile" ]; then
    cp Caddyfile "${BUILD_DIR}/"
fi

if [ -f "${SCRIPT_DIR}/start.sh" ]; then
    cp "${SCRIPT_DIR}/start.sh" "${BUILD_DIR}/start.sh"
    chmod +x "${BUILD_DIR}/start.sh"
fi

# --- 8. Tarball ---
PACKAGE_FILE="${BUILD_DIR}.tar.gz"
echo ""
echo "📦 Packaging to ${PACKAGE_FILE}..."
cd "${BUILD_DIR}"
tar -czf "${PACKAGE_FILE}" .
cd - > /dev/null

echo ""
echo "✅ Build complete!"
echo "   Standalone: ${BUILD_DIR}/next-service-dist/"
echo "   Package:    ${PACKAGE_FILE}"
echo "   Start with: bun ${BUILD_DIR}/next-service-dist/server.js"
