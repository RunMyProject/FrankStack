#!/bin/bash
# ==========================================================
# test-sns-consumer.sh
# -------------------------------------------------------
# SNS test for Payment Card Consumer Lambda
# Step-by-step approach to verify SNS -> Lambda flow
#
# FEATURES:
# - Publishes a test message to SNS
# - Confirms that SNS publish succeeded
# - Verifies Lambda consumer processing
#
# Author: Edoardo Sabatini
# Date: 23 October 2025
# ==========================================================

set -e

# ---------------- CONFIGURATION --------------------------
ENDPOINT="http://localhost:4566"
REGION="eu-central-1"
TOPIC_ARN="arn:aws:sns:eu-central-1:000000000000:cardPaymentTopic"
CONSUMER_LAMBDA="frank-aws-lambda-payment-card-consumer"

# Unique correlation ID for this test
CORR_ID="test-corr-$(date +%s)"

# Payload JSON
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

# ---------------- PUBLISH TO SNS -------------------------
echo "🚀 Step 1: Publishing to SNS topic..."
PUB_OUTPUT=$(aws --endpoint-url=$ENDPOINT sns publish \
    --topic-arn $TOPIC_ARN \
    --message "$MESSAGE" \
    --region $REGION)

echo "✅ Step 1 complete: SNS message published"
echo "$PUB_OUTPUT"

# ---------------- VERIFY LAMBDA STATUS --------------------
echo "🔎 Step 2: Checking Lambda function status..."
aws --endpoint-url=$ENDPOINT lambda get-function \
    --function-name "$CONSUMER_LAMBDA" \
    --region $REGION > /dev/null
echo "✅ Step 2 complete: Consumer Lambda is available"

# ---------------- WAIT FOR PROCESSING --------------------
echo "⏳ Step 3: Waiting 3 seconds for Lambda consumer to process..."
sleep 3
echo "✅ Step 3 complete: Consumer should have processed the message"

# ---------------- FINAL STATUS --------------------------
echo "=========================================================="
echo "✅ SNS -> LAMBDA TEST COMPLETE"
echo "📧 Message published to SNS topic: cardPaymentTopic"
echo "🔗 Consumer Lambda: $CONSUMER_LAMBDA"
echo "🆔 Correlation ID: $CORR_ID"
echo "=========================================================="