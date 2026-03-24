# ---- Base Stage: Installs dependencies ----
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./

# ---- Dependencies Stage: Install dependencies ----
# Use npm ci for reproducible builds
FROM base AS deps
RUN npm ci

# ---- Build Stage: Build the application ----
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time argument for Next.js Telemetry
# https://nextjs.org/telemetry
ARG NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---- Production Stage: Create the final, small image ----
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Re-disable telemetry for the runner
ENV NEXT_TELEMETRY_DISABLED=1

# Copy required files from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set PORT and HOSTNAME
ENV PORT 3000
ENV HOSTNAME 0.0.0.0

EXPOSE 3000

# Run the application
# server.js is created by the `standalone` output mode
CMD ["node", "server.js"]
