#!/bin/bash
# -----------------------------------------------------------------------------
# test_lambda_boto3.sh
# AWS Lambda test script using Python boto3 on LocalStack
# Demonstrates creation of Lambda function and invocation
# Author: Edoardo Sabatini
# Date: 14/10/2025
# -----------------------------------------------------------------------------

# ------------------------------
# VARIABLES
# ------------------------------
ENDPOINT="http://localhost:4566"
LAMBDA_NAME="helloLambda"
ZIP_FILE="lambda_hello.zip"
ROLE="arn:aws:iam::000000000000:role/lambda-role"
PAYLOAD='{"message":"hello world","correlationID":"123"}'
LAMBDA_SCRIPT="lambda_boto3_test.py"

# ------------------------------
# CHECK LOCALSTACK
# ------------------------------
if docker ps --filter "name=localstack" --filter "status=running" | grep -q localstack; then
  echo "✔ LocalStack is active in Docker"
else
  echo "❌ LocalStack is not running. Start the container first."
  exit 1
fi

# ------------------------------
# CREATE ZIP PACKAGE FOR LAMBDA
# ------------------------------
if [ ! -f "$ZIP_FILE" ]; then
  echo "❌ $ZIP_FILE not found. Make sure you created the Lambda zip file."
  exit 1
fi
echo "📦 Lambda zip exists: $ZIP_FILE"
echo "----------------------------------------"

# ------------------------------
# CREATE OR UPDATE LAMBDA FUNCTION
# ------------------------------
echo "⚡ Creating or updating Lambda function: $LAMBDA_NAME"

aws --endpoint-url=$ENDPOINT lambda create-function \
  --function-name $LAMBDA_NAME \
  --runtime python3.11 \
  --role $ROLE \
  --handler lambda_hello.handler \
  --zip-file fileb://$ZIP_FILE >/dev/null 2>&1 || \
aws --endpoint-url=$ENDPOINT lambda update-function-code \
  --function-name $LAMBDA_NAME \
  --zip-file fileb://$ZIP_FILE >/dev/null 2>&1

echo "✅ Lambda function ready"
echo "----------------------------------------"

# ------------------------------
# INVOKE LAMBDA USING PYTHON SCRIPT
# ------------------------------
echo "🚀 Invoking Lambda via python script: $LAMBDA_SCRIPT"
python3 "$LAMBDA_SCRIPT"
echo "----------------------------------------"

# ------------------------------
# LIST EXISTING LAMBDA FUNCTIONS
# ------------------------------
echo "📋 Listing all Lambda functions on LocalStack:"
aws --endpoint-url=$ENDPOINT lambda list-functions \
  --query "Functions[].FunctionName" --output text
echo "----------------------------------------"

echo "🎉 Lambda test completed!"
