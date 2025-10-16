#!/bin/bash
# borg-log-test.sh
# ----------------------------------------
# Publishes an SNS message and fetches logs from PaymentCardConsumerLambda 🎾

# Author: Edoardo Sabatini
# Date: 16 October 2025
# ==========================================================

set -e

ENDPOINT="http://localhost:4566"
REGION="eu-central-1"
TOPIC_ARN="arn:aws:sns:eu-central-1:000000000000:cardPaymentTopic"
LOG_GROUP="/aws/lambda/PaymentCardConsumerLambda"
LAMBDA_NAME="PaymentCardConsumerLambda"

# --- CRITICAL: FORCED LOG GROUP CLEANUP ---
echo "🗑️ Attempting to **DELETE** old Log Group for clean run... 🗑️"
# Deletes the log group and ignores errors if it doesn't exist (2>/dev/null)
aws --endpoint-url=$ENDPOINT logs delete-log-group \
    --log-group-name $LOG_GROUP \
    --region $REGION 2>/dev/null || true
# ------------------------------------------

# 1. Wait for Lambda Deployment
echo "⏳ Waiting for Lambda deployment to be fully active..."
# This command blocks execution until the function is in the 'Active' state.
aws --endpoint-url=$ENDPOINT lambda wait function-active-v2 --function-name $LAMBDA_NAME --region $REGION

# Step 1: Create Log Stream
LOG_STREAM="manual-stream-$(date +%s)"
# This command will automatically recreate the Log Group if it was deleted.
aws --endpoint-url=$ENDPOINT logs create-log-stream \
    --log-group-name $LOG_GROUP \
    --log-stream-name $LOG_STREAM 2>/dev/null || true


# Step 2: Publish SNS message
CORR_ID="borg-log-corr-$(date +%s)"
MESSAGE=$(cat <<EOF
{
  "sagaCorrelationId": "$CORR_ID",
  "myStripeToken": "tok_visa_4242_12345",
  "status": "CREATED",
  "context": {
    "travelId": "T-30294",
    "hotelId": "H-7721",
    "total": 1250.75
  }
}
EOF
)

echo "🚀 Step 1: Publishing to SNS topic..."
aws --endpoint-url=$ENDPOINT sns publish \
    --topic-arn $TOPIC_ARN \
    --message "$MESSAGE" \
    --region $REGION
echo "✅ Step 1 complete: SNS message published"

# --- CRITICAL: THE STUBBORN SNAIL WAIT (Consumer Processing + Log Writing) ---
# We wait for the Lambda's internal 2.5s sleep PLUS the time needed for LocalStack to flush logs.
echo "🐌🐌 Step 2: Waiting 10 seconds for consumer processing and log flush (Forced Wait) 🐌🐌"
sleep 10
echo "✅ Step 2 complete: Consumer should have processed the message and logs written."
# ----------------------------------------------------------------------------

# Step 4: Fetch logs (Now the logs must exist and be written)
echo "🔍 Step 3: Fetching latest logs from Lambda (limit 100)..."

# Fetch log events. Using limit 100 to ensure we catch the latest messages.
aws --endpoint-url=$ENDPOINT logs filter-log-events \
    --log-group-name $LOG_GROUP \
    --limit 100 \
    --region $REGION \
    | jq -r '.events[].message'

echo "=========================================================="
echo "✅ Borg log test complete"
echo "Correlation ID: $CORR_ID"
echo "=========================================================="
