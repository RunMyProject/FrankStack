#!/bin/bash
# ================================================================
# Test Frank AWS API Gateway Lambda 
# ------------------------------------------------
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
