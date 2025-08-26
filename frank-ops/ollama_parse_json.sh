#!/bin/bash
# ollama_parse_json.sh
# Usage: ollama_parse_json.sh + travel-question
# Script per inviare una frase a Ollama e ricevere JSON strutturato con campo answer

# Controllo argomento
if [ $# -eq 0 ]; then
  echo "Uso: $0 \"frase da trasformare in JSON\""
  exit 1
fi

# Default context (override with env vars)
USER_LANG="ITA"
USER_NAME="Edoardo"
LOCATION="Milan"
WEATHER_DESC="sunny"
WEATHER_TEMP="30"
MAX_WORDS="100"
CURRENT_ISO_DATETIME=$(date -Iseconds)

####################################################

# Frase dell'utente
USER_INPUT="$1"

# Prompt
# 
read -r -d '' PROMPT <<EOL
You are an AI assistant that converts travel requests in into a structured JSON object:
{
"maxWords": $MAX_WORDS,
"user": "$USER_NAME",
"user_lang": "$USER_LANG",
"weather": "$WEATHER_DESC",
"weatherTemp": $WEATHER_TEMP,
"currentDateTime": "$CURRENT_ISO_DATETIME",
"locationStart": "$LOCATION",
"locationEnd": "?",
"kindOfTravel": "?",
"maxBudget": "?",
"numberOfPeople": "?",
"starsOfHotel": "?",
"durationInDays": "?",
"zoneDateTimeStart": "?",
"zoneDateTimeEnd": "?",
"numberOfLuggage": "?",
"taxiStart": "?",
"taxiEnd": "?",
"question": "$USER_INPUT",
"answer": "*"
}
Rules:
1. If some required fields are missing, include them in "missingFields": 
["field1","field2", ...] and set "answer" to a natural message asking for missing info.
2. If all fields are present, set "answer": "ok" (or another short natural confirmation).
3. Numbers must be numbers, strings must be strings, dates in ISO format.
4. Return only JSON, no extra explanations or comments.

EOL

echo "$PROMPT"

######### 

# Esecuzione Ollama
docker exec -it ollama ollama run gpt-oss:20b "$PROMPT"
