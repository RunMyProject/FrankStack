#!/bin/bash
# ==========================================================
# lambda-java-logs.sh
# Lista Lambda, pubblica test SNS, mostra log Java
#
# Author: Edoardo Sabatini
# Date: 28 October 2025
# ==========================================================

echo "lambda-java-logs.sh v. 2.00"

# Crea topic
aws --endpoint-url=http://localhost:4566 \
    --region eu-central-1 \
    sns create-topic \
    --name frank-card-payment-topic

# Sottoscrivi Lambda
aws --endpoint-url=http://localhost:4566 \
    --region eu-central-1 \
    sns subscribe \
    --topic-arn "arn:aws:sns:eu-central-1:000000000000:frank-card-payment-topic" \
    --protocol lambda \
    --notification-endpoint "arn:aws:lambda:eu-central-1:000000000000:function:frank-aws-lambda-payment-card-consumer"

# Verifica topic creato
aws --endpoint-url=http://localhost:4566 --region eu-central-1 sns list-topics

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

ENDPOINT="http://localhost:4566"
REGION="eu-central-1"
TOPIC_ARN="arn:aws:sns:eu-central-1:000000000000:frank-card-payment-topic"
LAMBDA_NAME="frank-aws-lambda-payment-card-consumer"
LOG_GROUP="/aws/lambda/$LAMBDA_NAME"

echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  📋 Lambda Java Logs - Test & View${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo ""

# ============================================================================
# STEP 1: Lista funzioni Lambda
# ============================================================================
echo -e "${YELLOW}STEP 1: Lista Funzioni Lambda${NC}"
aws --endpoint-url=$ENDPOINT lambda list-functions --region $REGION \
    --query "Functions[*].[FunctionName,Runtime,Handler]" --output table
echo ""

# ============================================================================
# STEP 2: Pulizia Log Group (per test pulito)
# ============================================================================
echo -e "${YELLOW}STEP 2: Pulizia Log Group${NC}"
echo "🗑️  Deleting old Log Group for clean test..."
aws --endpoint-url=$ENDPOINT logs delete-log-group \
    --log-group-name $LOG_GROUP \
    --region $REGION 2>/dev/null || true
echo -e "${GREEN}✅ Log group cleaned${NC}"
echo ""

# ============================================================================
# STEP 3: Wait Lambda Active
# ============================================================================
echo -e "${YELLOW}STEP 3: Verifica Lambda Attiva${NC}"
echo "⏳ Waiting for Lambda to be active..."
aws --endpoint-url=$ENDPOINT lambda wait function-active-v2 \
    --function-name $LAMBDA_NAME \
    --region $REGION
echo -e "${GREEN}✅ Lambda is active${NC}"
echo ""

# ============================================================================
# STEP 4: Crea Log Stream
# ============================================================================
LOG_STREAM="test-stream-$(date +%s)"
aws --endpoint-url=$ENDPOINT logs create-log-stream \
    --log-group-name $LOG_GROUP \
    --log-stream-name $LOG_STREAM \
    --region $REGION 2>/dev/null || true

# ============================================================================
# STEP 5: Pubblica messaggio SNS di test
# ============================================================================
echo -e "${YELLOW}STEP 4: Pubblicazione Messaggio Test SNS${NC}"

CORR_ID="test-saga-$(date +%s)"
MESSAGE=$(cat <<EOF
{
  "sagaCorrelationId": "$CORR_ID",
  "status": "PROCESSING",
  "myStripeToken": "tok_test_${RANDOM}",
  "context": {
    "total": 456.78,
    "currency": "USD",
    "cardHolder": "Edoardo Sabatini",
    "invoiceNumber": "INV-$CORR_ID",
    "travelId": "travel-123",
    "hotelId": "hotel-456"
  }
}
EOF
)

echo -e "${CYAN}📤 Publishing to SNS...${NC}"
echo -e "${CYAN}Correlation ID: $CORR_ID${NC}"

aws --endpoint-url=$ENDPOINT sns publish \
    --topic-arn $TOPIC_ARN \
    --message "$MESSAGE" \
    --region $REGION > /dev/null

echo -e "${GREEN}✅ Message published${NC}"
echo ""

# ============================================================================
# STEP 6: Wait per elaborazione + flush log
# ============================================================================
echo -e "${YELLOW}STEP 6: Attesa Elaborazione Lambda${NC}"
echo "🐌 Waiting 10 seconds for Lambda processing and log flush..."
for i in {10..1}; do
    echo -ne "\r   ⏰ $i seconds remaining...  "
    sleep 1
done
echo -e "\r${GREEN}✅ Wait completed${NC}                    "
echo ""

# ============================================================================
# STEP 7: Mostra Log Java dalla Lambda
# ============================================================================
echo -e "${YELLOW}STEP 7: Log Java - PaymentCardLambda${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"

# Prova prima con AWS CloudWatch Logs
echo -e "${CYAN}📋 Fetching logs from CloudWatch...${NC}"
LOGS_OUTPUT=$(aws --endpoint-url=$ENDPOINT logs filter-log-events \
    --log-group-name $LOG_GROUP \
    --limit 100 \
    --region $REGION 2>/dev/null | jq -r '.events[].message' || echo "")

if [ -n "$LOGS_OUTPUT" ]; then
    echo "$LOGS_OUTPUT"
else
    echo -e "${YELLOW}⚠️  No logs in CloudWatch yet, trying Docker container...${NC}"
    echo ""
    
    # Fallback: cerca container Docker
    CONTAINER_ID=$(docker ps -a --filter "name=payment-card-consumer" --format "{{.ID}}" | head -1)
    
    if [ -z "$CONTAINER_ID" ]; then
        CONTAINER_ID=$(docker ps -a --filter "name=lambda" --filter "name=consumer" --format "{{.ID}}" | head -1)
    fi
    
    if [ -n "$CONTAINER_ID" ]; then
        echo -e "${GREEN}✅ Container found: ${CYAN}$CONTAINER_ID${NC}"
        echo -e "${CYAN}📋 Docker logs:${NC}"
        echo -e "${CYAN}────────────────────────────────────────────────────────────${NC}"
        docker logs $CONTAINER_ID 2>&1
    else
        echo -e "${RED}❌ No logs found (CloudWatch or Docker)${NC}"
        echo -e "${YELLOW}💡 Lambda might not have been invoked yet${NC}"
    fi
fi

echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"

# ============================================================================
# STEP 8: Verifica S3 Invoice
# ============================================================================
echo ""
echo -e "${YELLOW}STEP 8: Verifica Invoice su S3${NC}"
echo -e "${CYAN}🔍 Checking S3 bucket for invoice...${NC}"

BUCKET_NAME="frank-aws-invoices"
INVOICE_PATH="invoices/$CORR_ID/"

sleep 2  # Extra wait for S3

S3_FILES=$(aws --endpoint-url=$ENDPOINT s3 ls s3://$BUCKET_NAME/$INVOICE_PATH 2>/dev/null || echo "")

if [ -n "$S3_FILES" ]; then
    echo -e "${GREEN}✅ Invoice found in S3:${NC}"
    echo "$S3_FILES"
    echo ""
    echo -e "${CYAN}🔗 Invoice URLs:${NC}"
    echo -e "   📝 Text: ${GREEN}http://localhost:4566/$BUCKET_NAME/${INVOICE_PATH}invoice.txt${NC}"
    echo -e "   📋 JSON: ${GREEN}http://localhost:4566/$BUCKET_NAME/${INVOICE_PATH}invoice.json${NC}"
    echo ""
    echo -e "${CYAN}📄 Invoice Content:${NC}"
    aws --endpoint-url=$ENDPOINT s3 cp s3://$BUCKET_NAME/${INVOICE_PATH}invoice.txt - 2>/dev/null || echo "   (could not retrieve)"
else
    echo -e "${RED}❌ Invoice not found in S3${NC}"
fi

echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Test complete - Correlation ID: $CORR_ID${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
