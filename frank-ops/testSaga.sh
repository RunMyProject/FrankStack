#!/bin/bash
# -----------------------
# Bash script to create a saga and stream SSE events
# -----------------------
# Author: Edoardo Sabatini
# Date: 05 October 2025

PORT=8081  # Change to 8080 if needed

# Sample JSON payload matching backend expectations
jsonPayload='{
  "user": {
    "username": "edoardo",
    "userId": "user123"
  },
  "fillForm": {
    "tripDeparture": "Rome",
    "tripDestination": "Milan",
    "dateTimeRoundTripDeparture": "2025-10-10T09:00:00",
    "dateTimeRoundTripReturn": "2025-10-12T18:00:00",
    "people": 1,
    "durationOfStayInDays": 2,
    "travelMode": "train",
    "budget": 300,
    "starsOfHotel": 3,
    "luggages": 1
  }
}'

# 1️⃣ POST request to create the saga
echo "🚀 Creating saga at port $PORT..."
response=$(curl -s -X POST http://localhost:$PORT/frankorchestrator \
  -H "Content-Type: application/json" \
  -d "$jsonPayload")

# 2️⃣ Display raw response for debugging
echo "📢 Raw response:"
echo "$response" | jq .

# 3️⃣ Extract sagaCorrelationId from response
sagaCorrelationId=$(echo "$response" | jq -r '.sagaCorrelationId // empty')

if [[ -z "$sagaCorrelationId" ]]; then
  echo "❌ Error: sagaCorrelationId not found. Check backend response."
  exit 1
fi

echo "🆔 Extracted sagaCorrelationId: $sagaCorrelationId"

# 4️⃣ Stream SSE events only if sagaCorrelationId is valid
echo "🌊 Streaming saga events from port $PORT..."
curl -N http://localhost:$PORT/frankorchestrator/$sagaCorrelationId/stream
echo
# -----------------------
# End of script
