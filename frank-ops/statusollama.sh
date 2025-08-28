#!/bin/bash
# -----------------------------------------------------------------------------
# statusollama.sh
# -----------------------
# Script to check the status of the Ollama container and its model files.
# It verifies:
# - Presence of model blobs and manifests on host
# - Container running status
# - Blobs and manifests inside the container
# -----------------------------------------------------------------------------
# Author: Edoardo Sabatini
# Date: 28 August 2025
# -----------------------------------------------------------------------------

# External (host) directories
EXT_DIR="/media/edoardo/data2/ollama_models/models"
EXT_MANIFEST_DIR="$EXT_DIR/manifests/registry.ollama.ai/library/gpt-oss"
EXT_PATTERN="20b*"

# Container configuration
CONTAINER="ollama"
CTR_BLOBS="/root/.ollama/models/blobs"
CTR_MANIFEST_DIR="/root/.ollama/models/manifests/registry.ollama.ai/library/gpt-oss"
CTR_MODEL="20b"

# Check media blobs on host
if [ -d "$EXT_DIR/blobs" ]; then
    echo "Host blobs: ✅"
else
    echo "Host blobs: ❌"
fi

# Check media manifests on host (first match)
FOUND=""; for f in "$EXT_MANIFEST_DIR"/$EXT_PATTERN; do [ -e "$f" ] && FOUND=1 && break; done
if [ -n "$FOUND" ]; then
    echo "Host manifest: ✅"
else
    echo "Host manifest: ❌"
fi

# Check if container is running
if [ -n "$(docker ps -q -f name=$CONTAINER 2>/dev/null)" ]; then
    echo "Container running: ✅"
else
    echo "Container running: ❌"
fi

# Check blobs inside container
if docker exec "$CONTAINER" test -d "$CTR_BLOBS" >/dev/null 2>&1; then
    echo "Container blobs: ✅"
else
    echo "Container blobs: ❌"
fi

# Check manifest inside container
if docker exec "$CONTAINER" test -e "$CTR_MANIFEST_DIR/$CTR_MODEL" >/dev/null 2>&1; then
    echo "Container manifest: ✅"
else
    echo "Container manifest: ❌"
fi

# List Ollama models inside container
docker exec -it "$CONTAINER" ollama list
