#!/bin/bash
# 

EXT_DIR="/media/edoardo/data2/ollama_models/models"
EXT_MANIFEST_DIR="$EXT_DIR/manifests/registry.ollama.ai/library/gpt-oss"
EXT_PATTERN="20b*"

CONTAINER="ollama"
CTR_BLOBS="/root/.ollama/models/blobs"
CTR_MANIFEST_DIR="/root/.ollama/models/manifests/registry.ollama.ai/library/gpt-oss"
CTR_MODEL="20b"

# Media blobs
if [ -d "$EXT_DIR/blobs" ]; then echo "Media blobs: ✅"; else echo "Media blobs: ❌"; fi

# Media manifest (primo match)
FOUND=""; for f in "$EXT_MANIFEST_DIR"/$EXT_PATTERN; do [ -e "$f" ] && FOUND=1 && break; done
if [ -n "$FOUND" ]; then echo "Media manifest: ✅"; else echo "Media manifest: ❌"; fi

# Container running
if [ -n "$(docker ps -q -f name=$CONTAINER 2>/dev/null)" ]; then echo "Container running: ✅"; else echo "Container running: ❌"; fi

# Blobs nel container
if docker exec "$CONTAINER" test -d "$CTR_BLOBS" >/dev/null 2>&1; then echo "Container blobs: ✅"; else echo "Container blobs: ❌"; fi

# Manifest nel container (20b)
if docker exec "$CONTAINER" test -e "$CTR_MANIFEST_DIR/$CTR_MODEL" >/dev/null 2>&1; then echo "Container manifest: ✅"; else echo "Container manifest: ❌"; fi

docker exec -it ollama ollama list

