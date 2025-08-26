#!/bin/bash

# Script per stoppare e pulire LocalStack
if [ "$(docker ps -q -f name=localstack)" ]; then
  echo "🛑 Fermando LocalStack..."
  docker stop localstack
fi

if [ "$(docker ps -a -q -f name=localstack)" ]; then
  echo "🧹 Rimuovendo container LocalStack..."
  docker rm localstack
fi

echo "✅ LocalStack stoppato e pulito"
