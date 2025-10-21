# ================================================================
# startDockerImage.sh
# frank-orchestrator
# Author: Edoardo Sabatini
# Date: 21 October 2025
# ================================================================

# Note: no background! Use this if you want to run in the foreground
# docker run --rm -p 8081:8080 frank-orchestrator

# Run in background
docker run -d --name frank-orchestrator -p 8081:8081 frank-orchestrator

# List running containers
docker ps
