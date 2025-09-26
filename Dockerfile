FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm install

# Copy source code
COPY frontend/ .

# Build the application
RUN npm run build

# Remove dev dependencies except vite (needed for preview)
RUN npm prune --omit=dev
RUN npm install vite@^4.5.0

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3002

# Set environment variable for production
ENV NODE_ENV=production

# Start the production server
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3002", "--allowedHosts", ".theclusterflux.com"] 