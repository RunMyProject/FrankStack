#!/bin/bash

# Script per controllare lo stato di LocalStack

if [ "$(docker ps -q -f name=localstack)" ]; then
    echo "✅ LocalStack è ATTIVO"
else
    echo "❌ LocalStack NON è in esecuzione"
fi
