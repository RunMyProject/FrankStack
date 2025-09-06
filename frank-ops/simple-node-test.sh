curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Ciao",
    "provider": "ollama"
  }'

