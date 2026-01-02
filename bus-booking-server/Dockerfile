# Multi-stage build for Node.js backend
FROM node:20-alpine AS base

# Install dependencies for building native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM node:20-alpine AS development

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./

# Install all dependencies including devDependencies
RUN npm ci && npm cache clean --force

COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy only production dependencies from base stage
COPY --from=base /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Set environment to production
ENV NODE_ENV=production

EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "index.js"]
