#!/bin/bash
# -----------------------------------------------------------------------------
# stopollama.sh
# -----------------------
# Script to stop and remove the Ollama container.
# Checks if the Ollama container is running, stops it, and removes it.
# -----------------------------------------------------------------------------
# Author: Edoardo Sabatini
# Date: 28 August 2025
# -----------------------------------------------------------------------------

# Stop and remove Ollama container
docker stop ollama 2>/dev/null && docker rm -f ollama 2>/dev/null

echo "🛑 Ollama stopped and container removed"
