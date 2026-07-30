FROM node:20-slim AS deps
WORKDIR /app
RUN npm install -g bun
COPY package.json bun.lock ./
COPY prisma ./prisma
RUN bun install

FROM node:20-slim AS builder
WORKDIR /app
RUN npm install -g bun
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bunx prisma@6 generate
RUN bun run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN apt-get update && apt-get install -y --no-install-recommends libvips-dev curl openssl && rm -rf /var/lib/apt/lists/*
RUN npm install -g bun
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
RUN mkdir -p /app/.next/cache && chown -R 1001:1001 /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 CMD curl -f http://localhost:3000/api/v1/health || exit 1
CMD ["bun", "run", "start"]
