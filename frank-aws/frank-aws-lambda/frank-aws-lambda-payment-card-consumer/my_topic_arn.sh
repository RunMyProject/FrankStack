#!/bin/bash
# my_topic_arn.sh
# ----------------------------------------

# Author: Edoardo Sabatini  
# Date: 29 October 2025
# ==========================================================
# Script to create an SNS topic in LocalStack and get its ARN

extract_topic_arn() {
    grep -o '"TopicArn"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4
}

# ENDPOINT="http://frankstack-localstack:4566"
ENDPOINT="http://localhost:4566"
SNS_TOPIC=cardPaymentTopic
REGION="eu-central-1"

MY_TOPIC_ARN=$(aws --endpoint-url=$ENDPOINT sns create-topic --name $SNS_TOPIC --region $REGION --output json | extract_topic_arn) || exit_on_error "Failed to create SNS topic"

echo $MY_TOPIC_ARN
# ==========================================================
