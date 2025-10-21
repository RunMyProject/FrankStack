#!/bin/bash
# ================================================================
# stopAndClean.sh
# Stop and remove frank-kafka-hotel-consumer  + delete image
# Author: Edoardo Sabatini
# Date: 21 October 2025
# ================================================================

echo "Stopping frank-kafka-hotel-consumer container..."
docker stop frank-kafka-hotel-consumer 2>/dev/null

echo "Removing frank-kafka-hotel-consumer container..."
docker rm frank-kafka-hotel-consumer 2>/dev/null

echo "Removing frank-kafka-hotel-consumer image..."
docker rmi frank-kafka-hotel-consumer 2>/dev/null

echo "Cleanup complete!"
docker ps -a
docker images | grep frank-kafka-hotel-consumer
