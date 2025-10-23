#!/bin/bash
# ================================================================
# stopAndClean.sh
# Stop and remove frank-aws-service-payment-card
#
# Author: Edoardo Sabatini
# Date: 23 October 2025
# ================================================================

echo "Stopping frank-aws-service-payment-card container..."
docker stop frank-aws-service-payment-card 2>/dev/null

echo "Removing frank-aws-service-payment-card..."
docker rm frank-aws-service-payment-card 2>/dev/null

echo "Removing frank-aws-service-payment-card image..."
docker rmi frank-aws-service-payment-card 2>/dev/null

echo "Cleanup complete!"
docker ps -a
docker images | grep frank-aws-service-payment-card
