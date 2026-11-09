# Official Microsoft Playwright base image with Chromium & OS dependencies pre-installed
FROM mcr.microsoft.com/playwright:v1.50.0-noble AS base

WORKDIR /app

# Install dependencies first for optimal Docker layer caching
COPY package*.json ./
RUN npm ci

# Generate Prisma client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy application source code
COPY tsconfig*.json nest-cli.json ./
COPY src ./src/

# Compile TypeScript production build
RUN npm run build

# Create persistent storage directories
RUN mkdir -p uploads/screenshots

# Configure environment defaults
ENV PORT=3001
ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/prisma/dev.db"

EXPOSE 3001

# Ensure SQLite schema is prepared, then start NestJS production server
CMD ["sh", "-c", "npx prisma db push && npm run start:prod"]
