# Multi-stage build for Load Calculator Application
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
    rm -f package-lock.json && npm install --omit=optional; \
    else \
    npm install --omit=optional; \
    fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build arguments for environment variables
ARG USE_REAL_AERIAL_DATA=false
ARG GOOGLE_MAPS_API_KEY=""
ARG MAPBOX_API_KEY=""
ARG AERIAL_PROVIDER=google
ARG SUPABASE_URL=""
ARG SUPABASE_ANON_KEY=""

# Set environment variables for build
ENV USE_REAL_AERIAL_DATA=$USE_REAL_AERIAL_DATA
ENV GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_API_KEY
ENV MAPBOX_API_KEY=$MAPBOX_API_KEY
ENV AERIAL_PROVIDER=$AERIAL_PROVIDER
ENV SUPABASE_URL=$SUPABASE_URL
ENV SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# Create .env file from example if it doesn't exist
RUN if [ ! -f .env ]; then cp .env.example .env; fi

# Install missing rollup dependency for musl
RUN npm install @rollup/rollup-linux-x64-musl --save-optional

# Build the application (skip TypeScript check for now)
RUN npm run build:vite

# Production image, copy all the files and run nginx
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

# Install curl for health checks
RUN apk add --no-cache curl

# Remove default nginx static assets
RUN rm -rf ./*

# Force complete refresh of copy layer with unique identifier
RUN echo "Auth debugging build: $(date +%s)" > /tmp/auth_debug_build_id

# Copy static assets from builder stage
COPY --from=builder /app/dist .

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create nginx user and set permissions
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /usr/share/nginx/html
RUN chown -R nextjs:nodejs /var/cache/nginx
RUN chown -R nextjs:nodejs /var/log/nginx
RUN chown -R nextjs:nodejs /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R nextjs:nodejs /var/run/nginx.pid

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]