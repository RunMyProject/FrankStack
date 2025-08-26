#!/bin/bash

##
# quando scompatti devi ricreare fedelmente la struttura:
# folder: /media/edoardo/data2/ollama_models
# ls /media/edoardo/data2/ollama_models:
# totale 16
# drwxr-xr-x 1 edoardo edoardo    0 ago 24 15:09 ./
# drwxrwxrwx 1 edoardo edoardo 4096 ago 24 15:05 ../
# -rw------- 1 edoardo edoardo  244 ago 24 14:44 history
# -rw------- 1 edoardo edoardo  387 ago 24 14:44 id_ed25519
# -rw-r--r-- 1 edoardo edoardo   81 ago 24 14:44 id_ed25519.pub
# drwxr-xr-x 1 edoardo edoardo    0 ago 24 14:44 models/
# -rw-rw-r-- 1 edoardo edoardo    0 ago 24 15:09 nota_bene_installazione.txt
# ----------------------------------------------------------------------------

# ===== CONFIG =====
HOST_MODELS_DIR="/media/edoardo/data2/ollama_models"
CONTAINER_MODELS_DIR="/root/.ollama/models"
CONTAINER_NAME="ollama"
PORT=11434
# ==================

# Ferma e rimuove container esistente
if [ "$(docker ps -a -q -f name=$CONTAINER_NAME)" ]; then
    echo "⚠️ Container '$CONTAINER_NAME' esistente. Lo fermo e rimuovo..."
    docker stop "$CONTAINER_NAME"
    docker rm -f "$CONTAINER_NAME"
fi

# Avvio container Ollama con montaggio completo di models
echo "▶️ Avvio container Ollama..."
CONTAINER_ID=$(docker run -d \
    -v "$HOST_MODELS_DIR/models":"$CONTAINER_MODELS_DIR" \
    -p $PORT:$PORT \
    --name "$CONTAINER_NAME" \
    ollama/ollama)

echo "✅ Container avviato: $CONTAINER_ID"

docker exec ollama ollama list

echo "▶️ Avvio test:docker exec -it ollama ollama run gpt-oss:20b \"Ciao, sono Edoardo, tu come ti chiami?\""

docker exec -it ollama ollama run gpt-oss:20b "Ciao, sono Edoardo, tu come ti chiami?"

echo "✅ done!"


