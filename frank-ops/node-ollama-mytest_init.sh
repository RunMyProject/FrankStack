#!/bin/bash

echo "node-ollama-mytest.sh"
echo "💬 Test: invio messaggio a node.js: Voglio fare un viaggio per Parigi!"
echo ""

# Definisci il prompt con APOCI DOPPI dentro le rules (non singoli)
MY_PROMPT='{
  "maxWords": 50,
  "user": "Edoardo",
  "userLang": "IT",
  "aiName": "FrankStack (Travel Assistant)",
  "cityStart": "Cinisello Balsamo",
  "cityEnd": "?",
  "meansOfTransport": "?",
  "budget": "?",
  "numberOfPeople": "?",
  "starsOfHotel": "?",
  "durationInDays": "?",
  "dateTimeStart": "?",
  "dateTimeEnd": "?",
  "numberOfLuggage": "?",
  "currentDateTime": "Sat Aug 30 2025 22:26",
  "weather": "Sereno",
  "temperature": 22,
  "question": "Voglio fare un viaggio per Parigi!",
  "answer": "?",
  "rules": "1: EXTRACT ONLY information EXPLICITLY STATED in the question; 2: If a field is NOT MENTIONED in the question, leave it as \"?\"; 3: NEVER invent values - if unsure, use \"?\"; 4: IF ANY \"?\" REMAIN, set \"answer\" EXACTLY to: \"To complete booking, I need: [list missing fields]\"; 5: ONLY when ALL fields are filled, set \"answer\" to \"ok, booking in progress...please wait\" in userLang; 6: STRICTLY follow this JSON structure without adding extra fields."
}'

# Genera il payload JSON correttamente
PAYLOAD=$(jq -n \
  --arg msg "$MY_PROMPT" \
  '{message: $msg, provider: "ollama"}')

# Invia la richiesta
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"

echo ""
echo "✅ Test completato."
