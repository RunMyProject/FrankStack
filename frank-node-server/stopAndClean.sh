#!/bin/bash
# ================================================================
# stopAndClean.sh
# Stop and remove frank-node-server  + delete image
# Author: Edoardo Sabatini
# Date: 27 October 2025
# ================================================================

echo "Stopping frank-node-server container..."
docker stop frank-node-server 2>/dev/null

echo "Removing frank-node-server container..."
docker rm frank-node-server 2>/dev/null

echo "Removing frank-node-server image..."
docker rmi frank-node-server 2>/dev/null

echo "Cleanup complete!"
docker ps -a
docker images | grep frank-node-server
