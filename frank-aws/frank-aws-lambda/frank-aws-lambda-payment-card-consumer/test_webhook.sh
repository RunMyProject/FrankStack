#!/bin/bash
# test_webhook.sh
# -----------------------
# Simple test script to POST a sample payload to the Frank Orchestrator
# callback endpoint for card payment completion.
# This is useful to simulate webhook calls and test the saga flow.
#
# Author: Edoardo Sabatini
# Date: 16 October 2025
# ==========================================================

echo "Testing webhook..."

# POST request to the orchestrator callback endpoint
curl -X POST http://localhost:8081/frankcallback/card-payment-complete \
  -H "Content-Type: application/json" \
  -d '{
    "sagaCorrelationId": "borg-log-corr-1760648362",
    "status": "PROCESSING",
    "context": {
      "total": 1250.75
    }
  }'

echo "Webhook test completed."

