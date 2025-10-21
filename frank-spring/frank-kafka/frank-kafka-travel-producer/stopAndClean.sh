#!/bin/bash
# ================================================================
# stopAndClean.sh
# Stop and remove frank-kafka-travel-producer  + delete image
# Author: Edoardo Sabatini
# Date: 21 October 2025
# ================================================================

echo "Stopping frank-kafka-travel-producer container..."
docker stop frank-kafka-travel-producer 2>/dev/null

echo "Removing frank-kafka-travel-producer container..."
docker rm frank-kafka-travel-producer 2>/dev/null

echo "Removing frank-kafka-travel-producer image..."
docker rmi frank-kafka-travel-producer 2>/dev/null

echo "Cleanup complete!"
docker ps -a
docker images | grep frank-kafka-travel-producer
