# Folk Care - Production Dockerfile
# Multi-stage build for minimal image size
#
# Build: docker build -t folkcare:latest .
# Run:   docker run -p 3000:3000 --env-file .env.docker folkcare:latest

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:22-alpine AS deps

WORKDIR /app

# Install build dependencies for native modules (bcrypt, etc.)
RUN apk add --no-cache python3 make g++ libc6-compat

# Copy package files for all workspaces
COPY package*.json ./
COPY packages/core/package*.json ./packages/core/
COPY packages/app/package*.json ./packages/app/
COPY packages/web/package*.json ./packages/web/
COPY packages/shared-components/package*.json ./packages/shared-components/
COPY verticals/*/package*.json ./verticals/

# Create package.json stubs for verticals
RUN mkdir -p verticals/client-demographics verticals/caregiver-staff \
    verticals/scheduling-visits verticals/time-tracking-evv \
    verticals/care-plans-tasks verticals/billing-invoicing \
    verticals/family-engagement verticals/payroll-processing \
    verticals/quality-assurance verticals/shift-matching \
    verticals/analytics-reporting verticals/incident-reporting \
    verticals/visit-notes verticals/medication-management \
    verticals/compliance-autopilot verticals/caregiver-burnout-prediction \
    verticals/ai-services

# Install all dependencies
RUN npm ci --ignore-scripts

# ============================================
# Stage 2: Builder
# ============================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source code
COPY . .

# Build the application
RUN npm run build

# ============================================
# Stage 3: Runner (Production)
# ============================================
FROM node:22-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 folkcare \
    && adduser --system --uid 1001 folkcare

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy built application
COPY --from=builder /app/packages/app/dist ./packages/app/dist
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/web/dist ./public
COPY --from=builder /app/verticals/*/dist ./verticals/
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages/app/package*.json ./packages/app/
COPY --from=builder /app/packages/core/package*.json ./packages/core/

# Copy migrations for database setup
COPY --from=builder /app/packages/core/migrations ./packages/core/migrations
COPY --from=builder /app/packages/core/scripts ./packages/core/scripts

# Install production dependencies only
RUN npm ci --omit=dev --ignore-scripts

# Set ownership
RUN chown -R folkcare:folkcare /app

# Switch to non-root user
USER folkcare

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "packages/app/dist/server.js"]
