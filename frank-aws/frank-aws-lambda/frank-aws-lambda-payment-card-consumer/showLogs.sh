#!/bin/bash
# showLogs.sh
# ----------------------------------------

# Author: Edoardo Sabatini
# Date: 29 October 2025
# ==========================================================

# Script to show logs of a Lambda running on LocalStack
# Make sure you have AWS CLI and jq installed and configured for LocalStack.
# Use this script to retrieve and display logs of the specified Lambda.

# 1. Define variables (LocalStack typically uses us-east-1)
ENDPOINT="http://localhost:4566"
REGION="eu-central-1"
# Lambda Log Group you showed in docker ps
LOG_GROUP="frankstack-localstack-lambda-frank-aws-lambda-payment-card-producer-cf16282a42371399e8590a0bfe0d1558" 

# 2. Execute command to retrieve and clean logs
LOGS_OUTPUT=$(aws --endpoint-url=$ENDPOINT logs filter-log-events \
    --log-group-name $LOG_GROUP \
    --limit 100 \
    --region $REGION 2>/dev/null | jq -r '.events[].message' || echo "Logs not found or LocalStack is not ready.")

# 3. Print the result
echo "$LOGS_OUTPUT"
# ==========================================================
# End of showLogs.sh
