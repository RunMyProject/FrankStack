#!/bin/bash
# ==========================================================
# deploy-lambda.sh
# -------------------------------------------------------
# Script to build and deploy PaymentCardLambda (Consumer) to LocalStack
#
# FEATURES:
# - Compiles the Consumer project
# - Packages the Lambda JAR
# - Creates or updates the Lambda function in LocalStack
# - Subscribes the Lambda to the existing 'cardPaymentTopic' SNS topic
#
# Author: Edoardo Sabatini
# Date: 16 October 2025
# ==========================================================

set -e

# -------------------------------------------------------
# CONFIGURATION
# -------------------------------------------------------
MODULE_DIR="."
ARTIFACT_ID="frank-aws-lambda-payment-card-consumer" 

LAMBDA_NAME="PaymentCardConsumerLambda" 
HANDLER="com.frankaws.lambda.payment.card.consumer.lambda.PaymentCardLambda::handleRequest"
RUNTIME="java21"
JAR="target/$ARTIFACT_ID-0.0.1-SNAPSHOT.jar" 

ROLE="arn:aws:iam::000000000000:role/lambda-execute"
REGION="eu-central-1"
ENDPOINT="http://localhost:4566"
SNS_TOPIC="cardPaymentTopic"

# -------------------------------------------------------
# BEST PRACTICE: Externalized configuration (12-Factor App)
# -------------------------------------------------------
# Using an environment variable to inject the orchestrator callback URL
# instead of hardcoding it in the application.yml or the codebase.
# This allows different values for dev/staging/prod environments
# without recompiling the JAR or changing source files.

# ORCHESTRATOR_WEBHOOK_URL="http://localhost:8081/frankcallback/card-payment-complete"
ORCHESTRATOR_WEBHOOK_URL=http://10.154.77.11:8081/frankcallback/card-payment-complete
 
echo "Consumer Lambda is symbolically mapped to port 18083, but deployed to LocalStack."

# -------------------------------------------------------
# BUILD PHASE
# -------------------------------------------------------
echo "📦 Building consumer project with Maven (compiling models and Jackson)..."
mvn clean package -Dmaven.test.skip=true -q

if [ ! -f "$JAR" ]; then
    echo "❌ JAR file not found: $JAR"
    exit 1
fi
echo "✅ Build successful"

# -------------------------------------------------------
# RESOURCE RETRIEVAL PHASE (FETCH TOPIC ARN)
# -------------------------------------------------------
echo "☁️  Retrieving ARN for SNS Topic '$SNS_TOPIC'..."

TOPIC_ARN_OUTPUT=$(aws --endpoint-url=$ENDPOINT sns list-topics \
    --region $REGION \
    --query "Topics[?contains(TopicArn, '$SNS_TOPIC')].TopicArn" \
    --output text)

TOPIC_ARN=$(echo $TOPIC_ARN_OUTPUT | awk '{print $1}')

if [ -z "$TOPIC_ARN" ]; then
    echo "❌ Failed to retrieve Topic ARN for '$SNS_TOPIC'. Ensure the producer has run its deploy script."
    exit 1
fi

echo "✅ Topic ARN: $TOPIC_ARN"

# -------------------------------------------------------
# CLEANUP PHASE
# -------------------------------------------------------
echo "🗑️  Removing old Lambda function..."
aws --endpoint-url=$ENDPOINT lambda delete-function \
    --function-name $LAMBDA_NAME \
    --region $REGION 2>/dev/null || true
sleep 1

# -------------------------------------------------------
# DEPLOYMENT PHASE (CREATE FUNCTION)
# -------------------------------------------------------
echo "🚀 Deploying Lambda to LocalStack..."
aws --endpoint-url=$ENDPOINT lambda create-function \
    --function-name $LAMBDA_NAME \
    --runtime $RUNTIME \
    --role $ROLE \
    --handler $HANDLER \
    --zip-file fileb://$JAR \
    --region $REGION \
    --timeout 30 \
    --memory-size 512 \
    --environment Variables="{ORCHESTRATOR_WEBHOOK_URL=$ORCHESTRATOR_WEBHOOK_URL}" \
    --output json > /dev/null

echo "✅ Consumer Lambda deployed successfully!"

# -------------------------------------------------------
# SUBSCRIPTION PHASE (SUBSCRIBE TO SNS TOPIC)
# -------------------------------------------------------
echo "🔗 Subscribing Lambda '$LAMBDA_NAME' to SNS Topic '$SNS_TOPIC'..."

aws --endpoint-url=$ENDPOINT lambda add-permission \
    --function-name $LAMBDA_NAME \
    --statement-id "sns-invocation-permission" \
    --action "lambda:InvokeFunction" \
    --principal "sns.amazonaws.com" \
    --source-arn $TOPIC_ARN \
    --region $REGION \
    --output json > /dev/null

SUBSCRIPTION_ARN_OUTPUT=$(aws --endpoint-url=$ENDPOINT sns subscribe \
    --topic-arn $TOPIC_ARN \
    --protocol lambda \
    --notification-endpoint "arn:aws:lambda:$REGION:000000000000:function:$LAMBDA_NAME" \
    --region $REGION \
    --output json)

SUBSCRIPTION_ARN=$(echo $SUBSCRIPTION_ARN_OUTPUT | jq -r '.SubscriptionArn')

if [ -z "$SUBSCRIPTION_ARN" ] || [ "$SUBSCRIPTION_ARN" == "null" ]; then
    echo "❌ Failed to subscribe Lambda to SNS Topic. Is 'jq' installed?"
    exit 1
fi

echo "✅ Lambda successfully subscribed (ARN: $SUBSCRIPTION_ARN)"

# -------------------------------------------------------
# VERIFICATION PHASE
# -------------------------------------------------------
echo ""
echo "📋 Subscriptions on LocalStack for $SNS_TOPIC:"
echo "=========================================================="
aws --endpoint-url=$ENDPOINT sns list-subscriptions-by-topic \
    --topic-arn $TOPIC_ARN \
    --region $REGION \
    --query "Subscriptions[*].[Protocol,Endpoint,SubscriptionArn]" \
    --output table

echo ""
echo "=========================================================="
echo "✅ CONSUMER DEPLOYMENT COMPLETE"
echo "=========================================================="
