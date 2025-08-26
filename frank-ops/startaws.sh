#!/bin/bash

# Script per avviare LocalStack in background

# Se esiste già un container con nome localstack, lo rimuove
if [ "$(docker ps -a -q -f name=localstack)" ]; then
  echo "⚠️  Container 'localstack' già esistente. Lo rimuovo..."
  docker stop localstack
  docker rm -f localstack
fi

# Avvio un nuovo container LocalStack
docker run -d \
  -p 4566:4566 \
  -p 4510-4559:4510-4559 \
  --name localstack \
  localstack/localstack

echo "✅ LocalStack avviato in background sulla porta 4566"

