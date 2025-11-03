#!/bin/bash
# ==========================================================
# undeployFrankStack.sh
# undeploy the Frank Stack on a Linux system
#
# Author: Edoardo Sabatini
# Date: 03 November 2025
# ==========================================================

echo "Undeployment of Frank Stack"
echo "-------------------------------------------"

# ==========================================================

echo "Stage 1: Frontend undeployment..."
./undeployFrontEnd.sh

# ==========================================================

echo "Stage 2: Node.js undeployment..."
docker-compose -f docker-compose.yml down
if [ $? -eq 0 ]; then
    echo "Stage 1 undeployed successfully!"
else
    echo "Undeployment failed. Please check the logs for more details."
    exit 1
fi

# ==========================================================

echo "Stage 3: Java undeployment..."
cd frank-spring || {
    echo "Error: directory frank-stack-spring not found!"
    exit 1
}
docker-compose -f docker-compose.yml down
if [ $? -eq 0 ]; then
    echo "Stage 2 undeployed successfully!"
else
    echo "Undeployment failed. Please check the logs for more details."
    exit 1
fi

# ==========================================================

echo "Stage 4: AWS undeployment..."
cd ../frank-aws || {
    echo "Error: directory frank-stack-aws not found!"
    exit 1
}
./stop-full-stack.sh
if [ $? -eq 0 ]; then
    echo "Stage 3 undeployed successfully!"
else
    echo "Undeployment failed. Please check the logs for more details."
    exit 1
fi

echo "Undeployment script finished."
# End of undeployFrankStack.sh
