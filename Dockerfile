# Multi-stage build for production optimization
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN cd client && npm ci --only=production
RUN cd server && npm ci --only=production

# Build the client application
FROM base AS builder
WORKDIR /app

# Copy source code
COPY client ./client
COPY server ./server

# Copy dependencies from deps stage
COPY --from=deps /app/client/node_modules ./client/node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules

# Install dev dependencies for build
RUN cd client && npm ci

# Build client
RUN cd client && npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 socketio

# Copy built application
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/dist ./client/dist
COPY --from=deps /app/server/node_modules ./server/node_modules

# Create uploads directory
RUN mkdir -p /app/server/uploads
RUN mkdir -p /app/server/logs

# Set ownership
RUN chown -R socketio:nodejs /app
USER socketio

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
               const options = { hostname: 'localhost', port: 5000, path: '/api/health', timeout: 2000 }; \
               const req = http.request(options, (res) => { \
                 process.exit(res.statusCode === 200 ? 0 : 1); \
               }); \
               req.on('error', () => process.exit(1)); \
               req.end();"

# Start the application
WORKDIR /app/server
CMD ["node", "server.js"]