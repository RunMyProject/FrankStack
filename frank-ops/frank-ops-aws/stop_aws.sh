#!/bin/bash
# -----------------------------------------------------------------------------
# stop_aws.sh
# -----------------------
# Script to stop and remove the LocalStack container.
# Checks if LocalStack is running, stops it, and removes the container.
# -----------------------------------------------------------------------------
# Author: Edoardo Sabatini
# Date: 14 October 2025
# -----------------------------------------------------------------------------

# Stop LocalStack if running
if [ "$(docker ps -q -f name=localstack)" ]; then
  echo "🛑 Stopping LocalStack..."
  docker stop localstack
fi

# Remove LocalStack container if exists
if [ "$(docker ps -a -q -f name=localstack)" ]; then
  echo "🧹 Removing LocalStack container..."
  docker rm localstack
fi

echo "✅ LocalStack stopped and cleaned"
