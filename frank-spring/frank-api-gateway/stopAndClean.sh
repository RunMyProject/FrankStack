#!/bin/bash
# ================================================================
# stopAndClean.sh
# Stop and remove Frank-API-Gateway container + delete image
# Author: Edoardo Sabatini
# Date: 21 October 2025
# ================================================================

echo "Stopping Frank-API-Gateway container..."
docker stop frank-api-gateway 2>/dev/null

echo "Removing Frank-API-Gateway container..."
docker rm frank-api-gateway 2>/dev/null

echo "Removing Frank-API-Gateway image..."
docker rmi frank-api-gateway 2>/dev/null

echo "Cleanup complete!"
docker ps -a
docker images | grep frank-api-gateway
