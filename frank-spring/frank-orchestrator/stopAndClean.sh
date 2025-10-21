#!/bin/bash
# ================================================================
# stopAndClean.sh
# Stop and remove frank-orchestrator  + delete image
# Author: Edoardo Sabatini
# Date: 21 October 2025
# ================================================================

echo "Stopping frank-orchestrator container..."
docker stop frank-orchestrator 2>/dev/null

echo "Removing frank-orchestrator container..."
docker rm frank-orchestrator 2>/dev/null

echo "Removing frank-orchestrator image..."
docker rmi frank-orchestrator 2>/dev/null

echo "Cleanup complete!"
docker ps -a
docker images | grep frank-orchestrator

