FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
COPY services/auth-service/package.json ./services/auth-service/
COPY shared/libs/auth/package.json ./shared/libs/auth/
COPY shared/libs/database/package.json ./shared/libs/database/
COPY shared/libs/events/package.json ./shared/libs/events/
COPY shared/libs/exceptions/package.json ./shared/libs/exceptions/
COPY shared/libs/logger/package.json ./shared/libs/logger/
COPY shared/libs/redis/package.json ./shared/libs/redis/
COPY pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @safestream/auth-service build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/services/auth-service/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/main"]
