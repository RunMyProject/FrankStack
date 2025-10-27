# ================================================================
# startDockerImage.sh
# frank-node-stripe
# Author: Edoardo Sabatini
# Date: 27 October 2025
# ================================================================

# Note: no background! Use this if you want to run in the foreground
# docker run --rm -p 4000:4000 frank-node-stripe

# Run in background
docker run -d --name frank-node-stripe -p 4000:4000 frank-node-stripe --network frankstack-ai-net

# List running containers
docker ps
