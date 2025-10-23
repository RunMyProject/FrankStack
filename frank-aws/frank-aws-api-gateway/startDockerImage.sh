# ================================================================
# startDockerImage.sh
# Frank-AWS-API-Gateway Microservice Container Definition (cache-optimized)
# 
# Author: Edoardo Sabatini
# Date: 23 October 2025
# ================================================================

# Run in background with ALL environment variables
docker run -d \
  --name frank-aws-api-gateway \
  --network frank-aws_frankstack-aws-net \
  -p 18081:18081 \
  -e AWS_ACCESS_KEY_ID=test \
  -e AWS_SECRET_ACCESS_KEY=test \
  -e AWS_DEFAULT_REGION=eu-central-1 \
  -e AWS_ENDPOINT=http://frankstack-localstack:4566 \
  frank-aws-api-gateway

# List running containers
docker ps