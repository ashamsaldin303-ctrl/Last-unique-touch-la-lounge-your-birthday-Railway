# Last Unique Touch — Luxury Furniture & Event Equipment Rental

A multi-tenant e-commerce platform for luxury furniture and event equipment rental in Kuwait.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Database**: SQLite (dev) via Prisma ORM
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **i18n**: next-intl (Arabic + English, RTL/LTR)
- **3D**: Three.js + React Three Fiber
- **Testing**: Vitest
- **Package Manager**: Bun

## Getting Started

```bash
# Install dependencies
bun install

# Set up the database
bun run db:push
bun run db:seed

# Start the dev server
bun dev
```

The site will be available at `http://localhost:3000`.

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start dev server (port 3000) |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run typecheck` | Run TypeScript check |
| `bun run test` | Run tests |
| `bun run test:watch` | Run tests in watch mode |
| `bun run test:coverage` | Run tests with coverage |
| `bun run analyze` | Analyze bundle size |
| `bun run db:push` | Push schema to database |
| `bun run db:seed` | Seed database |
| `bun run db:studio` | Open Prisma Studio |

## Environment Variables

See `.env.example` for all required variables. Key ones:

- `DATABASE_URL` — SQLite path (e.g., `file:./prisma/dev.db`)
- `ADMIN_PASSWORD` — Admin dashboard password (use "dev" in development)
- `N8N_WEBHOOK_URL` — n8n webhook endpoint (optional)
- `N8N_WEBHOOK_SECRET` — HMAC secret for n8n webhook (optional)

## Admin Dashboard

Access at `/admin/login`. In development, use password `dev` (when `ADMIN_PASSWORD` is not set).

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

## License

© 2026 Last Unique Touch. All rights reserved.
