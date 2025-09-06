# -------------------- #!/bin/bash
# Test del modello
# echo "💬 Test: invio messaggio a gpt-oss:20b..."
echo "💬 Test: invio messaggio a nous-hermes2pro:Q4_0-json..."
echo ""

# Definisci il prompt come stringa JSON (tra virgolette)
MY_PROMPT='{
  "maxWords": 100,
  "user": "Edoardo",
  "userLang": "IT",
  "aiName": "FrankStack (Travel Assistant)",
  "cityStart": "Cinisello Balsamo",
  "cityEnd": "Parigi",
  "kindOfTravel": "?",
  "maxBudget": "?",
  "numberOfPeople": "?",
  "starsOfHotel": "?",
  "durationInDays": "?",
  "dateTimeStart": "?",
  "dateTimeEnd": "?",
  "numberOfLuggage": "?",
  "currentDateTime": "Sat Aug 30 2025 22:26",
  "weather": "Sereno",
  "temperature": 22,
  "question": "Certo! siamo in 2 e non voglio spendere + di 1000 euro...per un periodo di 3-4 gg e partenza domani mattina",
  "answer": "*",
  "rules": "1: Fill all fields you can infer from the question. 2: If a field cannot be inferred, leave it as ''?''. 3: Set ''answer'' to ''ok'' only if all fields are filled. Otherwise, set ''answer'' to a short natural language question asking for the missing info. 4: Return ONLY the JSON object, no extra text."
}'

# Passa il prompt al modello (tra virgolette per espandere la variabile)
# ollama run gpt-oss:20b "$MY_PROMPT"
ollama run adrienbrault/nous-hermes2pro:Q4_0-json "$MY_PROMPT"
echo ""
echo "✅ Test completato."

