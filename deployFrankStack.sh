#!/bin/bash
# ==========================================================
# deployFrankStack.sh
# deploy the Frank Stack on a Linux system
#
# Author: Edoardo Sabatini
# Date: 28 October 2025
# ==========================================================

echo "Deployment of Frank Stack"
echo "-------------------------------------------"

echo "Stage 1: Node.js deployment..."
docker-compose -f docker-compose.yml up -d --build
if [ $? -eq 0 ]; then
    echo "Stage 1 deployed successfully!"
else
    echo "Deployment failed. Please check the logs for more details."
    exit 1
fi

# ==========================================================

echo "Stage 2: Java deployment..."
cd frank-spring || {
    echo "Error: directory frank-stack-spring not found!"
    exit 1
}
docker-compose -f docker-compose.yml up -d --build
if [ $? -eq 0 ]; then
    echo "Stage 2 deployed successfully!"
else
    echo "Deployment failed. Please check the logs for more details."
    exit 1
fi

# ==========================================================

echo "Stage 3: AWS deployment..."
cd ../frank-aws || {
    echo "Error: directory frank-stack-aws not found!"
    exit 1
}
./start-full-stack.sh
if [ $? -eq 0 ]; then
    echo "Stage 3 deployed successfully!"
else
    echo "Deployment failed. Please check the logs for more details."
    exit 1
fi

echo "Deployment script finished."
# End of deployFrankStack.sh
