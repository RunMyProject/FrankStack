#!/bin/bash
# ==========================================================
# borg-test.sh
# -------------------------------------------------------
# Minimal SNS test for PaymentCardConsumerLambda
# Step-by-step "Borg style" approach
#
# FEATURES:
# - Publishes a test message to SNS
# - Confirms that SNS publish succeeded
# - Does NOT attempt to read logs from a Void consumer
#
# Author: Edoardo Sabatini
# Date: 16 October 2025
# ==========================================================

set -e

# ---------------- CONFIGURATION --------------------------
ENDPOINT="http://localhost:4566"
REGION="eu-central-1"
TOPIC_ARN="arn:aws:sns:eu-central-1:000000000000:cardPaymentTopic"

# Unique correlation ID for this test
CORR_ID="borg-test-corr-$(date +%s)"

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

# ---------------- CONFIRM INVOCATION --------------------
echo "🔎 Step 2: Waiting 2 seconds for Lambda consumer to process..."
sleep 2
echo "✅ Step 2 complete: Consumer should have processed the message"

# ---------------- FINAL STATUS --------------------------
echo "=========================================================="
echo "✅ Borg test complete"
echo "Correlation ID: $CORR_ID"
echo "=========================================================="

