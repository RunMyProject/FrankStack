#!/bin/bash
# ================================================================
# modelsList.sh
#
# Author: Edoardo Sabatini
# Date: 03 November 2025
# ================================================================
echo "🔍 Listing Ollama models..."
docker exec frankstack-ollama ollama list
echo "------------------------------------------------"
docker logs -f frankstack-node-server
