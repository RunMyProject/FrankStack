# ================================================================
# startDockerImage.sh
# frank-kafka-hotel-consumer
# Author: Edoardo Sabatini
# Date: 21 October 2025
# ================================================================

# Note: no background! Use this if you want to run in the foreground
# docker run --rm -p 8081:8080 frank-hotel-travel-consumer

# Run in background
docker run -d --name frank-kafka-hotel-consumer -p 8081:8081 frank-kafka-hotel-consumer

# List running containers
docker ps
