#!/bin/bash
# ================================================================
# stopAndClean.sh
# Stop and remove Frank-AWS-API-Gateway container + delete image
#
# Author: Edoardo Sabatini
# Date: 23 October 2025
# ================================================================

echo "Stopping Frank-AWS-API-Gateway container..."
docker stop frank-aws-api-gateway 2>/dev/null

echo "Removing Frank-AWS-API-Gateway container..."
docker rm frank-aws-api-gateway 2>/dev/null

echo "Removing Frank-AWS-API-Gateway image..."
docker rmi frank-aws-api-gateway 2>/dev/null

echo "Cleanup complete!"
docker ps -a
docker images | grep frank-aws-api-gateway
