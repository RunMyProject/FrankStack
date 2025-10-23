#!/bin/bash
# ==========================================================
# start-full-stack.sh
# Full stack startup with Lambda pre-build
#
# Author: Edoardo Sabatini
# Date: 23 October 2025
# ==========================================================

set -e

echo "🚀 FULL STACK STARTUP SEQUENCE"
echo "================================"

# Step 1: Build Lambdas
echo "🏗️  Step 1: Building Lambda functions..."
cd frank-aws-api-gateway 
./lambda-builder.sh
cd ..

# Step 2: Start Docker stack
echo "🐳 Step 2: Starting Docker Compose stack..."
docker-compose up -d --build

# Step 3: Verification
echo "🔍 Step 3: Verifying deployment..."
sleep 5
docker-compose ps

echo ""
echo "=========================================================="
echo "✅ FULL STACK DEPLOYED SUCCESSFULLY!"
echo "   - Lambda functions built and ready"
echo "   - Docker stack running"
echo "=========================================================="

# List current Lambda functions
echo "📋 Current Lambda functions:"
./frank-aws-api-gateway/list_functions.sh
