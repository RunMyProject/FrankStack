# ================================================================
# startDockerImage.sh
# frank-react-vite
# 
# Author: Edoardo Sabatini
# Date: 03 November 2025
# ================================================================

# Note: no background! Use this if you want to run in the foreground
# docker run --rm -p 8080:8080 frank-react-vite

# Run in background
docker run -d --name frank-react-vite -p 8080:8080 frank-react-vite --network frankstack-ai-net

# List running containers
docker ps
