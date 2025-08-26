#!/bin/bash
docker stop ollama && docker rm -f ollama
echo "🛑 Ollama fermato e container rimosso"
