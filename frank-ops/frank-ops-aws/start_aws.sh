#!/bin/bash
# -----------------------------------------------------------------------------
# start_aws.sh
# -----------------------
# Script to start LocalStack in the background
# Stops and removes existing container if present, then launches a new one.
#
# Author: Edoardo Sabatini
# Date: 14 October 2025
# -----------------------------------------------------------------------------

# Check if a container named 'localstack' already exists
if [ "$(docker ps -a -q -f name=localstack)" ]; then
  echo "⚠️  Container 'localstack' already exists. Removing..."
  docker stop localstack
  docker rm -f localstack
fi

# Start a new LocalStack container in detached mode
docker run -d \
  -p 4566:4566 \
  -p 4510-4559:4510-4559 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --name localstack \
  localstack/localstack

echo "✅ LocalStack started in background on port 4566"
echo "✅ docker ps -f name=localstack"
docker ps -f name=localstack
echo "✅ docker logs --tail 20 localstack"
docker logs --tail 20 localstack

