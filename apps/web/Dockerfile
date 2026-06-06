# Standalone Dockerfile for the SafeStream web app (apps/web has no workspace deps)
FROM node:20-slim AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# Install dependencies (treat app as standalone, ignore the monorepo workspace)
# --prod=false forces devDependencies (tailwind/postcss/typescript) even if NODE_ENV=production
ENV NODE_ENV=development
COPY apps/web/package.json ./package.json
RUN pnpm install --no-frozen-lockfile --ignore-workspace --prod=false

# Copy source and build (Tailwind compiles here, fresh every time)
COPY apps/web/ ./
RUN pnpm run build

# ---- Runtime image ----
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs

EXPOSE 3000
CMD ["pnpm", "run", "start"]
