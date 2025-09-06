#!/bin/bash

echo "🔍 Ollama Status"
echo "----------------"

# Lista modelli
echo "📦 Modelli disponibili:"
ollama list
echo ""

# Test del modello
echo "💬 Test: invio messaggio a gpt-oss:20b..."
echo "Prompt: 'Ciao ChatGPT, sono Edoardo!'"
echo ""

ollama run gpt-oss:20b "Ciao ChatGPT, sono Edoardo! Rispondi in modo breve."

echo ""
echo "✅ Test completato."
