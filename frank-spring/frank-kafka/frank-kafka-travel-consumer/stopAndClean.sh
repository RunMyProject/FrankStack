#!/bin/bash
# ================================================================
# stopAndClean.sh
# Stop and remove frank-kafka-travel-consumer  + delete image
# Author: Edoardo Sabatini
# Date: 21 October 2025
# ================================================================

echo "Stopping frank-kafka-travel-consumer container..."
docker stop frank-kafka-travel-consumer 2>/dev/null

echo "Removing frank-kafka-travel-consumer container..."
docker rm frank-kafka-travel-consumer 2>/dev/null

echo "Removing frank-kafka-travel-consumer image..."
docker rmi frank-kafka-travel-consumer 2>/dev/null

echo "Cleanup complete!"
docker ps -a
docker images | grep frank-kafka-travel-consumer
