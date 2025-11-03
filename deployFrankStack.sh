#!/bin/bash
# ==========================================================
# deployFrankStack.sh
# deploy the Frank Stack on a Linux system
#
# Author: Edoardo Sabatini
# Date: 03 November 2025
# ==========================================================

# Load environment variables

./setup_auto_env.sh
if [ $? -ne 0 ]; then
    echo "Error: setup_auto_env.sh failed!"
    exit 1
fi

# ================================================================
# Check if .env.local file exists
# ================================================================

if [ ! -f ".env.local" ]; then
    echo "❌ ERROR: .env.local file not found!"
    echo "📁 Current directory: $(pwd)"
    echo "📋 Available files:"
    ls -la | grep -E "(.env|docker-compose)"
    exit 1
fi

# ================================================================
# Load environment variables with error handling
# ================================================================

echo "🔍 Loading variables from .env.local..."
set -a
if ! source .env.local; then
    echo "❌ ERROR: Failed to load .env.local file"
    exit 1
fi
set +a

# ================================================================
# Verify HOST_MODELS_DIR is set
# ================================================================

if [ -z "$HOST_MODELS_DIR" ]; then
    echo "❌ ERROR: HOST_MODELS_DIR is not defined in .env.local"
    echo "💡 Please ensure .env.local contains: HOST_MODELS_DIR=/your/path/here"
    exit 1
fi

# ================================================================
# Verify the directory actually exists
# ================================================================

if [ ! -d "$HOST_MODELS_DIR" ]; then
    echo "❌ ERROR: Directory does not exist: $HOST_MODELS_DIR"
    echo "💡 Please create the directory or update .env.local with correct path"
    exit 1
fi

# ================================================================
# Start Docker Compose
# ================================================================

echo "✅ All checks passed!"
echo "📁 Models directory: $HOST_MODELS_DIR"
echo "🐳 Starting Docker Compose..."

# ==========================================================

echo "Deployment of Frank Stack"
echo "-------------------------------------------"

echo "Stage 1: Node.js deployment..."
docker-compose -f docker-compose.yml up -d --build
if [ $? -eq 0 ]; then
    echo "Stage 1 deployed successfully!"
else
    echo "Deployment failed. Please check the logs for more details."
    exit 1
fi

# ==========================================================

echo "Stage 2: Java deployment..."
cd frank-spring || {
    echo "Error: directory frank-stack-spring not found!"
    exit 1
}
docker-compose -f docker-compose.yml up -d --build
if [ $? -eq 0 ]; then
    echo "Stage 2 deployed successfully!"
else
    echo "Deployment failed. Please check the logs for more details."
    exit 1
fi

# ==========================================================

echo "Stage 3: AWS deployment..."
cd ../frank-aws || {
    echo "Error: directory frank-stack-aws not found!"
    exit 1
}
./start-full-stack.sh
if [ $? -eq 0 ]; then
    echo "Stage 3 deployed successfully!"
else
    echo "Deployment failed. Please check the logs for more details."
    exit 1
fi

echo "Deployment script finished."

# ==========================================================

echo "Stage 4: Frontend deployment..."
cd .. || {
    echo "Error: directory frank-stack not found!"
    exit 1
}
./deployFrontEnd.sh
# End of deployFrankStack.sh
