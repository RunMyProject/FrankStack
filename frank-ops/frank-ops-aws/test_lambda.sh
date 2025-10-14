#!/bin/bash
# -----------------------------------------------------------------------------
# test_lambda.sh
# AWS Lambda test script on LocalStack
# Author: Edoardo Sabatini
# Date: 14/10/2025
# -----------------------------------------------------------------------------

LAMBDA_FILE="lambda_hello.py"
ZIP_FILE="lambda_hello.zip"
LAMBDA_NAME="helloLambda"
PAYLOAD_FILE="payload.json"
ENDPOINT="http://localhost:4566"
ROLE="arn:aws:iam::000000000000:role/lambda-role"

# Preconditions
if [ ! -f "$LAMBDA_FILE" ]; then
  echo "❌ lambda_hello.py not found. Exiting."
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

# Create or update function (suppress verbose errors)
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

# Ensure payload file exists
echo '{"message":"hello world","correlationID":"123"}' > "$PAYLOAD_FILE"

# Invoke the Lambda and replace $LATEST with 1
INV_OUT=$(aws --endpoint-url="$ENDPOINT" lambda invoke \
  --function-name "$LAMBDA_NAME" \
  --payload fileb://"$PAYLOAD_FILE" /dev/stdout 2>/dev/null | sed 's/\$LATEST/1/')

echo "🚀 Lambda invoked"
echo "📄 Lambda output:"
echo "$INV_OUT"
echo --- $PAYLOAD_FILE ---
cat $PAYLOAD_FILE
echo ------
# List function names only
echo "📋 Functions on LocalStack:"
aws --endpoint-url="$ENDPOINT" lambda list-functions \
  --query "Functions[].FunctionName" --output text 2>/dev/null
echo done.

