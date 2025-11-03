# ================================================================
# Dockerfile
# frankstack-react-vite (Vite / React 18)
# 
# Author: Edoardo Sabatini
# Date: 03 November 2025
# ================================================================

# syntax=docker/dockerfile:1.4
FROM node:20-alpine AS build

WORKDIR /app

# Copy package.json first to leverage caching
COPY package*.json ./

# Install dependencies (no dev dependencies in production build)
RUN --mount=type=cache,target=/root/.npm npm install

# Copy source code and .env
COPY . .
COPY .env .

# Build React app (Vite)
RUN npm run build

# -----------------------------------
# Stage 2: Serve
# -----------------------------------
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx static files
RUN rm -rf ./*

# Copy build artifacts
COPY --from=build /app/dist .

# Expose port for frontend
EXPOSE 80

# Default command
CMD ["nginx", "-g", "daemon off;"]
# ================================================================
# End of Dockerfile
# frankstack-react-vite
# ================================================================
