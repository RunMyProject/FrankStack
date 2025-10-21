# ================================================================
# startDockerImage.sh
# Frank-API-Gateway Microservice Container Definition (cache-optimized)
# Author: Edoardo Sabatini
# Date: 21 October 2025
# ================================================================

# Note: no background! Use this if you want to run in the foreground
# docker run --rm -p 8081:8080 frank-api-gateway

# Run in background
docker run -d --name frank-api-gateway -p 8081:8081 frank-api-gateway

# List running containers
docker ps
