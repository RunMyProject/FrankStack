#!/bin/bash
# ================================================================
# Frank AWS Lambda Test Wrapper Script
# ------------------------------------------------
# PURPOSE:
#   Simulates concurrent REST API calls to local API Gateway
#   endpoints for testing AWS Lambda producers (cardpayment).
#
# DESCRIPTION:
#   - Invokes two local API Gateway instances running on different ports.
#   - Each endpoint triggers the CardPayment Lambda producer via POST request.
#   - Sends mock payment data (Stripe token, travelId, amount, etc.)
#   - Used for local integration testing with LocalStack SNS/SQS.
#
# NOTES:
#   • Port 18082 → First producer instance
#   • Port 18081 → Second producer instance
#   • Output confirms message publication with SNS Message ID
#   • Intended for parallel invocation testing (non-blocking I/O)
#
#
# Author: Edoardo Sabatini
# Date: 23 October 2025
# ================================================================

echo "🔥🔥🔥 Started wrapper on AWS API GATEWAY: 18081 🔥🔥🔥";

curl -X POST \
     http://localhost:18081/cardpayment/send \
     -H 'Content-Type: application/json' \
     -d '{
         "sagaCorrelationId": "test-from-rest-api-1024", 
         "myStripeToken": "tok_visa_4242",
         "status": "CREATED",
         "context": {
             "travelId": "TRV-9876",
             "hotelId": null,
             "total": 550.99
         }
     }'
echo "--------------------------"
docker-compose logs -f frankstack-aws-service-payment-card
echo done.
