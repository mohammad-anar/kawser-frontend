# ========================================================
# Next.js Production Dockerfile (Multi-stage build)
# ========================================================

# 1. Base image
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 2. Dependencies stage
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# 3. Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js anonymous telemetry disable
ENV NEXT_TELEMETRY_DISABLED=1

# Build-time environment variables for Next.js public client-side bundle
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_META_PIXEL_ID
ARG NEXT_PUBLIC_META_TEST_EVENT_CODE

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_META_PIXEL_ID=$NEXT_PUBLIC_META_PIXEL_ID
ENV NEXT_PUBLIC_META_TEST_EVENT_CODE=$NEXT_PUBLIC_META_TEST_EVENT_CODE

RUN npm run build

# 4. Production Runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets and standalone server output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]

