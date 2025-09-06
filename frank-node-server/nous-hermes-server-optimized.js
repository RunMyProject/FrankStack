/**
 * nous-hermes-server-optimized.js
 * AI Chat Server - OTTIMIZZATO per nous-hermes2pro:Q4_0
 * -----------------------
 * Fixes specifici per modelli quantizzati:
 * 1. Temperature più bassa (0.2)
 * 2. top_p ridotto per maggiore determinismo
 * 3. repeat_penalty per evitare ripetizioni
 * 4. mirostat per stabilità output
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const TIMEOUT_MS = 600000; // 10 minutes

const MY_MODEL = "adrienbrault/nous-hermes2pro:Q4_0-json"

// Configuration for AI endpoints
const config = {
  ollama: {
    url: "http://localhost:11434/api/generate",
    model: MY_MODEL,
    // PARAMETRI OTTIMIZZATI PER Q4_0
    options: {
      temperature: 0.2,        // Più deterministico per Q4_0
      top_p: 0.8,             // Ridotto da default 0.9
      repeat_penalty: 1.1,     // Evita ripetizioni
      mirostat: 2,            // Stabilizza output
      mirostat_eta: 0.1,      // Fine-tuning mirostat
      mirostat_tau: 5.0,      // Target perplexity
      num_predict: 2048,      // Limita lunghezza
      stop: ["\n\n", "```"]   // Stop su patterns comuni
    }
  },
  chatgpt: {
    url: "https://api.openai.com/v1/chat/completions",
    model: "gpt-3.5-turbo"
  }
};

// AI client wrapper - OTTIMIZZATO
class AIClient {
  async callOllama(prompt, debug = false) {
    const payload = {
      model: config.ollama.model,
      prompt: prompt,
      stream: true,
      options: config.ollama.options // AGGIUNTO: parametri ottimizzati
    };

    // Timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(config.ollama.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Process stream incrementally
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let finalResponse = '';
      let chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const data = JSON.parse(line);
            chunks.push(data);
            
            if (data.response) finalResponse += data.response;
            if (data.done) {
              // POST-PROCESSING per Q4_0: pulisci output
              const cleanedResponse = this.cleanModelOutput(finalResponse);
              
              return { 
                result: cleanedResponse, 
                error: null,
                ...(debug && { debug: { chunks, raw: finalResponse } })
              };
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }

      return { 
        result: finalResponse.trim() || null, 
        error: 'Incomplete response from Ollama' 
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        return { 
          result: null, 
          error: `Ollama timeout (${TIMEOUT_MS/1000}s)` 
        };
      }
      
      return { 
        result: null, 
        error: `Ollama Error: ${error.message}` 
      };
    }
  }

  // NUOVO: Pulisci output da artefatti comuni di Q4_0
  cleanModelOutput(response) {
    let cleaned = response.trim();
    
    // Rimuovi markdown code blocks se presenti
    cleaned = cleaned.replace(/```json\s*/, '');
    cleaned = cleaned.replace(/```\s*$/, '');
    
    // Rimuovi testo prima del JSON se presente
    const jsonStart = cleaned.indexOf('{');
    if (jsonStart > 0) {
      cleaned = cleaned.substring(jsonStart);
    }
    
    // Rimuovi testo dopo il JSON se presente
    const jsonEnd = cleaned.lastIndexOf('}');
    if (jsonEnd >= 0 && jsonEnd < cleaned.length - 1) {
      cleaned = cleaned.substring(0, jsonEnd + 1);
    }
    
    return cleaned;
  }

  async callChatGPT(prompt, apiKey, debug = false) {
    const payload = {
      model: config.chatgpt.model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0
    };

    try {
      const response = await fetch(config.chatgpt.url, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (debug) {
        return { 
          result: data.choices?.[0]?.message?.content?.trim() || null,
          error: null,
          debug: { raw: data }
        };
      }
      
      return { 
        result: data.choices?.[0]?.message?.content?.trim() || null,
        error: data.choices?.[0]?.message?.content ? null : 'Empty ChatGPT response'
      };
    } catch (error) {
      return { 
        result: null, 
        error: `ChatGPT Error: ${error.message}` 
      };
    }
  }
}

// CORS setup
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const aiClient = new AIClient();

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    server: 'AI Chat Server (OPTIMIZED for Q4_0)',
    ollama: 'http://localhost:11434',
    model: MY_MODEL,
    optimizations: {
      temperature: config.ollama.options.temperature,
      top_p: config.ollama.options.top_p,
      mirostat: config.ollama.options.mirostat
    }
  });
});

// NUOVO: Endpoint per testare il modello con regole semplificate
app.post('/test-simple', async (req, res) => {
  const simpleTest = {
    rules: ["Return only JSON", "answer must be string"],
    question: "Ciao, voglio andare a Roma",
    answer: "?"
  };
  
  const prompt = `INSTRUCTIONS: Return ONLY this JSON with answer filled:
${JSON.stringify(simpleTest, null, 2)}

USER: ${simpleTest.question}`;

  try {
    const { result, error } = await aiClient.callOllama(prompt, true);
    res.json({ result, error, originalPrompt: prompt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chat endpoint
app.post('/chat', async (req, res) => {
  const { message, prompt, provider = 'ollama', debug = false, apiKey } = req.body;
  const input = message || prompt;
  
  if (!input) return res.status(400).json({ 
    error: 'Missing "message" or "prompt" field' 
  });

  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  console.log(`[${timestamp}] ${input.substring(0, 100)}...`);
  
  try {
    let result, error;
    
    if (provider === 'ollama') {
      // NUOVO: Prepara prompt ottimizzato per Q4_0
      const optimizedPrompt = prepareOptimizedPrompt(input);
      ({ result, error } = await aiClient.callOllama(optimizedPrompt, debug));
    } else if (provider === 'chatgpt') {
      if (!apiKey) return res.status(400).json({ error: 'API key required for ChatGPT' });
      ({ result, error } = await aiClient.callChatGPT(input, apiKey, debug));
    } else {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    if (error) {
      console.error(`[${timestamp}] ERROR: ${error}`);
      return res.status(500).json({ error });
    }

    console.log(`[${timestamp}] Success`);
    console.log("result length:", result?.length || 0);
    res.json({ 
      response: result, 
      provider,
      ...(debug && { debug: result.debug })
    });
  } catch (err) {
    console.error(`[${timestamp}] CRASH:`, err);
    res.status(500).json({ 
      error: 'Internal server error',
      message: err.message
    });
  }
});

// NUOVO: Funzione per ottimizzare prompt per Q4_0
function prepareOptimizedPrompt(input) {
  // Aggiungi istruzioni semplificate all'inizio
  const prefix = `CRITICAL: Return ONLY valid JSON. No text before or after JSON.
EXAMPLE: {"rules":[...], "system":{...}, "form":{...}, "question":"...", "answer":"..."}

JSON CONTEXT:
`;
  
  const suffix = `

TASK: Update ONLY the answer field based on the question. Keep everything else unchanged.`;
  
  return prefix + input + suffix;
}

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 ===================================');
  console.log(`🚀 AI Server OPTIMIZED for Q4_0 on port ${PORT}`);
  console.log(`   🤖 Ollama: ${config.ollama.url}`);
  console.log(`   🧠 Model: ${MY_MODEL}`);
  console.log(`   🎛️  Temperature: ${config.ollama.options.temperature}`);
  console.log(`   ⏱️  Timeout: ${TIMEOUT_MS/1000}s`);
  console.log(`   💬 Test: curl -X POST http://localhost:3000/test-simple`);
  console.log('🚀 ===================================');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  server.close(() => process.exit(0));
});
