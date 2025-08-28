#!/bin/bash
# -----------------------------------------------------------------------------
# ollama_parse_json.sh
# -----------------------
# Usage: ollama_parse_json.sh "travel-question"
# Sends a user travel request to Ollama and returns a structured JSON response
# containing the "answer" field and other metadata.
#
# Author: Edoardo Sabatini
# Date: 28 August 2025
# -----------------------------------------------------------------------------

# Check if argument is provided
if [ $# -eq 0 ]; then
  echo "Usage: $0 \"sentence to transform into JSON\""
  exit 1
fi

# Default context (can override with environment variables)
USER_LANG="ITA"
USER_NAME="Edoardo"
LOCATION="Milan"
WEATHER_DESC="sunny"
WEATHER_TEMP="30"
MAX_WORDS="100"
CURRENT_ISO_DATETIME=$(date -Iseconds)

# User input
USER_INPUT="$1"

# Build prompt for Ollama
read -r -d '' PROMPT <<EOL
You are an AI assistant that converts travel requests into a structured JSON object:
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
1. If some required fields are missing, include them in "missingFields": ["field1","field2", ...] and set "answer" to a natural message asking for missing info.
2. If all fields are present, set "answer": "ok" (or another short natural confirmation).
3. Numbers must be numbers, strings must be strings, dates in ISO format.
4. Return only JSON, no extra explanations or comments.
EOL

# Print prompt (optional, for debugging)
echo "$PROMPT"

# Execute Ollama via Docker
docker exec -it ollama ollama run gpt-oss:20b "$PROMPT"
