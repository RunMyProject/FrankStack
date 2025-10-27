# ================================================================
# startDockerImage.sh
# frank-node-server
# Author: Edoardo Sabatini
# Date: 27 October 2025
# ================================================================

# Note: no background! Use this if you want to run in the foreground
# docker run --rm -p 8081:8080 frank-node-server

# Run in background
docker run -d --name frank-node-server -p 3000:3000 frank-node-server --network frankstack-ai-net

# List running containers
docker ps
