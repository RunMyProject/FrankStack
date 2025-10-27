# ================================================================
# Dockerfile
# frank-node-server (cache-optimized, no reload, 12-Factor ready)
# Author: Edoardo Sabatini
# Date: 27 October 2025
# ================================================================

# syntax=docker/dockerfile:1.4
FROM node:20-alpine AS build

WORKDIR /app

# Copy package.json first to use Docker cache
COPY package*.json ./

# Install dependencies with BuildKit caching
RUN --mount=type=cache,target=/root/.npm npm install --omit=dev

# Copy source code
COPY . .

# -----------------------------------
# Stage 2: Run (lightweight runtime)
# -----------------------------------
FROM node:20-alpine
WORKDIR /app

# Copy build artifacts
COPY --from=build /app /app

# Expose port (from .env)
EXPOSE ${NODE_PORT}

# Use environment variables from .env only
ENV NODE_ENV=${NODE_ENV} \
    NODE_PORT=${NODE_PORT} \
    OLLAMA_HOST=${OLLAMA_HOST} \
    OLLAMA_PORT=${OLLAMA_PORT} \
    OLLAMA_MODEL=${OLLAMA_MODEL} \
    DEFAULT_PROVIDER=${DEFAULT_PROVIDER} \
    CHATGPT_MODEL=${CHATGPT_MODEL} \
    REQUEST_TIMEOUT_MS=${REQUEST_TIMEOUT_MS} \
    TEMPERATURE=${TEMPERATURE} \
    ORCHESTRATOR_URL=${ORCHESTRATOR_URL} \
    WS_AI_SERVER_DEBUG=${WS_AI_SERVER_DEBUG}

# Start Node AI server
CMD ["node", "ws_ai_server.js"]
# ================================================================
# End of Dockerfile
# frank-node-server
# ================================================================
 