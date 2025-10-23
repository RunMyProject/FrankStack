# ================================================================
# startDockerImage.sh
# frank-aws-service-payment-card
#
# Author: Edoardo Sabatini
# Date: 23 October 2025
# ================================================================

# Note: no background! Use this if you want to run in the foreground
# docker run --rm -p 18082:18082 frank-aws-service-payment-card

# Run in background
docker run -d --name frank-aws-service-payment-card -p 18082:18082 frank-aws-service-payment-card

# List running containers
docker ps
