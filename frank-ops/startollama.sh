#!/bin/bash
# -----------------------------------------------------------------------------
# startollama.sh
# -----------------------
# Script to start the Ollama container with mounted models folder.
# Stops and removes existing container if present, then launches a new one.
# Preserves the host folder structure exactly as required by Ollama:
#
# Folder: /media/edoardo/data2/ollama_models
# ├── history                  # Ollama session history
# ├── id_ed25519               # private key
# ├── id_ed25519.pub           # public key
# ├── models/                  # folder containing AI models
# └── nota_bene_installazione.txt # installation notes
#
# The models folder must be mounted into the container as /root/.ollama/models
# -----------------------------------------------------------------------------
# Author: Edoardo Sabatini
# Date: 28 August 2025
# -----------------------------------------------------------------------------

# ===== CONFIG =====
HOST_MODELS_DIR="/media/edoardo/data2/ollama_models"
CONTAINER_MODELS_DIR="/root/.ollama/models"
CONTAINER_NAME="ollama"
PORT=11434
# ==================

# Stop and remove existing container
if [ "$(docker ps -a -q -f name=$CONTAINER_NAME)" ]; then
    echo "⚠️ Container '$CONTAINER_NAME' already exists. Stopping and removing..."
    docker stop "$CONTAINER_NAME"
    docker rm -f "$CONTAINER_NAME"
fi

# Start Ollama container with mounted models directory
echo "▶️ Starting Ollama container..."
CONTAINER_ID=$(docker run -d \
    -v "$HOST_MODELS_DIR/models":"$CONTAINER_MODELS_DIR" \
    -p $PORT:$PORT \
    --name "$CONTAINER_NAME" \
    ollama/ollama)

echo "✅ Container started: $CONTAINER_ID"

# List models inside container
docker exec ollama ollama list

# Test Ollama container with a sample prompt
echo "▶️ Running test: docker exec -it ollama ollama run gpt-oss:20b \"Hi, I'm Edoardo, what's your name?\""
docker exec -it ollama ollama run gpt-oss:20b "Hi, I'm Edoardo, what's your name?"

echo "✅ Done!"
