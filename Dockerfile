FROM node:20-alpine AS base
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable pnpm && npm config set registry https://registry.npmmirror.com && pnpm install --frozen-lockfile

FROM base AS builder
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="data/juanbing.sqlite"
ENV SESSION_SECRET="build-time-dummy-secret-32-chars-long!!!"
ENV ADMIN_USERNAME="admin"
ENV ADMIN_PASSWORD_HASH="build-time-dummy-password-hash-long-enough"
RUN corepack enable pnpm && pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN mkdir .next data && chown nextjs:nodejs .next data
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
USER nextjs
EXPOSE 18080
ENV PORT=18080
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
