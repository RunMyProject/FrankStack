#!/bin/bash
# ==========================================================
# cleanup-lambda-functions.sh
# Cleanup all Lambda functions from LocalStack
#
# Author: Edoardo Sabatini
# Date: 23 October 2025
# ==========================================================

ENDPOINT="http://localhost:4566"
REGION="eu-central-1"

echo "🧹 Cleaning up Lambda functions..."

# Get all function names
FUNCTIONS=$(aws --endpoint-url=$ENDPOINT lambda list-functions --region $REGION --query "Functions[*].FunctionName" --output text)

if [ -z "$FUNCTIONS" ]; then
    echo "✅ No Lambda functions found to clean up"
    exit 0
fi

echo "📋 Found functions:"
echo "$FUNCTIONS"

# Delete each function
for FUNCTION in $FUNCTIONS; do
    echo "🗑️  Deleting: $FUNCTION"
    aws --endpoint-url=$ENDPOINT lambda delete-function --function-name "$FUNCTION" --region $REGION
done

echo "✅ Cleanup completed! Deleted functions:"
echo "$FUNCTIONS"
