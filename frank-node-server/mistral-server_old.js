/**
 * mistral-server.js
 * AI Chat Server - mistral:7b-instruct-v0.2-q4_0
 * -----------------------
 * Fixes specifici per modelli quantizzati + compatibilità front-end
 * 1. Temperature più bassa (0.2)
 * 2. top_p ridotto per maggiore determinismo
 * 3. repeat_penalty per evitare ripetizioni
 * 4. mirostat per stabilità output
 * 5. Risposta compatibile con useAI hook
 */

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
const TIMEOUT_MS = 120000;

const MODEL = "mistral:7b-instruct-v0.2-q4_0";
// const MODEL = "adrienbrault/nous-hermes2pro:Q4_0-json";

app.use(cors());
app.use(express.json({ limit: '10mb' }));

function formatTimestamp(d = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// - travelMode may include car, bus, train, airplane, bicycle, metro, ship, balloon, or any other means of travel. Always infer and fill it from conversation context.
/*
function buildAIPrompt(inputData) {
  return `You are an AI Travel Agent. Your job is to process travel requests intelligently.
CRITICAL RULES:
1. ALWAYS respond with ONLY a valid JSON object, nothing before or after
2. JSON must have exactly these 4 fields: system, form, question, answer
3. system: copy IDENTICAL from input, do not modify anything
4. question: copy IDENTICAL from input, do not modify anything
5. form: UPDATE fields based on user's question. Use your intelligence to understand what the user wants and fill/update form fields accordingly
6. answer: Always required. Respond in the language specified in system.userLang. Keep answer within system.maxWords word limit. IF all form fields are complete and valid, confirm you have all data. IF fields are missing, ask for missing fields naturally in the user's language.

YOUR INTELLIGENCE TASK:
- Parse user's question and extract travel information
- Update form fields based on what user says in the question
- When user specifies a time expression (like "tomorrow morning", "next week", "in 3 days"), always convert it into a precise timestamp in format "YYYY-MM-DD HH:mm", using system.currentDateTime as base
- The "answer" field must never be empty. It must always provide a natural short reply in the correct language

INPUT JSON:
${JSON.stringify(inputData)}
Respond with output JSON:`;
}
*/

// - Detect user's language from system.userLang or question content

/*
// buildMistralPrompt
function buildAIPrompt(inputData) {
    return `<s>[INST] You are a travel assistant. You MUST respond with ONLY valid JSON.

IMPORTANT: Never set "answer": "OK" unless ALL form fields are filled with realistic non-zero values.
If ANY field is missing, zero, or unclear, the answer MUST be a natural language question asking the user for the missing info.

RULES:
1. NEVER modify the "INPUT JSON" structure
2. Copy "system" and "question" fields EXACTLY as received
3. UPDATE "form" fields based on user's natural language input
4. ALWAYS provide "answer" field

YOUR INTELLIGENCE:
- Understand dates from natural language and convert to YYYY-MM-DD HH:mm format using currentDateTime
- Extract travel information from conversational text in user language
- Recognize data, strings and numbers automatically (example I leave from the airport = I take a plane => fill travelMode field)

"answer" field BEHAVIOR:
- IF all required form fields are complete: answer = "OK"
- IF the form has missing/unclear fields, populate the "answer" field of the JSON with a question about the missing fields
- Keep your "answer" field concise and in the user's language

INPUT JSON:
${JSON.stringify(inputData, null, 2)}

Expected OUTPUT: same JSON structure as INPUT

[/INST]`;
}
*/
// Configuration for Mistral 7B
const mistralConfig = {
    temperature: 0.15,
    max_tokens: 400,
    top_p: 0.9,
    stop: ["</s>", "[INST]"]
};

async function callMistralAPI(prompt) {
  const payload = {
    model: MODEL,
    messages: [
      {
        role: "system", 
        content: "You are an AI Travel Agent that always responds with valid JSON only. Never add text before or after the JSON."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    options: {
      temperature: 0.15,
      max_tokens: 400,
      top_p: 0.9,            
//      repeat_penalty: 1.0,   
//      num_predict: 1024,     
      stop: ["</s>", "[INST]"] // Stop tokens per evitare continuazioni
    },
    stream: false
  };

  console.log(`MISTRAL-PAYLOAD: ${JSON.stringify(payload, null, 2)}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`MISTRAL-ERROR: HTTP ${response.status}: ${errorText}`);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    return result.message.content;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

function extractJSON(text) {
  let cleaned = text.trim();
  const startIndex = cleaned.indexOf('{');
  if (startIndex > 0) {
    cleaned = cleaned.substring(startIndex);
  }
  const endIndex = cleaned.lastIndexOf('}');
  if (endIndex > 0) {
    cleaned = cleaned.substring(0, endIndex + 1);
  }
  return cleaned;
}

app.post('/chat', async (req, res) => {
  const { message, prompt } = req.body;
  const input = message || prompt;
  
  if (!input) {
    return res.status(400).json({ error: 'Missing "message" or "prompt"' });
  }

  const ts = formatTimestamp();
  console.log(`[${ts}] REQUEST: ${JSON.stringify(req.body)}`);

  try {
    let inputData;
    if (typeof input === 'string') {
      inputData = JSON.parse(input);
    } else {
      inputData = input;
    }

    console.log(`[${ts}] PARSED INPUT: ${JSON.stringify(inputData, null, 2)}`);

    const aiPrompt = buildAIPrompt(inputData);
    const rawOutput = await callMistralAPI(aiPrompt);
    
    console.log(`MISTRAL-RAW-OUTPUT: ${rawOutput}`);

    const cleanedJSON = extractJSON(rawOutput);
    const parsedResult = JSON.parse(cleanedJSON);
    
    console.log(`[${ts}] FINAL OUTPUT: ${JSON.stringify(parsedResult, null, 2)}`);
    
    // 🔥 FIX: Restituiamo nel formato che si aspetta il front-end
    return res.json({
      response: parsedResult,
      debug: {
        rawOutput,
        cleanedJSON,
        timestamp: ts,
        model: MODEL
      }
    });

  } catch (err) {
    console.error(`[${ts}] ERROR: ${err.message}`);
    return res.status(500).json({ 
      error: err.message,
      debug: {
        timestamp: ts,
        model: MODEL,
        errorType: err.name || 'UnknownError'
      }
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    model: MODEL, 
    timestamp: new Date().toISOString(),
    service: 'AI Travel Agent'
  });
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down...');
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server listening on port ${PORT}`));
