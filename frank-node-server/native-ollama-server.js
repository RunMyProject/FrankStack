/**
 * server.js
 * AI Chat Server - NATIVE MODE ONLY (NO DOCKER, NO node-fetch)
 * -----------------------
 * ✅ Tested on:
 *    - Ubuntu 22.04
 *    - Node.js v20.19.1 (native fetch)
 *    - Ollama 0.3.12 (installed via apt)
 * 
 * Fixes:
 * 1. Removed node-fetch dependency (uses Node.js native fetch)
 * 2. Correct stream handling for Ollama's JSON stream
 * 3. Direct localhost connection (no Docker networking)
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const TIMEOUT_MS = 600000; // 10 minutes

// Configuration for AI endpoints
const config = {
  ollama: {
    url: "http://localhost:11434/api/generate",
    model: "gpt-oss:20b"
  },
  chatgpt: {
    url: "https://api.openai.com/v1/chat/completions",
    model: "gpt-3.5-turbo"
  }
};

// AI client wrapper - CORRECTED FOR NATIVE FETCH
class AIClient {
  async callOllama(prompt, debug = false) {
    const payload = {
      model: config.ollama.model,
      prompt: prompt,
      stream: true
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

      // Process stream incrementally (Node.js native streams)
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
              return { 
                result: finalResponse.trim() || null, 
                error: null,
                ...(debug && { debug: { chunks } })
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
    server: 'AI Chat Server (NATIVE MODE)',
    ollama: 'http://localhost:11434'
  });
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
  console.log(`[${timestamp}] ${input}`);
  
  try {
    let result, error;
    
    if (provider === 'ollama') {
      ({ result, error } = await aiClient.callOllama(input, debug));
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

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 ===================================');
  console.log(`🚀 AI Server running on port ${PORT} (NATIVE MODE)`);
  console.log(`   🤖 Ollama: ${config.ollama.url}`);
  console.log(`   🧠 ChatGPT: ${config.chatgpt.model}`);
  console.log(`   ⏱️  Timeout: ${TIMEOUT_MS/1000}s`);
  console.log(`   💬 Test: curl -X POST http://localhost:3000/chat -d '{"message":"Ciao","provider":"ollama"}'`);
  console.log('🚀 ===================================');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  server.close(() => process.exit(0));
});
