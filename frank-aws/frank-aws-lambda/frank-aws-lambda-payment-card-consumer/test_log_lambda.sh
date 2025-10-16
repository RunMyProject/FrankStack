#!/bin/bash
# test_log_lambda.sh
#############################

set -e

ENDPOINT="http://localhost:4566"
REGION="eu-central-1"
TOPIC_ARN="arn:aws:sns:eu-central-1:000000000000:cardPaymentTopic"

# Messaggio esempio
CORR_ID="test-corr-id-$(date +%s)"
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

echo "🚀 Publishing to SNS topic..."
aws --endpoint-url=$ENDPOINT sns publish \
    --topic-arn $TOPIC_ARN \
    --message "$MESSAGE" \
    --region $REGION

echo "✅ Published. Waiting 2s for Lambda to process..."
sleep 2

echo "🔎 Fetching logs..."
aws --endpoint-url=$ENDPOINT logs filter-log-events \
    --log-group-name /aws/lambda/PaymentCardConsumerLambda \
    --limit 5

