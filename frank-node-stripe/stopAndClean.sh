#!/bin/bash
# ================================================================
# stopAndClean.sh
# Stop and remove frank-node-stripe + delete image
# Author: Edoardo Sabatini
# Date: 27 October 2025
# ================================================================

echo "Stopping frank-node-stripe container..."
docker stop frank-node-stripe 2>/dev/null

echo "Removing frank-node-stripe container..."
docker rm frank-node-stripe 2>/dev/null

echo "Removing frank-node-stripe image..."
docker rmi frank-node-stripe 2>/dev/null

echo "Cleanup complete!"
docker ps -a
docker images | grep frank-node-stripe
