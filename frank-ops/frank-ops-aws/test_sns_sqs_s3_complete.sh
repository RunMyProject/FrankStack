#!/bin/bash
# -----------------------------------------------------------------------------
# test_sns_sqs_s3_complete.sh
# AWS SNS + SQS + S3 test script on LocalStack
# Demonstrates full flow: upload file -> notify SNS -> SQS receives -> pre-signed link
# Author: Edoardo Sabatini
# Date: 14/10/2025
# -----------------------------------------------------------------------------

# ------------------------------
# VARIABLES
# ------------------------------
ENDPOINT="http://localhost:4566"
BUCKET_NAME="demo-invoices"
FILE_NAME="invoice_demo.txt"
PAYLOAD="Demo invoice content for Edoardo"
SNS_TOPIC="payments-topic"
SQS_QUEUE="payments-queue"

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
# CREATE LOCAL FILE
# ------------------------------
echo "📦 Creating local file: $FILE_NAME"
echo "$PAYLOAD" > "$FILE_NAME"
echo "✅ File created with payload: \"$PAYLOAD\""
echo "----------------------------------------"

# ------------------------------
# CREATE S3 BUCKET
# ------------------------------
echo "🪣 Creating S3 bucket: $BUCKET_NAME"
aws --endpoint-url=$ENDPOINT s3 mb s3://$BUCKET_NAME
echo "✅ Bucket created"
echo "----------------------------------------"

# ------------------------------
# UPLOAD FILE TO S3
# ------------------------------
echo "📤 Uploading file \"$FILE_NAME\" to bucket \"$BUCKET_NAME\"..."
aws --endpoint-url=$ENDPOINT s3 cp "$FILE_NAME" s3://$BUCKET_NAME/
echo "✅ File uploaded: s3://$BUCKET_NAME/$FILE_NAME"
echo "----------------------------------------"

# ------------------------------
# CREATE SNS TOPIC
# ------------------------------
echo "📝 Creating SNS topic: $SNS_TOPIC"
TOPIC_ARN=$(aws --endpoint-url=$ENDPOINT sns create-topic --name $SNS_TOPIC --query 'TopicArn' --output text)
echo "✅ Topic ARN: $TOPIC_ARN"
echo "----------------------------------------"

# ------------------------------
# CREATE SQS QUEUE
# ------------------------------
echo "🛎 Creating SQS queue: $SQS_QUEUE"
QUEUE_URL=$(aws --endpoint-url=$ENDPOINT sqs create-queue --queue-name $SQS_QUEUE --query 'QueueUrl' --output text)
echo "✅ Queue URL: $QUEUE_URL"
echo "----------------------------------------"

# ------------------------------
# SUBSCRIBE SQS QUEUE TO SNS TOPIC
# ------------------------------
echo "🔗 Subscribing SQS queue to SNS topic"
aws --endpoint-url=$ENDPOINT sns subscribe \
  --topic-arn $TOPIC_ARN \
  --protocol sqs \
  --notification-endpoint $QUEUE_URL
echo "✅ Subscription created"
echo "----------------------------------------"

# ------------------------------
# PUBLISH MESSAGE TO SNS
# ------------------------------
echo "📢 Publishing message to SNS topic (notification about S3 file)"
aws --endpoint-url=$ENDPOINT sns publish \
  --topic-arn $TOPIC_ARN \
  --message "{\"s3_file\":\"$FILE_NAME\",\"bucket\":\"$BUCKET_NAME\",\"note\":\"$PAYLOAD\"}"
echo "✅ Message published"
echo "----------------------------------------"

# ------------------------------
# RECEIVE MESSAGE FROM SQS
# ------------------------------
echo "📩 Receiving message from SQS queue"
RECEIVED=$(aws --endpoint-url=$ENDPOINT sqs receive-message \
  --queue-url $QUEUE_URL \
  --max-number-of-messages 1 --output json)

echo "📥 Raw message from SQS:"
echo "$RECEIVED" | jq .

# Extract the inner message body JSON
MSG_BODY=$(echo "$RECEIVED" | jq -r '.Messages[0].Body')
echo "📄 Parsed message body:"
echo "$MSG_BODY"
echo "----------------------------------------"

# ------------------------------
# GENERATE PRE-SIGNED URL FOR S3 FILE
# ------------------------------
SIGNED_URL=$(aws --endpoint-url=$ENDPOINT s3 presign s3://$BUCKET_NAME/$FILE_NAME)
echo "🔗 Pre-signed URL for React or frontend app:"
echo "$SIGNED_URL"
echo "----------------------------------------"

echo "🎉 Complete demo of SNS + SQS + S3 finished!"

