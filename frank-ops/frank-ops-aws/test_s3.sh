#!/bin/bash
# -----------------------------------------------------------------------------
# test_s3.sh
# AWS S3 test script on LocalStack
# Author: Edoardo Sabatini
# Date: 14/10/2025
# -----------------------------------------------------------------------------

# VARIABLES
FILE_NAME="file_s3_bucket.txt"
BUCKET_NAME="mybucket"
ENDPOINT="http://localhost:4566"
PAYLOAD="Hello S3!"

# -----------------------------------------------------------------------------
# CHECK LOCALSTACK CONTAINER STATUS
# -----------------------------------------------------------------------------
if docker ps --filter "name=localstack" --filter "status=running" | grep -q localstack; then
  echo "✔ LocalStack is active in Docker image"
else
  echo "❌ LocalStack is not running. Start the container first."
  exit 1
fi
echo "----------------------------------------"

# -----------------------------------------------------------------------------
# CREATE LOCAL FILE
# -----------------------------------------------------------------------------
echo "📦 Creating file: $FILE_NAME"
echo "$PAYLOAD" > "$FILE_NAME"
echo "✅ File created with payload: \"$PAYLOAD\""
echo "----------------------------------------"

# -----------------------------------------------------------------------------
# SHOW CURRENT S3 BUCKETS (EMPTY EXPECTED)
# -----------------------------------------------------------------------------
echo "📋 Listing existing S3 buckets (should be empty on fresh start)..."
aws --endpoint-url=$ENDPOINT s3 ls
echo "----------------------------------------"

# -----------------------------------------------------------------------------
# CREATE BUCKET IF NOT EXISTS
# -----------------------------------------------------------------------------
if aws --endpoint-url=$ENDPOINT s3 ls | grep -q "$BUCKET_NAME"; then
  echo "ℹ️  Bucket \"$BUCKET_NAME\" already exists."
else
  echo "🪣 Creating new S3 bucket: $BUCKET_NAME"
  aws --endpoint-url=$ENDPOINT s3 mb s3://$BUCKET_NAME
  echo "✅ Bucket created!"
fi
echo "----------------------------------------"

# -----------------------------------------------------------------------------
# UPLOAD FILE
# -----------------------------------------------------------------------------
echo "📤 Uploading file \"$FILE_NAME\" to bucket \"$BUCKET_NAME\"..."
aws --endpoint-url=$ENDPOINT s3 cp "$FILE_NAME" s3://$BUCKET_NAME/
echo "✅ File uploaded successfully!"
echo "----------------------------------------"

# -----------------------------------------------------------------------------
# VERIFY FILE IN BUCKET
# -----------------------------------------------------------------------------
echo "📦 Listing content of bucket \"$BUCKET_NAME\"..."
aws --endpoint-url=$ENDPOINT s3 ls s3://$BUCKET_NAME/
echo "----------------------------------------"

# -----------------------------------------------------------------------------
# READ FILE CONTENT FROM BUCKET
# -----------------------------------------------------------------------------
echo "📖 Reading file content from S3..."
aws --endpoint-url=$ENDPOINT s3 cp s3://$BUCKET_NAME/$FILE_NAME -
echo "----------------------------------------"

aws --endpoint-url=http://localhost:4566 s3api get-object \
  --bucket mybucket \
  --key file_s3_bucket.txt \
  /dev/stdout
  
echo "🎉 Test completed successfully!"

