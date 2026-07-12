# 🚀 Deployment Guide — Railway + Supabase

## Prerequisites
1. GitHub account
2. Railway account (https://railway.app)
3. Supabase account (https://supabase.com)
4. Domain (optional)

## Step 1: Supabase Setup

1. Go to https://supabase.com → New Project
2. Project name: `last-unique-touch`
3. Region: `AP South 1 (Mumbai)` — closest to Kuwait
4. Generate strong database password
5. Wait for project to provision (~2 min)

### Get Connection Strings
Settings → Database → Connection string:
- **Transaction pooler (port 6543)** → `DATABASE_URL`
- **Session pooler (port 5432)** → `DIRECT_URL`

### Create Shadow DB User (for migrations)
SQL Editor → run:
```sql
CREATE USER "prisma" WITH PASSWORD 'your-password' CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE postgres TO "prisma";
```

## Step 2: Run Migrations

```bash
# Set env vars
export DATABASE_URL="postgresql://postgres.[REF]:[PWD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
export DIRECT_URL="postgresql://postgres.[REF]:[PWD]@db.[REF].supabase.co:5432/postgres"

# Generate initial migration
bunx prisma migrate dev --name init_postgresql

# Seed
bunx prisma db seed
```

## Step 3: Railway Deploy

1. Go to https://railway.app → New Project → Deploy from GitHub
2. Select your repo
3. Railway auto-detects Next.js

### Set Environment Variables
```
DATABASE_URL=postgresql://postgres.[REF]:[PWD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=15
DIRECT_URL=postgresql://postgres.[REF]:[PWD]@db.[REF].supabase.co:5432/postgres
ADMIN_PASSWORD=your-strong-password
SESSION_SECRET=openssl rand -hex 32
PAYMENT_WEBHOOK_SECRET=openssl rand -hex 16
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://your-app.up.railway.app
NEXT_PUBLIC_WHATSAPP_NUMBER=965XXXXXXXX
```

### Deploy
Click Deploy → wait 3-5 min → app live!

## Step 4: Custom Domain (optional)

Railway → Settings → Networking → Custom Domain
- Enter your domain
- Add CNAME record in DNS
- SSL is automatic

## Step 5: Post-Deploy Verification

```bash
# Health check
curl https://your-app.up.railway.app/api/v1/health

# Admin login
curl -X POST https://your-app.up.railway.app/ar/admin/login \
  -d "password=your-password"
```

## Troubleshooting

### Prisma Client Not Found
- Ensure `postinstall: "prisma generate"` in package.json
- Check `serverExternalPackages` in next.config.ts

### Migration Failed
- Verify `DIRECT_URL` is set (not just `DATABASE_URL`)
- Check shadow DB user permissions

### Build Timeout
- Increase healthcheck timeout in railway.json (300s)
- Check build logs for errors
