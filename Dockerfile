# Multi-stage Dockerfile for AWS Fargate deployment.
#
# Output: small Node 20 Alpine image running the Next.js standalone server.
# `next.config.mjs` already sets output: "standalone" so .next/standalone
# bundles only the files needed to run.

# ── deps stage — install only what's needed for the build ────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── builder stage — run next build ───────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# These env vars are baked into the client bundle at build time. Override
# at `docker build --build-arg` for production builds.
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# Required by NextAuth even during build (route handler is statically analysed).
ENV NEXTAUTH_SECRET=build-only-not-a-real-secret
ENV NEXTAUTH_URL=http://localhost:3000

RUN npm run build

# ── runner stage — minimal image to run the standalone server ────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Drop privileges; create a fixed-uid app user for predictable Fargate
# task definitions (no auto-numbered nodejs:nodejs from the base image).
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# .next/standalone contains the server + minimal node_modules.
# .next/static is referenced at runtime; copy alongside.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

# Healthcheck for ECS/Fargate target-group probes. Renders the login page
# (which is public) — sufficient to know Next is serving.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/login >/dev/null 2>&1 || exit 1

CMD ["node", "server.js"]
