# testTravel.sh
# -----------------------
# Script to test the Travel microservice in FrankStack Travel AI
#
# NOTES:
# - Sends a test message to the /send endpoint of the Travel Producer microservice
# - Useful for verifying that Kafka messages are being produced correctly
# - Can be extended to test other endpoints or payloads
#
# Author: Edoardo Sabatini
# Date: 02 October 2025
#
curl -X GET http://localhost:8082/send?msg=test_travel
echo
echo "Test message sent to Travel microservice"
echo
