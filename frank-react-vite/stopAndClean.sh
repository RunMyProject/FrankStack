#!/bin/bash
# ================================================================
# stopAndClean.sh
# Stop and remove frank-react-vite + delete image
# 
# Author: Edoardo Sabatini
# Date: 03 November 2025
# ================================================================

echo "Stopping frank-react-vite container..."
docker stop frank-react-vite 2>/dev/null

echo "Removing frank-react-vite container..."
docker rm frank-react-vite 2>/dev/null

echo "Removing frank-react-vite image..."
docker rmi frank-react-vite 2>/dev/null

echo "Cleanup complete!"
docker ps -a
docker images | grep frank-react-vite
