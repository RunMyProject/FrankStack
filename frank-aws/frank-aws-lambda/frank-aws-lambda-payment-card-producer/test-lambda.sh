#!/bin/bash
# ==========================================================
# test-lambda.sh
# -------------------------------------------------------
# Script to invoke PaymentCardLambda on LocalStack
#
# Author: Edoardo Sabatini
# Date: 15 October 2025
# ==========================================================

set -e

# -------------------------------------------------------
# CONFIGURATION
# -------------------------------------------------------
VERSION="1" # Fixed version value for display purposes
LAMBDA_NAME="PaymentCardLambda"
REGION="eu-central-1"
ENDPOINT="http://localhost:4566" # Endpoint for the external CLI (test)
INPUT_JSON_FILE="payment_test_payload.json"
OUTPUT_FILE="lambda_output.json" # This file contains the Lambda's return value (the message)

# -------------------------------------------------------
# INVOCATION
# -------------------------------------------------------
echo "🔥 Preparing test payload..."
# 1. Create/Update the input JSON file with a unique ID
CORR_ID="corr-id-$(date +%s)"
PAYLOAD='{
  "sagaCorrelationId": "'"$CORR_ID"'",
  "myStripeToken": "tok_visa_4242_12345",
  "status": "CREATED",
  "context": {
    "travelId": "T-30294",
    "hotelId": "H-7721",
    "total": 1250.75
  }
}'
echo "$PAYLOAD" > "$INPUT_JSON_FILE"

echo "🚀 Invoking Lambda '$LAMBDA_NAME' with Saga Correlation ID: $CORR_ID"
echo "   Output saved to $OUTPUT_FILE"

# 2. Execute the invocation and capture the status JSON from stderr (which is usually where it goes when a file is specified)
# We redirect stderr (2) to stdout (1) and capture it into the variable.
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

# Use 'jq' to process the captured status and replace "$LATEST"
# We check if the captured string is not empty before piping to jq
if [ -n "$INVOCATION_STATUS" ]; then
    # Print the invocation status (StatusCode and fixed Version)
    echo "$INVOCATION_STATUS" | jq --arg ver "$VERSION" '{
        "StatusCode": .StatusCode,
        # Replaces the default "$LATEST" with the fixed value "1"
        "ExecutedVersion": $ver
    }'
else
    # Fallback if status was not captured correctly (should not happen now)
    echo "Could not capture invocation status. Check raw output:"
    echo "$INVOCATION_STATUS"
fi

echo ""

# Extract and display the actual Lambda return value (the success message)
echo "📝 Payload Response (Lambda Return Value):"
if [ -f "$OUTPUT_FILE" ]; then
    cat "$OUTPUT_FILE"
fi

echo ""
echo "🔎 Check LocalStack logs to verify the publication to SNS (topic: cardPaymentTopic)."

echo "=========================================================="
echo "✅ TEST COMPLETE"
echo "=========================================================="
