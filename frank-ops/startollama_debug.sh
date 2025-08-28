#!/bin/bash
# -----------------------------------------------------------------------------
# startollama_debug.sh
# -----------------------
# Script to start the Ollama container in debug mode.
# It lists host folder contents, checks sizes, sets permissions, starts container,
# and verifies inside-container file structure.
#
# Required host folder structure:
# /media/edoardo/data2/ollama_models
# ├── history
# ├── id_ed25519
# ├── id_ed25519.pub
# ├── models/
# │   ├── blobs/
# │   └── manifests/
# └── nota_bene_installazione.txt
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

# Inspect host folder
echo "🔎 Listing host blobs:"
ls -lattr "$HOST_MODELS_DIR/models/blobs"
echo "-------------------------------"
echo "🔎 Listing host manifests:"
ls -lattr "$HOST_MODELS_DIR/models/manifests"
echo "-------------------------------"
echo "🔎 Total size of models folder (host):"
du -sh "$HOST_MODELS_DIR/models"

# Stop and remove existing container
if [ "$(docker ps -a -q -f name=$CONTAINER_NAME)" ]; then
    echo "⚠️ Container '$CONTAINER_NAME' exists. Stopping and removing..."
    docker stop "$CONTAINER_NAME"
    docker rm -f "$CONTAINER_NAME"
fi

# Set ownership and permissions
echo "🔧 Setting ownership to 1000:1000 and permissions 755"
sudo chown -R 1000:1000 "$HOST_MODELS_DIR"
sudo chmod -R 755 "$HOST_MODELS_DIR"

# Start Ollama container with mounted models
echo "▶️ Starting Ollama container..."
CONTAINER_ID=$(docker run -d \
    -v "$HOST_MODELS_DIR/models":"$CONTAINER_MODELS_DIR" \
    -p $PORT:$PORT \
    --name "$CONTAINER_NAME" \
    ollama/ollama)

echo "✅ Container started: $CONTAINER_ID"
sleep 5  # wait for stabilization

# Inspect container folders
echo "🔍 Container blobs ($CONTAINER_MODELS_DIR/blobs):"
docker exec "$CONTAINER_NAME" ls -lh "$CONTAINER_MODELS_DIR/blobs"

echo "🔍 Container manifests ($CONTAINER_MODELS_DIR/manifests):"
docker exec "$CONTAINER_NAME" ls -lhR "$CONTAINER_MODELS_DIR/manifests"

echo "📊 Container total size:"
docker exec "$CONTAINER_NAME" du -sh "$CONTAINER_MODELS_DIR"

echo "🎉 Ready! Blob and manifest files should now be visible for Ollama API."

# Test AI model
echo "▶️ Test model with prompt 'Ciao, come stai?'"
curl -s -X POST http://localhost:$PORT/api/generate \
-H "Content-Type: application/json" \
-d '{
  "model": "gpt-oss/20b",
  "prompt": "Ciao, come stai?",
  "stream": false
}'
