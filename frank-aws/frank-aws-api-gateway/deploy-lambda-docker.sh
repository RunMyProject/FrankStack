#!/bin/bash
# ==========================================================
# deploy-lambda-docker.sh
# -------------------------------------------------------
# Optimized Lambda deployment using dynamic JAR discovery
# - Discovers all JAR files in distribution directory  
# - Deploys each Lambda with appropriate configuration
# - Handles SNS topics and subscriptions automatically
# - No jq dependency - uses native bash JSON parsing
# - Pre-configured for Docker network environment
# - Logging to file for audit trail
#
# Author: Edoardo Sabatini
# Date: 23 October 2025
# ==========================================================

set -e

# -------------------------------------------------------
# 12-FACTOR 
# -------------------------------------------------------
ORCHESTRATOR_WEBHOOK_URL="http://172.17.0.1:8081/frankcallback/card-payment-complete"

# -------------------------------------------------------
# GLOBAL CONFIGURATION
# -------------------------------------------------------
DEPLOY_JAR_DIR="./jar_dist"
REGION="eu-central-1"
LOG_FILE="log.txt"

# Use Docker container name instead of localhost
ENDPOINT="http://frankstack-localstack:4566"
LOCALSTACK_INTERNAL_ENDPOINT="http://frankstack-localstack:4566"

ROLE="arn:aws:iam::000000000000:role/lambda-execute"
SNS_TOPIC="cardPaymentTopic"

# Configure AWS CLI for LocalStack (dummy credentials)
export AWS_ACCESS_KEY_ID="test"
export AWS_SECRET_ACCESS_KEY="test"
export AWS_DEFAULT_REGION="$REGION"
export AWS_PAGER=""  # 👈 DISABLE PAGER TO AVOID "less" ERRORS

# -------------------------------------------------------
# LOGGING FUNCTION
# -------------------------------------------------------
log_message() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local message="$1"
    echo "[$timestamp] $message" | tee -a "$LOG_FILE"
}

# -------------------------------------------------------
# JSON PARSING FUNCTIONS (jq alternatives)
# -------------------------------------------------------
extract_topic_arn() {
    grep -o '"TopicArn"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4
}

extract_subscription_arn() {
    grep -o '"SubscriptionArn"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4
}

# -------------------------------------------------------
# ERROR HANDLING FUNCTION
# -------------------------------------------------------
exit_on_error() {
    log_message "❌ ERROR: $1"
    exit 1
}

# -------------------------------------------------------
# LAMBDA DEPLOYMENT FUNCTION
# -------------------------------------------------------
deploy_lambda() {
    local jar_filename="$1"
    local jar_path="$2"
    
    log_message "🔍 Processing: $jar_filename"
    
    # Extract base name without extension
    local lambda_name="${jar_filename%.jar}"
    
    # Determine handler based on filename pattern
    local handler
    if [[ "$lambda_name" == *"producer"* ]]; then
        handler="com.frankaws.lambda.payment.card.producer.lambda.PaymentCardLambda::handleRequest"
    elif [[ "$lambda_name" == *"consumer"* ]]; then
        handler="com.frankaws.lambda.payment.card.consumer.lambda.PaymentCardLambda::handleRequest"
    else
        log_message "❌ Cannot determine handler for: $lambda_name"
        return 1
    fi
    
    # Cleanup old lambda if exists
    log_message "🗑️  Cleaning old Lambda: $lambda_name"
    aws --endpoint-url=$ENDPOINT lambda delete-function --function-name "$lambda_name" --region $REGION 2>/dev/null || true
    sleep 1
    
    # Deploy lambda
    log_message "🚀 Deploying: $lambda_name"
    
    # Prepare environment variables
    local env_vars="{}"
    if [[ "$lambda_name" == *"producer"* ]]; then
        env_vars="Variables={SNS_TOPIC_ARN=$TOPIC_ARN,AWS_ENDPOINT_URL=$LOCALSTACK_INTERNAL_ENDPOINT}"
    elif [[ "$lambda_name" == *"consumer"* ]]; then
        env_vars="Variables={ORCHESTRATOR_WEBHOOK_URL=$ORCHESTRATOR_WEBHOOK_URL}"
    fi
    
    aws --endpoint-url=$ENDPOINT lambda create-function \
        --function-name "$lambda_name" \
        --runtime java21 \
        --role $ROLE \
        --handler "$handler" \
        --zip-file "fileb://$jar_path" \
        --region $REGION \
        --timeout 30 \
        --memory-size 512 \
        --environment "$env_vars" \
        --output json > /dev/null || exit_on_error "Failed to deploy $lambda_name"
    
    log_message "✅ Deployed: $lambda_name"
    log_message "------------"
}

# -------------------------------------------------------
# SNS SUBSCRIPTION FUNCTION  
# -------------------------------------------------------
subscribe_consumer_to_sns() {
    local consumer_name="$1"
    
    log_message "🔗 Subscribing $consumer_name to SNS topic..."
    
    aws --endpoint-url=$ENDPOINT lambda add-permission \
        --function-name "$consumer_name" \
        --statement-id "sns-invocation-$consumer_name" \
        --action "lambda:InvokeFunction" \
        --principal "sns.amazonaws.com" \
        --source-arn "$TOPIC_ARN" \
        --region $REGION \
        --output json > /dev/null || log_message "⚠️  Permission might already exist"

    local subs_arn=$(aws --endpoint-url=$ENDPOINT sns subscribe \
        --topic-arn "$TOPIC_ARN" \
        --protocol lambda \
        --notification-endpoint "arn:aws:lambda:$REGION:000000000000:function:$consumer_name" \
        --region $REGION \
        --output json | extract_subscription_arn) || exit_on_error "Failed to subscribe $consumer_name to SNS"
        
    log_message "✅ Subscribed: $consumer_name ($subs_arn)"
}

# -------------------------------------------------------
# MAIN EXECUTION
# -------------------------------------------------------

# Initialize log file
echo "=== Lambda Deployment Log - $(date) ===" > "$LOG_FILE"

log_message "🚀 Lambda Deployment Optimized (Docker Network)"
log_message "==============================================="

# Check if dist directory exists
if [ ! -d "$DEPLOY_JAR_DIR" ]; then
    exit_on_error "Distribution directory not found: $DEPLOY_JAR_DIR"
fi

# Count JAR files
JAR_COUNT=$(find "$DEPLOY_JAR_DIR" -name "*.jar" | wc -l)
log_message "📦 Found $JAR_COUNT JAR files in $DEPLOY_JAR_DIR"

if [ "$JAR_COUNT" -eq 0 ]; then
    exit_on_error "No JAR files found for deployment"
fi

# -------------------------------------------------------
# SNS TOPIC PROVISIONING
# -------------------------------------------------------
log_message "☁️  Creating/retrieving SNS topic '$SNS_TOPIC'..."
TOPIC_ARN=$(aws --endpoint-url=$ENDPOINT sns create-topic --name $SNS_TOPIC --region $REGION --output json | extract_topic_arn) || exit_on_error "Failed to create SNS topic"
log_message "✅ SNS Topic ARN: $TOPIC_ARN"

# -------------------------------------------------------
# LAMBDA DEPLOYMENT LOOP
# -------------------------------------------------------
log_message ""
log_message "🔧 Deploying Lambda functions..."
log_message "================================"

for jar_file in "$DEPLOY_JAR_DIR"/*.jar; do
    if [ -f "$jar_file" ]; then
        filename=$(basename "$jar_file")
        deploy_lambda "$filename" "$jar_file"
    fi
done

# -------------------------------------------------------
# SNS SUBSCRIPTIONS
# -------------------------------------------------------
log_message ""
log_message "🔗 Configuring SNS subscriptions..."
log_message "==================================="

for jar_file in "$DEPLOY_JAR_DIR"/*.jar; do
    if [ -f "$jar_file" ]; then
        filename=$(basename "$jar_file")
        lambda_name="${filename%.jar}"
        
        if [[ "$lambda_name" == *"consumer"* ]]; then
            subscribe_consumer_to_sns "$lambda_name"
        fi
    fi
done

# -------------------------------------------------------
# VERIFICATION
# -------------------------------------------------------
log_message ""
log_message "📋 Deployment Verification"
log_message "=========================="

log_message ""
log_message "📋 Lambda functions:"
aws --endpoint-url=$ENDPOINT lambda list-functions --region $REGION --query "Functions[*].[FunctionName,Runtime,Handler]" --output table | tee -a "$LOG_FILE"

log_message ""
log_message "📋 SNS subscriptions for $SNS_TOPIC:"
aws --endpoint-url=$ENDPOINT sns list-subscriptions-by-topic --topic-arn $TOPIC_ARN --region $REGION --query "Subscriptions[*].[Protocol,Endpoint,SubscriptionArn]" --output table | tee -a "$LOG_FILE"

log_message ""
log_message "======================================================"
log_message "✅ DOCKER DEPLOYMENT COMPLETE - $JAR_COUNT functions deployed"
log_message "======================================================"

log_message "📄 Log saved to: $LOG_FILE"
