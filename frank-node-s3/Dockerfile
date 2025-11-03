# ================================================================
# Dockerfile
# frank-node-s3 (S3 Proxy Server)
# ------------------------------------------------
# Lightweight Express proxy to serve PDFs and assets from LocalStack S3.
# Optimized for build cache and fast restarts.
#
# Author: Edoardo Sabatini
# Date: 03 November 2025
# ================================================================

# syntax=docker/dockerfile:1.4
FROM node:20-alpine AS base

WORKDIR /usr/src/app

# ------------------------------------------------
# 1️⃣ Install dependencies (cache optimized)
# ------------------------------------------------
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm install --omit=dev

# ------------------------------------------------
# 2️⃣ Copy application source
# ------------------------------------------------
COPY . .

# ------------------------------------------------
# 3️⃣ Environment configuration - Use environment variables from .env only
# ------------------------------------------------
ENV NODE_ENV=${NODE_ENV} \
    PORT=${S3_SERVER_PORT} \
    LOCALSTACK_BASE=${LOCALSTACK_BASE}
# ------------------------------------------------
# 4️⃣ Expose port (from .env)
EXPOSE ${S3_SERVER_PORT}

# ------------------------------------------------
# 5️⃣ Start the proxy server
# ------------------------------------------------
CMD ["node", "serverProxyS3.js"]

# ================================================================
# End of Dockerfile
# frank-node-s3
# ================================================================
