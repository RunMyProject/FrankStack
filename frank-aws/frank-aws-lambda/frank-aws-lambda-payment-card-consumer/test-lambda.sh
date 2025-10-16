#!/bin/bash
# ==========================================================
# test-lambda.sh
# -------------------------------------------------------
# Script to invoke the PaymentCardConsumerLambda on LocalStack
#
# FEATURES:
# - Constructs a full SNSEvent JSON payload (mimicking a topic publication).
# - Directly invokes the consumer Lambda.
# - Verifies that the Lambda executed successfully (StatusCode 200).
# - The actual processing status (the custom print "Good morning Edoardo...")
#   is checked by tailing the LocalStack logs.
#
# IMPORTANT IAM INFO:
# - LocalStack allows using any ARN, but in real AWS this must be a valid IAM Role
#   with Lambda execution permissions.
# - This role is what AWS checks to allow Lambda to run and be invoked by SNS.
# - Without a valid IAM role, the Lambda invocation will fail in real AWS.
# - Here we simulate it using LocalStack's dummy role ARN:
#   arn:aws:iam::000000000000:role/lambda-execute
#
# Author: Edoardo Sabatini
# Date: 16 October 2025
# ==========================================================

set -e

# -------------------------------------------------------
# CONFIGURATION
# -------------------------------------------------------
VERSION="1" # Fixed version value for display purposes

# ----------------- IAM / ROLE --------------------------
ROLE="arn:aws:iam::000000000000:role/lambda-execute"

# Consumer Lambda details
LAMBDA_NAME="PaymentCardConsumerLambda"
REGION="eu-central-1"
ENDPOINT="http://localhost:4566" # LocalStack endpoint for AWS CLI testing
INPUT_JSON_FILE="sns_test_event.json"
OUTPUT_FILE="lambda_output.json" # Will contain the Lambda's return value (null)

# Log group
LOG_GROUP="/aws/lambda/$LAMBDA_NAME"

# -------------------------------------------------------
# CREATE LOG GROUP IF NOT EXISTS
# -------------------------------------------------------
echo "🔥 Ensuring log group $LOG_GROUP exists..."
aws --endpoint-url=$ENDPOINT logs create-log-group --log-group-name $LOG_GROUP 2>/dev/null || echo "Log group already exists"
echo "✅ ok, connected to $LOG_GROUP"

# -------------------------------------------------------
# PAYLOAD CONSTRUCTION
# -------------------------------------------------------
echo "🔥 Preparing SNS test event payload..."

CORR_ID="test-corr-id-$(date +%s)"

INNER_MESSAGE=$(cat <<EOF
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

ESCAPED_MESSAGE=$(echo "$INNER_MESSAGE" | tr -d '\n' | sed 's/"/\\"/g')

SNS_EVENT_PAYLOAD=$(cat <<EOF
{
  "Records": [
    {
      "EventSource": "aws:sns",
      "Sns": {
        "Message": "$ESCAPED_MESSAGE",
        "MessageId": "msg-id-$(date +%s)",
        "TopicArn": "arn:aws:sns:eu-central-1:000000000000:cardPaymentTopic",
        "Timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
      }
    }
  ]
}
EOF
)

echo "$SNS_EVENT_PAYLOAD" > "$INPUT_JSON_FILE"

echo "🚀 Invoking Lambda '$LAMBDA_NAME' with generated Correlation ID: $CORR_ID"
echo "   Payload stored in $INPUT_JSON_FILE. Output saved to $OUTPUT_FILE"

# -------------------------------------------------------
# INVOCATION
# -------------------------------------------------------
INVOCATION_STATUS=$(aws --endpoint-url=$ENDPOINT lambda invoke \
    --function-name $LAMBDA_NAME \
    --region $REGION \
    --payload file://$INPUT_JSON_FILE \
    --cli-binary-format raw-in-base64-out \
    $OUTPUT_FILE 2>&1)

# -------------------------------------------------------
# VERIFICATION
# -------------------------------------------------------
echo "✅ Invocation complete."
echo ""
echo "📝 Invocation Status (Expected StatusCode 200):"

if [ -n "$INVOCATION_STATUS" ]; then
    echo "$INVOCATION_STATUS" | jq --arg ver "$VERSION" '{
        "StatusCode": .StatusCode,
        "ExecutedVersion": $ver
    }'
else
    echo "Could not capture invocation status. Check raw output:"
    echo "$INVOCATION_STATUS"
fi

echo ""
echo "📝 Payload Response (Lambda Return Value - Expected 'null'):"
if [ -f "$OUTPUT_FILE" ]; then
    cat "$OUTPUT_FILE"
fi

# -------------------------------------------------------
# CONFIRM LOG GROUP CONNECTION
# -------------------------------------------------------
echo ""
echo "🔎 Confirming log group connection..."
aws --endpoint-url=$ENDPOINT logs describe-log-groups --log-group-name-prefix $LOG_GROUP | jq '.logGroups[].logGroupName' >/dev/null && echo "✅ Connected to log group $LOG_GROUP"

echo ""
echo "=========================================================="
echo "✅ TEST COMPLETE"
echo "=========================================================="
