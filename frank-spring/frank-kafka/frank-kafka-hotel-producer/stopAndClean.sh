#!/bin/bash
# ================================================================
# stopAndClean.sh
# Stop and remove frank-kafka-hotel-producer  + delete image
# Author: Edoardo Sabatini
# Date: 21 October 2025
# ================================================================

echo "Stopping frank-kafka-hotel-producer container..."
docker stop frank-kafka-hotel-producer 2>/dev/null

echo "Removing frank-kafka-hotel-producer container..."
docker rm frank-kafka-hotel-producer 2>/dev/null

echo "Removing frank-kafka-hotel-producer image..."
docker rmi frank-kafka-hotel-producer 2>/dev/null

echo "Cleanup complete!"
docker ps -a
docker images | grep frank-kafka-hotel-producer
