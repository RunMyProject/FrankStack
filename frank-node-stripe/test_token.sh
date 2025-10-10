#!/bin/bash
#
# test_token.sh
# -------------------------
# Quick test script for MyStripeServer.
# Sends a POST request to retrieve a payment token.
#
# Author: Edoardo Sabatini
# Date: 10 October 2025
#

API_URL="http://localhost:4000/getToken"

echo "🚀 Testing MyStripeServer token endpoint..."
echo "👉 Sending request to $API_URL"

# Send POST request and extract token using jq
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"lastFourDigits":"4242","cardType":"Visa"}')

TOKEN=$(echo "$RESPONSE" | jq -r '.token')

# Display results
if [[ "$TOKEN" != "null" && -n "$TOKEN" ]]; then
  echo "✅ Token received: $TOKEN"
else
  echo "❌ No token returned or error in response:"
  echo "$RESPONSE"
fi

echo "🧩 Test completed."
