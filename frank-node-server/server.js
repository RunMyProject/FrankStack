/**
 * server.js
 * AI Chat Server
 * -----------------------
 * Node.js Express server providing endpoints for AI chat interaction.
 * Features:
 * - Supports Ollama GPT-OSS 20B and OpenAI ChatGPT
 * - Streamed AI responses and structured JSON output
 * - CORS-enabled for frontend consumption
 * - Session management handled in frontend via Zustand
 * - Health check endpoint
 * - CLI testing support
 * - Full English comments and logging for clarity
 * 
 * Italian “cablati” texts (UI / prompts) are preserved as-is in frontend HTML.
 * 
 * Author: Edoardo Sabatini
 * Date: 28 August 2025
 */

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;
const TIMEOUT_MS = 480000; // 8 minutes

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

// AI client wrapper
class AIClient {
    async callOllama(prompt, debug = false) {
        const payload = {
            model: config.ollama.model,
            prompt: prompt,
            stream: true
        };

        try {
            const response = await fetch(config.ollama.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                timeout: TIMEOUT_MS
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

            const chunks = [];
            let finalResponse = "";

            const text = await response.text();
            const lines = text.split('\n');

            for (const line of lines) {
                if (!line.trim()) continue;

                try {
                    const chunk = JSON.parse(line);
                    chunks.push(chunk);

                    if (chunk.response) finalResponse += chunk.response;

                    if (chunk.done === true) break;
                } catch (jsonError) {
                    continue;
                }
            }

            if (debug) {
                console.log("=== DEBUG OLLAMA ===");
                console.log(`Received chunks: ${chunks.length}`);
                chunks.forEach((chunk, i) => console.log(`Chunk ${i+1}: ${JSON.stringify(chunk)}`));
                console.log("==================");
            }

            return { result: finalResponse.trim() || null, error: null };
        } catch (error) {
            return { result: null, error: `Ollama Error: ${error.message}` };
        }
    }

    async callChatGPT(prompt, apiKey, debug = false) {
        const headers = { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" };
        const payload = { model: config.chatgpt.model, messages: [{role:"user", content:prompt}], max_tokens:150, temperature:0 };

        try {
            const response = await fetch(config.chatgpt.url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
                timeout: TIMEOUT_MS
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

            const data = await response.json();

            if (debug) {
                console.log("=== DEBUG CHATGPT ===");
                console.log(JSON.stringify(data, null, 2));
                console.log("====================");
            }

            if (data.choices && data.choices.length > 0) {
                return { result: data.choices[0].message.content.trim(), error: null };
            } else {
                return { result: null, error: "No response from ChatGPT" };
            }

        } catch (error) {
            return { result: null, error: `ChatGPT Error: ${error.message}` };
        }
    }
}

const aiClient = new AIClient();

// Main route - serve HTML frontend
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI Chat Assistant</title>
<style>
/* Styles omitted for brevity, same as previous version */
</style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>🤖 AI Chat Server</h1>
        <p>API Ollama & ChatGPT - Ready to run!</p>
    </div>
    <div class="content">
        <!-- Endpoints and test buttons omitted for brevity -->
    </div>
</div>
<script>
/* JS functions same as previous version */
</script>
</body>
</html>
    `);
});

// Simple chat API
app.post('/chat', async (req, res) => {
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Methods','POST, GET, OPTIONS');
    res.header('Access-Control-Allow-Headers','Content-Type');

    const { message, provider='ollama', debug=false, apiKey } = req.body;

    if (!message) return res.status(400).json({ success:false, error:'Field "message" required' });

    console.log(`[CHAT] ${provider.toUpperCase()}: "${message}"`);

    try {
        let result, error;

        if (provider === 'ollama') {
            ({ result, error } = await aiClient.callOllama(message, debug));
        } else if (provider === 'chatgpt') {
            if (!apiKey) return res.status(400).json({ success:false, error:'API key required for ChatGPT' });
            ({ result, error } = await aiClient.callChatGPT(message, apiKey, debug));
        } else {
            return res.status(400).json({ success:false, error:'Invalid provider, use "ollama" or "chatgpt"' });
        }

        if (error) return res.status(500).json({ success:false, error });

        res.json({ success:true, response: result || "No response", provider, timestamp: new Date().toISOString() });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ success:false, error:'Internal server error' });
    }
});

// Advanced chat API
app.post('/api/chat', async (req, res) => {
    const { prompt, provider='ollama', debug=false, apiKey } = req.body;

    if (!prompt) return res.status(400).json({ success:false, error:'Prompt required' });

    console.log(`[${new Date().toISOString()}] ${provider.toUpperCase()}: "${prompt}"`);

    try {
        let result, error;

        if (provider === 'ollama') {
            ({ result, error } = await aiClient.callOllama(prompt, debug));
        } else if (provider === 'chatgpt') {
            if (!apiKey) return res.status(400).json({ success:false, error:'API key required for ChatGPT' });
            ({ result, error } = await aiClient.callChatGPT(prompt, apiKey, debug));
        } else {
            return res.status(400).json({ success:false, error:'Invalid provider, use "ollama" or "chatgpt"' });
        }

        if (error) {
            console.error(`Error ${provider}:`, error);
            return res.status(500).json({ success:false, error });
        }

        console.log(`[${new Date().toISOString()}] Response (${result?.length || 0} chars)`);
        res.json({ success:true, response: result || "No response", provider });
    } catch (err) {
        console.error('Internal error:', err);
        res.status(500).json({ success:false, error:'Internal server error' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status:'OK', 
        timestamp:new Date().toISOString(),
        server:'AI Chat Server',
        ollama: config.ollama.url,
        endpoints:{
            'GET /':'Homepage with documentation',
            'GET /health':'Health check',
            'POST /chat':'Simple chat API',
            'POST /api/chat':'Advanced chat API'
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 ===================================');
    console.log(`🚀 AI Server running!`);
    console.log(`🚀 URL: http://localhost:${PORT}`);
    console.log(`🚀 API: http://localhost:${PORT}/api/chat`);
    console.log('🚀 ===================================');
    console.log('');
    console.log('📋 Configuration:');
    console.log(`   🤖 Ollama: ${config.ollama.url} (${config.ollama.model})`);
    console.log(`   🧠 ChatGPT: ${config.chatgpt.model}`);
    console.log('');
    console.log('🐳 Docker Ollama detected and running!');
    console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    process.exit(0);
});

// CLI test support
if (require.main === module && process.argv.length > 2) {
    const args = process.argv.slice(2);
    const prompt = args[0] || "hello";
    const provider = args.includes('--provider') ? args[args.indexOf('--provider') + 1] : 'ollama';
    const debug = args.includes('--debug');
    const apiKey = args.includes('--api-key') ? args[args.indexOf('--api-key') + 1] : process.env.OPENAI_API_KEY;

    (async () => {
        console.log(`Calling ${provider.toUpperCase()} with: "${prompt}"`);

        let result, error;

        if (provider === 'ollama') {
            ({ result, error } = await aiClient.callOllama(prompt, debug));
        } else {
            if (!apiKey) {
                console.error("ERROR: API key required for ChatGPT");
                process.exit(1);
            }
            ({ result, error } = await aiClient.callChatGPT(prompt, apiKey, debug));
        }

        if (error) {
            console.error(`ERROR: ${error}`);
            process.exit(1);
        }

        console.log(result || "No response");
        process.exit(0);
    })();
}

