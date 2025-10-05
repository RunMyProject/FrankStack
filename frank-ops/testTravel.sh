#!/bin/bash
# -----------------------
# Script to test the Travel microservice in FrankStack Travel AI
# -----------------------
# Author: Edoardo Sabatini
# Date: 05 October 2025
#
# Notes:
# - Sends a test BookingMessage to the /kafka/send endpoint
# - Ensures the SagaStatus is valid for deserialization
# - Port is configurable
# -----------------------

PORT=8081  # Change if Travel Producer runs on a different port

# ✅ Correct test JSON payload
jsonPayload='{
  "sagaCorrelationId": "test123",
  "user": {"username": "edoardo", "userId": "user123"},
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
  },
  "status": "CREATED"
}'

echo "🚀 Sending test BookingMessage to Travel Producer on port $PORT..."
response=$(curl -s -X POST http://localhost:$PORT/kafka/send \
  -H "Content-Type: application/json" \
  -d "$jsonPayload")

# Display raw response
echo "📢 Response from Travel Producer:"
echo "$response"
echo
