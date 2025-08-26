#!/bin/bash

# ===== CONFIG =====
HOST_MODELS_DIR="/media/edoardo/data2/ollama_models"
CONTAINER_MODELS_DIR="/root/.ollama/models"
CONTAINER_NAME="ollama"
PORT=11434
# ==================

echo "🔎 ls -lattr $HOST_MODELS_DIR/models/blobs"
ls -lattr "$HOST_MODELS_DIR/models/blobs"
echo "-------------------------------"
echo "🔎 ls -lattr $HOST_MODELS_DIR/models/manifests"
ls -lattr "$HOST_MODELS_DIR/models/manifests"
echo "-------------------------------"
echo "🔎 Dimensione totale (host):"
du -sh "$HOST_MODELS_DIR/models"

# Ferma e rimuove container esistente
if [ "$(docker ps -a -q -f name=$CONTAINER_NAME)" ]; then
    echo "⚠️ Container '$CONTAINER_NAME' esistente. Lo fermo e rimuovo..."
    docker stop "$CONTAINER_NAME"
    docker rm -f "$CONTAINER_NAME"
fi

# Imposta permessi
echo "🔧 Imposto ownership 1000:1000 e permessi 755"
sudo chown -R 1000:1000 "$HOST_MODELS_DIR"
sudo chmod -R 755 "$HOST_MODELS_DIR"

# Avvio container Ollama con montaggio completo di models
echo "▶️ Avvio container Ollama..."
CONTAINER_ID=$(docker run -d \
    -v "$HOST_MODELS_DIR/models":"$CONTAINER_MODELS_DIR" \
    -p $PORT:$PORT \
    --name "$CONTAINER_NAME" \
    ollama/ollama)

echo "✅ Container avviato: $CONTAINER_ID"
sleep 5  # attesa stabilizzazione

# Controllo inside container
echo "🔍 Contenuto inside container ($CONTAINER_MODELS_DIR/blobs):"
docker exec "$CONTAINER_NAME" ls -lh "$CONTAINER_MODELS_DIR/blobs"

echo "🔍 Contenuto inside container ($CONTAINER_MODELS_DIR/manifests):"
docker exec "$CONTAINER_NAME" ls -lhR "$CONTAINER_MODELS_DIR/manifests"

echo "📊 Dimensione inside-container:"
docker exec "$CONTAINER_NAME" du -sh "$CONTAINER_MODELS_DIR"

echo "🎉 Pronto! Ora i blob e i manifest dovrebbero essere visibili per l'API Ollama."

# Test modello
echo "▶️ Test 'Ciao, come stai?'"
curl -s -X POST http://localhost:$PORT/api/generate \
-H "Content-Type: application/json" \
-d '{
  "model": "gpt-oss/20b",
  "prompt": "Ciao, come stai?",
  "stream": false
}'

