# ================================================================
# FrankStack - Node.js Stripe Server (Payment Token Handler)
# Dockerfile
# frank-node-stripe (cache-optimized, production-ready)
# 
# Author: Edoardo Sabatini
# Date: 27 October 2025
# ================================================================

# syntax=docker/dockerfile:1.4

# ---------- Stage 1: Build ----------
FROM node:20-alpine AS build
WORKDIR /app

# Copy only package files first (to maximize cache reuse)
COPY package*.json ./

# Install dependencies with persistent cache
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# Copy application source
COPY . .

# ---------- Stage 2: Runtime ----------
FROM node:20-alpine
WORKDIR /app

# Copy built app + node_modules from build stage
COPY --from=build /app /app

# Environment variables (12-Factor ready)
ENV NODE_ENV=production \
    STRIPE_PORT=${STRIPE_PORT:-4000}

# Expose the Stripe server port
EXPOSE ${STRIPE_PORT}

# Disable any file watching or reload
ENV CHOKIDAR_USEPOLLING=false

# Start command
CMD ["node", "myStripeServer.js"]

# ================================================================
# End of Dockerfile
# ================================================================
