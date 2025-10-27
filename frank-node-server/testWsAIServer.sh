#!/bin/bash
# ================================================================
# testWsAIServer.sh - Test endpoint /chat HTTP
# Uses a predefined JSON file as input
#     
# Author: Edoardo Sabatini
# Date: 27 October 2025
# ================================================================

TEST="frankstack-input.json"

echo "🧪 ========================================"
echo "🧪 Test HTTP /chat endpoint"
echo "🧪 ========================================"
echo ""

# --- Health check
echo "🟢 Health check:"
curl -s http://localhost:3000/health | jq '.'
echo ""
echo "---------------------------------------"
echo ""

# --- Verifica file
if [ ! -f $TEST ]; then
    echo "❌ File $TEST non trovato!"
    exit 1
fi

# --- Mostra il JSON
echo "📄 Contenuto del JSON inviato:"
cat $TEST | jq '.'
echo ""
echo "---------------------------------------"
echo ""

# --- Test /chat
echo "🔵 Invio richiesta POST a /testchat..."
response=$(curl -s -X POST http://localhost:3000/testchat \
  -H "Content-Type: application/json" \
  -d @$TEST)

echo ""
echo "💬 Risposta dal server:"
echo ""

# Verifica se è JSON valido
if echo "$response" | jq empty 2>/dev/null; then
    echo "$response" | jq '.'
    
    # Verifica successo
    success=$(echo "$response" | jq -r '.success // false')
    if [ "$success" = "true" ]; then
        echo ""
        echo "✅ Test completato con successo!"
    else
        echo ""
        echo "⚠️ Il server ha risposto ma con errore"
    fi
else
    echo "⚠️ Risposta non JSON:"
    echo "$response"
fi

echo ""
echo "🧪 ========================================"
