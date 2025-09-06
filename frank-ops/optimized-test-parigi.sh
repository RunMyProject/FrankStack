#!/bin/bash
# optimized-test-parigi.sh
# Test ottimizzato per nous-hermes2pro:Q4_0 con nuove regole semplificate
echo "🧪 ========================================"
echo "🧪 Test Ottimizzato Q4_0: Viaggio a Parigi"
echo "🧪 ========================================"
echo ""

# CONTEXT con regole semplificate e struttura corretta
MY_CONTEXT='{
  "rules": [
    "OUTPUT: {\"rules\":[...], \"system\":{...}, \"form\":{...}, \"question\":\"...\", \"answer\":\"...\"}",
    "NO text outside JSON. NO markdown. NO explanations.",
    "answer = string only. Numbers: budget,people,starsOfHotel,luggages,durationOfStayInDays",
    "Missing fields → answer = \"Per completare serve: [field1,field2]\"",
    "All fields filled → answer = \"ok\"",
    "Keep ALL rules, system unchanged. Update ONLY form fields and answer."
  ],
  "system": {
    "maxWords": 50,
    "user": "Edoardo",
    "userLang": "IT",
    "aiName": "FrankStack",
    "currentDateTime": "2025-08-31T15:30:00+02:00",
    "weather": "Sereno",
    "temperatureWeather": 22
  },
  "form": {
    "tripDeparture": "",
    "tripDestination": "",
    "dateTimeRoundTripDeparture": "",
    "dateTimeRoundTripReturn": "",
    "durationOfStayInDays": 0,
    "transport": "",
    "budget": 0,
    "people": 0,
    "starsOfHotel": 0,
    "luggages": 0
  },
  "question": "Voglio fare un viaggio per Parigi!",
  "answer": "?"
}'

echo "📤 Invio richiesta con regole ottimizzate..."
echo "📋 Domanda: 'Voglio fare un viaggio per Parigi!'"
echo ""

# Test 1: Endpoint normale
echo "🔵 Test 1: Endpoint /chat standard"
PAYLOAD1=$(jq -n \
  --arg msg "$MY_CONTEXT" \
  '{message: $msg, provider: "ollama", debug: true}')

curl -s -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD1" | jq '.'

echo ""
echo "🟡 Test 2: Endpoint /test-simple (diagnostico)"

# Test 2: Endpoint semplificato per debug
curl -s -X POST http://localhost:3000/test-simple | jq '.'

echo ""
echo "🔵 Test 3: Secondo messaggio con più informazioni"

# Context aggiornato con info parziali
MY_CONTEXT_2='{
  "rules": [
    "OUTPUT: {\"rules\":[...], \"system\":{...}, \"form\":{...}, \"question\":\"...\", \"answer\":\"...\"}",
    "NO text outside JSON. NO markdown. NO explanations.",
    "answer = string only. Numbers: budget,people,starsOfHotel,luggages,durationOfStayInDays",
    "Missing fields → answer = \"Per completare serve: [field1,field2]\"",
    "All fields filled → answer = \"ok\"",
    "Keep ALL rules, system unchanged. Update ONLY form fields and answer."
  ],
  "system": {
    "maxWords": 50,
    "user": "Edoardo",
    "userLang": "IT",
    "aiName": "FrankStack",
    "currentDateTime": "2025-08-31T15:30:00+02:00",
    "weather": "Sereno",
    "temperatureWeather": 22
  },
  "form": {
    "tripDeparture": "",
    "tripDestination": "Parigi",
    "dateTimeRoundTripDeparture": "",
    "dateTimeRoundTripReturn": "",
    "durationOfStayInDays": 0,
    "transport": "",
    "budget": 0,
    "people": 0,
    "starsOfHotel": 0,
    "luggages": 0
  },
  "question": "Partiamo domani mattina, siamo in 2 persone con budget 1500 euro",
  "answer": "?"
}'

PAYLOAD3=$(jq -n \
  --arg msg "$MY_CONTEXT_2" \
  '{message: $msg, provider: "ollama"}')

curl -s -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD3" | jq '.'

echo ""
echo "🟢 Test 4: Health check (verifica parametri ottimizzati)"
curl -s http://localhost:3000/health | jq '.'

echo ""
echo "📊 ========================================"
echo "📊 RISULTATI ATTESI:"
echo "📊 Test 1: answer = 'Per completare serve: [lista campi mancanti]'"
echo "📊 Test 2: JSON semplice con answer compilato"
echo "📊 Test 3: answer più specifico con meno campi mancanti"
echo "📊 Test 4: Mostra temperature=0.2, mirostat=2"
echo "📊 ========================================"

# BONUS: Test di carico per verificare consistenza
echo ""
echo "🔄 Test 5: Consistenza (5 richieste identiche)"
for i in {1..5}; do
  echo "Request $i/5..."
  curl -s -X POST http://localhost:3000/chat \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD1" | jq '.response' | head -1
done

echo ""
echo "✅ Test batch completato!"
echo "💡 Se vedi ancora problemi:"
echo "   1. Verifica che Ollama sia in running: ollama list"
echo "   2. Prova modello diverso: llama3.1:8b-instruct-q4_0"
echo "   3. Considera upgrade a Q4_K_M o Q5_0"
