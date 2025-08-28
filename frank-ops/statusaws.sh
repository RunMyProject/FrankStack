#!/bin/bash
# -----------------------------------------------------------------------------
# statusaws.sh
# -----------------------
# Script to check the status of LocalStack container.
# It simply reports whether LocalStack is running or not.
# -----------------------------------------------------------------------------
# Author: Edoardo Sabatini
# Date: 28 August 2025
# -----------------------------------------------------------------------------

# Check if LocalStack container is running
if [ "$(docker ps -q -f name=localstack)" ]; then
    echo "✅ LocalStack is RUNNING"
else
    echo "❌ LocalStack is NOT running"
fi
