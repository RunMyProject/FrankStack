#!/bin/bash
# -----------------------------------------------------------------------------
# test_dynamodb_complete.sh
# AWS DynamoDB test script on LocalStack
# Demonstrates full flow: create table -> put item -> get item
# Author: Edoardo Sabatini
# Date: 14/10/2025
# -----------------------------------------------------------------------------

# ------------------------------
# VARIABLES
# ------------------------------
ENDPOINT="http://localhost:4566"
TABLE_NAME="demo-invoices-table"
PRIMARY_KEY="InvoiceID"
ITEM_ID="INV-001"
ITEM_CONTENT="{\"Customer\":\"Edoardo\",\"Amount\":100.0,\"Status\":\"Pending\"}"

# ------------------------------
# CHECK LOCALSTACK
# ------------------------------
if docker ps --filter "name=localstack" --filter "status=running" | grep -q localstack; then
  echo "✔ LocalStack is active in Docker"
else
  echo "❌ LocalStack is not running. Start the container first."
  exit 1
fi
echo "----------------------------------------"

# ------------------------------
# CREATE DYNAMODB TABLE
# ------------------------------
echo "🪑 Creating DynamoDB table: $TABLE_NAME"
aws --endpoint-url=$ENDPOINT dynamodb create-table \
    --table-name $TABLE_NAME \
    --attribute-definitions AttributeName=$PRIMARY_KEY,AttributeType=S \
    --key-schema AttributeName=$PRIMARY_KEY,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST >/dev/null
echo "✅ Table created: $TABLE_NAME"
echo "----------------------------------------"

# ------------------------------
# LIST EXISTING TABLES
# ------------------------------
echo "📋 Listing all DynamoDB tables..."
aws --endpoint-url=$ENDPOINT dynamodb list-tables
echo "----------------------------------------"

# ------------------------------
# PUT ITEM INTO TABLE
# ------------------------------
echo "📥 Inserting demo item into table $TABLE_NAME..."
aws --endpoint-url=$ENDPOINT dynamodb put-item \
    --table-name $TABLE_NAME \
    --item "{\"$PRIMARY_KEY\":{\"S\":\"$ITEM_ID\"},\"Customer\":{\"S\":\"Edoardo\"},\"Amount\":{\"N\":\"100.0\"},\"Status\":{\"S\":\"Pending\"}}"
echo "✅ Item inserted: $ITEM_ID"
echo "----------------------------------------"

# ------------------------------
# GET ITEM FROM TABLE
# ------------------------------
echo "📄 Retrieving item from table $TABLE_NAME..."
aws --endpoint-url=$ENDPOINT dynamodb get-item \
    --table-name $TABLE_NAME \
    --key "{\"$PRIMARY_KEY\":{\"S\":\"$ITEM_ID\"}}"
echo "----------------------------------------"

echo "🎉 Complete demo of DynamoDB finished!"

