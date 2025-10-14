#!/bin/bash
# -----------------------------------------------------------------------------
# test_sqs.sh
# AWS SQS test script on LocalStack
# Author: Edoardo Sabatini
# Date: 14/10/2025
# -----------------------------------------------------------------------------

QUEUE_NAME="test"
ENDPOINT="http://localhost:4566"
PAYLOAD="Hello SQS!"

# Check LocalStack container
if docker ps --filter "name=localstack" --filter "status=running" | grep -q localstack; then
  echo "✔ LocalStack is active in Docker image"
else
  echo "❌ LocalStack is not running. Start the container first."
  exit 1
fi

# Create SQS queue
QUEUE_URL=$(aws --endpoint-url="$ENDPOINT" sqs create-queue --queue-name "$QUEUE_NAME" \
  --output text --query 'QueueUrl')
echo "📦 Queue created: $QUEUE_URL"

# Send a message
MSG_ID=$(aws --endpoint-url="$ENDPOINT" sqs send-message \
  --queue-url "$QUEUE_URL" \
  --message-body "$PAYLOAD" \
  --output text --query 'MessageId')
echo "📤 Message sent: $MSG_ID"

# Receive the message
RECEIVED=$(aws --endpoint-url="$ENDPOINT" sqs receive-message \
  --queue-url "$QUEUE_URL" \
  --output json)
echo "📥 Message received:"
echo "$RECEIVED" | jq .

# Extract ReceiptHandle to delete message
RECEIPT_HANDLE=$(echo "$RECEIVED" | jq -r '.Messages[0].ReceiptHandle // empty')

if [ -n "$RECEIPT_HANDLE" ]; then
  aws --endpoint-url="$ENDPOINT" sqs delete-message \
    --queue-url "$QUEUE_URL" \
    --receipt-handle "$RECEIPT_HANDLE"
  echo "🗑️ Message deleted"
else
  echo "⚠️ No message to delete"
fi

# List queues
echo "📋 Queues on LocalStack:"
aws --endpoint-url="$ENDPOINT" sqs list-queues --output text --query 'QueueUrls[]'

echo done.

