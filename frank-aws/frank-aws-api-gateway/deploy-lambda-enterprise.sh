#!/bin/bash
# ==========================================================
# deploy-lambda-enterprise.sh
# -------------------------------------------------------
# Enterprise deployment script for PaymentCardLambda microservices
# - Producer + Consumer deployment to LocalStack
# - Maven build, Lambda creation, SNS provisioning & subscription
#
# Author: Edoardo Sabatini
# Date: 22 October 2025
# ==========================================================

set -e

# -------------------------------------------------------
# GLOBAL CONFIGURATION
# -------------------------------------------------------
REGION="eu-central-1"
ENDPOINT="http://localhost:4566"
LOCALSTACK_INTERNAL_ENDPOINT="http://172.17.0.1:4566"
ROLE="arn:aws:iam::000000000000:role/lambda-execute"

# Base path to lambda modules (relative to api-gateway)
LAMBDA_BASE="../frank-aws-lambda"

# Producer config
PROD_NAME="PaymentCardLambda"
PROD_HANDLER="com.frankaws.lambda.payment.card.producer.lambda.PaymentCardLambda::handleRequest"
PROD_MODULE="$LAMBDA_BASE/frank-aws-lambda-payment-card-producer"
PROD_JAR="$PROD_MODULE/target/frank-aws-lambda-payment-card-producer-0.0.1-SNAPSHOT.jar"
SNS_TOPIC="cardPaymentTopic"

# Consumer config
CONS_NAME="PaymentCardConsumerLambda"
CONS_HANDLER="com.frankaws.lambda.payment.card.consumer.lambda.PaymentCardLambda::handleRequest"
CONS_MODULE="$LAMBDA_BASE/frank-aws-lambda-payment-card-consumer"
CONS_JAR="$CONS_MODULE/target/frank-aws-lambda-payment-card-consumer-0.0.1-SNAPSHOT.jar"
ORCHESTRATOR_WEBHOOK_URL="http://10.154.77.11:8081/frankcallback/card-payment-complete"

# -------------------------------------------------------
# CLEANUP OLD LAMBDAS
# -------------------------------------------------------
echo "🗑️  Cleaning old Lambdas..."
aws --endpoint-url=$ENDPOINT lambda delete-function --function-name $PROD_NAME --region $REGION 2>/dev/null || true
aws --endpoint-url=$ENDPOINT lambda delete-function --function-name $CONS_NAME --region $REGION 2>/dev/null || true
sleep 1

# -------------------------------------------------------
# BUILD PHASE
# -------------------------------------------------------
echo "📦 Building Producer..."
(cd "$PROD_MODULE" && mvn clean package -Dmaven.test.skip=true -q)
if [ ! -f "$PROD_JAR" ]; then
    echo "❌ Producer JAR not found!"
    exit 1
fi
echo "✅ Producer build successful"

echo "📦 Building Consumer..."
(cd "$CONS_MODULE" && mvn clean package -Dmaven.test.skip=true -q)
if [ ! -f "$CONS_JAR" ]; then
    echo "❌ Consumer JAR not found!"
    exit 1
fi
echo "✅ Consumer build successful"

# -------------------------------------------------------
# SNS TOPIC PROVISIONING
# -------------------------------------------------------
echo "☁️  Creating/retrieving SNS topic '$SNS_TOPIC'..."
TOPIC_ARN=$(aws --endpoint-url=$ENDPOINT sns create-topic --name $SNS_TOPIC --region $REGION --output json | jq -r '.TopicArn')
echo "✅ SNS Topic ARN: $TOPIC_ARN"

# -------------------------------------------------------
# DEPLOY PRODUCER LAMBDA
# -------------------------------------------------------
echo "🚀 Deploying Producer Lambda..."
aws --endpoint-url=$ENDPOINT lambda create-function \
    --function-name $PROD_NAME \
    --runtime java21 \
    --role $ROLE \
    --handler $PROD_HANDLER \
    --zip-file fileb://$PROD_JAR \
    --region $REGION \
    --timeout 30 \
    --memory-size 512 \
    --environment Variables="{SNS_TOPIC_ARN=$TOPIC_ARN,AWS_ENDPOINT_URL=$LOCALSTACK_INTERNAL_ENDPOINT}" \
    --output json > /dev/null
echo "✅ Producer deployed!"

# -------------------------------------------------------
# DEPLOY CONSUMER LAMBDA
# -------------------------------------------------------
echo "🚀 Deploying Consumer Lambda..."
aws --endpoint-url=$ENDPOINT lambda create-function \
    --function-name $CONS_NAME \
    --runtime java21 \
    --role $ROLE \
    --handler $CONS_HANDLER \
    --zip-file fileb://$CONS_JAR \
    --region $REGION \
    --timeout 30 \
    --memory-size 512 \
    --environment Variables="{ORCHESTRATOR_WEBHOOK_URL=$ORCHESTRATOR_WEBHOOK_URL}" \
    --output json > /dev/null
echo "✅ Consumer deployed!"

# -------------------------------------------------------
# SUBSCRIBE CONSUMER TO SNS TOPIC
# -------------------------------------------------------
echo "🔗 Subscribing Consumer to SNS topic..."
aws --endpoint-url=$ENDPOINT lambda add-permission \
    --function-name $CONS_NAME \
    --statement-id "sns-invocation-permission" \
    --action "lambda:InvokeFunction" \
    --principal "sns.amazonaws.com" \
    --source-arn $TOPIC_ARN \
    --region $REGION \
    --output json > /dev/null

SUBS_ARN=$(aws --endpoint-url=$ENDPOINT sns subscribe \
    --topic-arn $TOPIC_ARN \
    --protocol lambda \
    --notification-endpoint "arn:aws:lambda:$REGION:000000000000:function:$CONS_NAME" \
    --region $REGION \
    --output json | jq -r '.SubscriptionArn')
echo "✅ Consumer subscribed to SNS ($SUBS_ARN)"

# -------------------------------------------------------
# VERIFICATION
# -------------------------------------------------------
echo ""
echo "📋 Lambda functions:"
aws --endpoint-url=$ENDPOINT lambda list-functions --region $REGION --query "Functions[*].[FunctionName,Runtime,Handler]" --output table
echo ""
echo "📋 SNS subscriptions for $SNS_TOPIC:"
aws --endpoint-url=$ENDPOINT sns list-subscriptions-by-topic --topic-arn $TOPIC_ARN --region $REGION --query "Subscriptions[*].[Protocol,Endpoint,SubscriptionArn]" --output table

echo ""
echo "=========================================================="
echo "✅ ENTERPRISE DEPLOYMENT COMPLETE"
echo "=========================================================="
