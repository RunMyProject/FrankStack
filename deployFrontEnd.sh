# ================================================================
# deployFrontEnd.sh
# for ocker-compose.front.yml
# 
# Author: Edoardo Sabatini
# Date: 03 November 2025
# ================================================================
#!/bin/bash
echo "🚀 Deploying FrankStack Front-End with Docker Compose..."
docker-compose -f docker-compose.front.yml up -d --build
# To run in detached mode, use the following command instead:
# docker logs frankstack-react-vite --tail 50
# ==========================================================
# end of file
