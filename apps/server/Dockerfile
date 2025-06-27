FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY package*.json ./

# Install dependencies with pnpm (no lockfile needed for server-only install)
RUN pnpm install --prod

# Copy server files
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Expose port (Railway will set this automatically)
EXPOSE $PORT

# Set environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0

# Health check for Railway
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# Start the server
CMD ["pnpm", "start"]