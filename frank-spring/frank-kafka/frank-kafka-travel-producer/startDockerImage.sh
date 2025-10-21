# ================================================================
# startDockerImage.sh
# frank-kafka-travel-producer
# Author: Edoardo Sabatini
# Date: 21 October 2025
# ================================================================

# Note: no background! Use this if you want to run in the foreground
# docker run --rm -p 8081:8080 frank-kafka-travel-producer

# Run in background
docker run -d --name frank-kafka-travel-producer -p 8081:8081 frank-kafka-travel-producer

# List running containers
docker ps
