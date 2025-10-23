#!/bin/bash
# ==========================================================
# stop-full-stack.sh
# Full stack shutdown with Lambda cleanup
#
# Author: Edoardo Sabatini
# Date: 23 October 2025
# ==========================================================

set -e

echo "🛑 FULL STACK SHUTDOWN SEQUENCE"
echo "================================"

# Step 1: Cleanup Lambda functions
./frank-aws-api-gateway/cleanup-lambda-functions.sh

# Step 2: Stop Docker stack
echo "🐳 Stopping Docker stack..."
docker-compose down

echo ""
echo "✅ FULL STACK SHUTDOWN COMPLETE"
echo "==============================="
echo "• Lambda functions: Cleaned"
echo "• Docker stack: Stopped"
echo "• Ready for fresh deployment"
