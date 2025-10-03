#!/bin/bash
# -----------------------
# Bash script to create a saga and stream SSE events
# Easily switch the target port by modifying the PORT variable
# -----------------------
# Author: Edoardo Sabatini
# Date: 03 October 2025

# ⚡ Quick port configuration
PORT=8081  # Change to 8080 if needed

# 1️⃣ POST to create the saga and capture the response
echo "🚀 Creating saga at port $PORT..."
response=$(curl -s -X POST http://localhost:$PORT/frankorchestrator \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello",
    "test": "World!"
  }')

# 2️⃣ Pretty print JSON response using jq
echo "$response" | jq

# 3️⃣ Extract sagaId from JSON response
sagaId=$(echo "$response" | jq -r '.sagaId')
echo "🆔 Extracted sagaId: $sagaId"

# 4️⃣ GET SSE using the captured sagaId
echo "🌊 Streaming saga events from port $PORT..."
curl -N http://localhost:$PORT/frankorchestrator/$sagaId/stream
echo  # New line after SSE stream ends
# -----------------------
# End of script
