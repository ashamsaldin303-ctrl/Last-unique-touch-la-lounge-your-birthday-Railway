# Last Unique Touch — Luxury Furniture & Event Equipment Rental

A multi-tenant e-commerce platform for luxury furniture and event equipment rental in Kuwait.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Database**: PostgreSQL (Supabase) via Prisma ORM
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **i18n**: next-intl (Arabic + English, RTL/LTR)
- **3D**: Three.js + React Three Fiber
- **Testing**: Vitest
- **Package Manager**: Bun
- **Deployment**: Railway + Supabase

## Getting Started

```bash
# Install dependencies (also generates Prisma client via postinstall)
bun install

# Set up the database (requires DATABASE_URL + DIRECT_URL in .env)
bun run db:migrate      # create/apply migrations
bun run db:seed         # seed initial data

# Start the dev server
bun dev
```

The site will be available at `http://localhost:3000`.

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start dev server (port 3000) |
| `bun run build` | Production build (standalone output) |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run typecheck` | Run TypeScript check |
| `bun run test` | Run tests |
| `bun run test:watch` | Run tests in watch mode |
| `bun run test:coverage` | Run tests with coverage |
| `bun run analyze` | Analyze bundle size |
| `bun run db:migrate` | Create/apply migrations (dev) |
| `bun run db:deploy` | Apply migrations (production) |
| `bun run db:seed` | Seed database |
| `bun run db:studio` | Open Prisma Studio |
| `bun run db:generate` | Regenerate Prisma client |

## Environment Variables

See `.env.example` for all required variables. Key ones:

- `DATABASE_URL` — Supabase transaction pooler (port 6543, `?pgbouncer=true`)
- `DIRECT_URL` — Supabase direct connection (port 5432, for migrations)
- `ADMIN_PASSWORD` — Admin dashboard password
- `SESSION_SECRET` — HMAC secret for sessions (>=32 chars)
- `PAYMENT_WEBHOOK_SECRET` — HMAC secret for payment webhooks (>=16 chars)
- `NEXT_PUBLIC_SITE_URL` — Canonical production URL

## Admin Dashboard

Access at `/admin/login`. Use the password set in `ADMIN_PASSWORD`.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── [locale]/           # i18n locale routing
│   ├── api/                # API routes
│   └── globals.css         # Global styles
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Navbar, Footer
│   ├── landing/            # Home page sections
│   ├── product/            # Product detail components
│   ├── cart/               # Cart components
│   ├── checkout/           # Checkout flow
│   ├── admin/              # Admin dashboard
│   └── providers/          # Context providers
├── lib/                    # Utilities and helpers
├── i18n/                   # next-intl config
├── messages/               # Translation files (ar.json, en.json)
└── middleware.ts           # i18n middleware

content/                    # Markdown content for legal pages
prisma/                     # Database schema and migrations
public/                     # Static assets
```

## 🚀 Deployment

This project is configured for **Railway + Supabase** deployment.

### Quick Deploy
1. Fork this repo
2. Create Supabase project → get connection strings
3. Deploy to Railway → set env vars
4. Done!

See [DEPLOY.md](./DEPLOY.md) for detailed instructions.

### Stack
- **Frontend:** Railway (Next.js 16 + Bun)
- **Database:** Supabase (PostgreSQL)
- **CDN:** Cloudflare (free)
- **Email:** Resend (free 3K/month)
- **Automation:** n8n (on Railway)
- **Monitoring:** Sentry + UptimeRobot (free)

## License

© 2026 Last Unique Touch. All rights reserved.
