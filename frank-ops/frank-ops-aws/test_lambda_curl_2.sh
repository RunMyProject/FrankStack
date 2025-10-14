#!/bin/bash
# -----------------------------------------------------------------------------
# test_lambda_curl_2.sh
# AWS Lambda test script on LocalStack using aws CLI + curl/jq
# Author: Edoardo Sabatini
# Date: 14/10/2025
# -----------------------------------------------------------------------------

VERSION="1"
LAMBDA_FILE="lambda_hello.py"
ZIP_FILE="lambda_hello2.zip"
LAMBDA_NAME="helloLambda2"
ENDPOINT="http://localhost:4566"
ROLE="arn:aws:iam::000000000000:role/lambda-role"
PAYLOAD='{"message":"hello world","correlationID":"123"}'

# Preconditions
if [ ! -f "$LAMBDA_FILE" ]; then
  echo "❌ $LAMBDA_FILE not found. Exiting."
  exit 1
fi

# Check LocalStack in Docker
if docker ps --filter "name=localstack" --filter "status=running" | grep -q localstack; then
  echo "✔ LocalStack is active in Docker image"
else
  echo "❌ LocalStack is not running. Start the container first."
  exit 1
fi

# Create zip (overwrite)
zip -j "$ZIP_FILE" "$LAMBDA_FILE" >/dev/null
echo "📦 Lambda zip created using command 'zip' with file: $ZIP_FILE"

# Create or update Lambda function (suppress verbose errors)
aws --endpoint-url="$ENDPOINT" lambda create-function \
  --function-name "$LAMBDA_NAME" \
  --runtime python3.11 \
  --handler lambda_hello.handler \
  --zip-file "fileb://$ZIP_FILE" \
  --role "$ROLE" >/dev/null 2>&1 || \
aws --endpoint-url="$ENDPOINT" lambda update-function-code \
  --function-name "$LAMBDA_NAME" \
  --zip-file "fileb://$ZIP_FILE" >/dev/null 2>&1

echo "⚡ Created/updated Lambda function with name '$LAMBDA_NAME' from file $LAMBDA_FILE"

# Invoke Lambda using curl + jq
# Note: we are using 2015-03-31 API version because AWS Lambda API is versioned
echo "🚀 Lambda curl invoked on 2015-03-31"
INV_OUT=$(curl -s -X POST "$ENDPOINT/2015-03-31/functions/$LAMBDA_NAME/invocations" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")
  
echo "📄 Lambda output:"
echo "$INV_OUT" | jq .

# List function names using curl + jq
echo "📋 Functions on LocalStack (curl + jq):"
curl -s "$ENDPOINT/2015-03-31/functions" | jq -r '.Functions[].FunctionName'

# List function names only via AWS CLI
echo "📋 Functions on LocalStack (aws CLI):"
aws --endpoint-url="$ENDPOINT" lambda list-functions \
  --query "Functions[].FunctionName" --output text 2>/dev/null

echo done.

