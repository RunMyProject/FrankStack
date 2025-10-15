#!/bin/bash
# ==========================================================
# deploy-lambda.sh
# -------------------------------------------------------
# Script to build and deploy PaymentCardLambda to LocalStack
#
# FEATURES:
# - Compiles the project with Maven (skips tests)
# - Packages the Lambda JAR with all dependencies
# - Creates or updates the Lambda function in LocalStack
# - Configures SNS topic and IAM role automatically
# - Configured for PaymentCard producer microservice
#
# Author: Edoardo Sabatini
# Date: 15 October 2025
# ==========================================================

set -e

# -------------------------------------------------------
# CONFIGURATION
# -------------------------------------------------------
LAMBDA_NAME="PaymentCardLambda"
HANDLER="com.frankaws.lambda.payment.card.producer.lambda.PaymentCardLambda::handleRequest"
RUNTIME="java21"
JAR="target/frank-aws-lambda-payment-card-producer-0.0.1-SNAPSHOT.jar"
ROLE="arn:aws:iam::000000000000:role/lambda-execute"
REGION="eu-central-1"
ENDPOINT="http://localhost:4566"  # Endpoint per la CLI esterna (deploy)
SNS_TOPIC="cardPaymentTopic"

# CONFIGURAZIONE CORRETTA DELL'ENDPOINT INTERNO (IP del bridge Docker per l'Host Linux)
LOCALSTACK_INTERNAL_ENDPOINT="http://172.17.0.1:4566"

# -------------------------------------------------------
# BUILD PHASE
# -------------------------------------------------------
echo "📦 Building project with Maven..."
mvn clean package -Dmaven.test.skip=true -q

if [ ! -f "$JAR" ]; then
    echo "❌ JAR file not found: $JAR"
    exit 1
fi

echo "✅ Build successful"

# -------------------------------------------------------
# RESOURCE PROVISIONING PHASE (CREA IL TOPIC SNS)
# -------------------------------------------------------
echo "☁️  Provisioning SNS Topic '$SNS_TOPIC'..."

# 1. Crea il topic SNS (se esiste già, LocalStack risponde senza errore)
TOPIC_ARN_OUTPUT=$(aws --endpoint-url=$ENDPOINT sns create-topic \
    --name $SNS_TOPIC \
    --region $REGION \
    --output json)

# 2. Estrae l'ARN generato (richiede 'jq' installato)
TOPIC_ARN=$(echo $TOPIC_ARN_OUTPUT | jq -r '.TopicArn')

if [ -z "$TOPIC_ARN" ] || [ "$TOPIC_ARN" == "null" ]; then
    echo "❌ Failed to retrieve Topic ARN. Aborting deployment. Is 'jq' installed?"
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
# DEPLOYMENT PHASE
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
    --environment Variables="{SNS_TOPIC_ARN=$TOPIC_ARN,AWS_ENDPOINT_URL=$LOCALSTACK_INTERNAL_ENDPOINT}" \
    --output json > /dev/null

echo "✅ Lambda deployed successfully!"

# -------------------------------------------------------
# VERIFICATION PHASE
# -------------------------------------------------------
echo ""
echo "📋 Lambda Functions on LocalStack:"
echo "=========================================================="
aws --endpoint-url=$ENDPOINT lambda list-functions \
    --region $REGION \
    --query "Functions[*].[FunctionName,Runtime,Handler]" \
    --output table

echo ""
echo "=========================================================="
echo "✅ DEPLOYMENT COMPLETE"
echo "=========================================================="
