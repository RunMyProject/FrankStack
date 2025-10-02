# testHotel.sh
# -----------------------
# Script to test the Hotel microservice in FrankStack Travel AI
#
# NOTES:
# - Sends a test message to the /send endpoint of the Hotel Producer microservice
# - Useful for verifying that Kafka messages are being produced correctly
# - Can be extended to test other endpoints or payloads
#
# Author: Edoardo Sabatini
# Date: 02 October 2025

curl -X GET http://localhost:8086/send?msg=test_hotel
echo
echo "Sent test message to Hotel Producer"
echo
