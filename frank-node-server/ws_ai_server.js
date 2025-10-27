/**
 * ws_ai_server.js (12-Factor ready, Ollama dynamic URL)
 * ------------------------------------------------------
 * Node.js WebSocket AI server (Ollama / ChatGPT)
 * Env-configurable for port, model, timeout, provider defaults
 * ------------------------------------------------------
 * added /health endpoint and /testchat HTTP API
 * ------------------------------------------------------
 * added reverse geocoding proxy route for OpenStreetMap
 * ------------------------------------------------------
 *
 * Author: Edoardo Sabatini
 * Date: 27 October 2025
 * ------------------------------------------------------
 */

const express = require('express');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const cors = require('cors');
const { AbortController } = require('node-abort-controller');

const MagicWords = require('./magicWords');
const MyUtility = require('./myUtility');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const mw = new MagicWords();
const utils = new MyUtility();

app.use(cors());
app.use(express.json());

// ----------------------
// Proxy route for OpenStreetMap (reverse geocoding)
// ----------------------
const locationProxy = require('./routes/locationProxy');
app.use('/api/location', locationProxy);

// ==============================
// 12-Factor Config via ENV (gestione iniziale variabili)
 // Defaults chosen to be sensible for local dev; override via ENV in production.
const PORT = parseInt(process.env.NODE_PORT || process.env.PORT || '3000', 10);
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma2:9b-instruct-q4_0';
const OPENAI_URL = process.env.OPENAI_URL || 'https://api.openai.com/v1/chat/completions';
const TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT_MS || process.env.TIMEOUT_MS || '120000', 10);
const DEFAULT_PROVIDER = process.env.DEFAULT_PROVIDER || 'ollama';
const CHATGPT_MODEL = process.env.CHATGPT_MODEL || 'gpt-4o';
const TEMPERATURE = parseFloat(process.env.TEMPERATURE || '0.5');
const DEBUG = process.env.WS_AI_SERVER_DEBUG === 'true';
utils.isDebug = DEBUG;

// Ollama dynamic host/port -> builds OLLAMA_URL
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'localhost';
const OLLAMA_PORT = process.env.OLLAMA_PORT || '11434';
const OLLAMA_URL = process.env.OLLAMA_URL || `http://${OLLAMA_HOST}:${OLLAMA_PORT}/api/generate`;

// Log runtime config (non sensibile) at startup
utils.log(`Startup config: PORT=${PORT}, DEFAULT_PROVIDER=${DEFAULT_PROVIDER}, OLLAMA_MODEL=${OLLAMA_MODEL}`);
utils.log(`Ollama URL: ${OLLAMA_URL}`);
utils.log(`OpenAI URL: ${OPENAI_URL}`);
utils.log(`Timeout ms: ${TIMEOUT}`);
utils.log(`ChatGPT model: ${CHATGPT_MODEL}`);
utils.log(`Temperature: ${TEMPERATURE}`);

// ----------------------
// Map to track AbortControllers per WebSocket client
const abortControllers = new WeakMap();

// ----------------------
// HTTP request helper with abort support (uses TIMEOUT)
function makeRequest(url, options, abortSignal) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;

        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {},
            timeout: TIMEOUT
        };

        const req = client.request(requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => {
                if (abortSignal.aborted) {
                    req.destroy();
                } else {
                    data += chunk;
                }
            });
            res.on('end', () => {
                if (abortSignal.aborted) reject(new Error('Request aborted'));
                else if (res.statusCode < 200 || res.statusCode >= 300) reject(new Error(`HTTP ${res.statusCode}`));
                else {
                    try { resolve(JSON.parse(data)); } 
                    catch { reject(new Error('Invalid JSON response')); }
                }
            });
        });

        req.on('error', err => abortSignal.aborted ? reject(new Error('Request aborted')) : reject(err));
        req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });

        if (abortSignal.aborted) { req.destroy(); reject(new Error('Request aborted')); return; }
        abortSignal.addEventListener('abort', () => { req.destroy(); reject(new Error('Request aborted')); });

        if (options.body) req.write(options.body);
        req.end();
    });
}

// ----------------------
// Async AI helper (supports provider switch)
async function getResponse(prompt, provider, apiKey, abortSignal) {
    if (provider === 'chatgpt') {
        if (!apiKey || !apiKey.trim()) throw new Error('API Key required for ChatGPT provider');
        utils.log('Using ChatGPT provider');
        const requestBody = JSON.stringify({
            model: CHATGPT_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: TEMPERATURE
        });
        const response = await makeRequest(OPENAI_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            },
            body: requestBody
        }, abortSignal);

        if (response.choices?.length > 0) return response.choices[0].message?.content ?? response.choices[0].text;
        throw new Error('No response from ChatGPT API');
    } else {
        utils.log('Using Ollama provider at ' + OLLAMA_URL);
        const requestBody = JSON.stringify({
            model: OLLAMA_MODEL,
            prompt: prompt,
            stream: false,
            options: { temperature: TEMPERATURE, top_p: 0.85, top_k: 30, repeat_penalty: 1.2, num_predict: -1 }
        });
        const response = await makeRequest(OLLAMA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(requestBody) },
            body: requestBody
        }, abortSignal);
        // Ollama's response shape used in your original code: response.response
        if (typeof response === 'object' && 'response' in response) return response.response;
        // fallback: if the endpoint returns plain text parsed as JSON
        return response;
    }
}

// ----------------------
// WebSocket connection handling (main flow)
wss.on('connection', ws => {
    utils.log('Client connected via WebSocket');
    const abortController = new AbortController();
    abortControllers.set(ws, abortController);

    ws.on('message', async message => {
        try {
            const payload = JSON.parse(message);

            if (payload.type === 'stop') {
                utils.log('🛑 Stop requested by client (WS)');
                abortController.abort();
                ws.send(JSON.stringify({ type: 'status', message: 'AI process stopped by client' }));
                return;
            }

            const originalContext = payload.aIContext;
            const provider = payload.provider || DEFAULT_PROVIDER;
            const apiKey = payload.apiKey;

            if (provider === 'chatgpt' && (!apiKey || !apiKey.trim())) {
                throw new Error('API Key is required for ChatGPT provider');
            }

            const userLang = originalContext?.system?.userLang || 'English';
            const promptJsonSystem = JSON.stringify(originalContext.system || {}).replace(/\\n/g, '').replace(/"/g, "'");

            // Step 1: Preliminary analysis
            ws.send(JSON.stringify({ type: 'status', message: userLang === "Italian" ? 'Analisi preliminare...' : 'Preliminary analysis...' }));

            if (originalContext.system?.bookingSystemEnabled) {
                const isBackToNormalConversation = await mw.backToNormalConversation(originalContext, provider, apiKey, abortController.signal, getResponse);
                if (isBackToNormalConversation) {
                    originalContext.system.bookingSystemEnabled = false;
                    originalContext.form = { ...mw.defaultTrip };
                    const response = await mw.getNormalConversation(originalContext, promptJsonSystem, provider, apiKey, abortController.signal, getResponse);
                    ws.send(JSON.stringify({ type: 'final', data: response }));
                    return;
                }
            } else {
                const isNotBooking = await mw.IcantBook(originalContext, provider, apiKey, abortController.signal, getResponse);
                if (isNotBooking) {
                    const response = await mw.getNormalConversation(originalContext, promptJsonSystem, provider, apiKey, abortController.signal, getResponse);
                    ws.send(JSON.stringify({ type: 'final', data: response }));
                    return;
                }
                originalContext.system = originalContext.system || {};
                originalContext.system.bookingSystemEnabled = true;
            }

            // Step 2: Data extraction
            ws.send(JSON.stringify({ type: 'status', message: userLang === "Italian" ? 'Estrazione dati di viaggio...' : 'Extracting travel data...', data: { bookingSystemEnabled: true } }));
            const aiOutput = await mw.getProcessBooking(originalContext, promptJsonSystem, provider, apiKey, abortController.signal, getResponse);
            const filledForm = mw.convertToTripJson(aiOutput);
            const mergeForm = mw.mergeForms(filledForm, originalContext.form);

            utils.log("Merged form: " + JSON.stringify(mergeForm));

            // Step 3: Evaluate and request missing fields
            ws.send(JSON.stringify({ type: 'status', message: userLang === "Italian" ? 'Valutazione campi mancanti...' : 'Evaluating missing fields...', data: { form: mergeForm } }));
            const jsonResponse = await mw.getFinalBooking(originalContext, promptJsonSystem, mergeForm, provider, apiKey, abortController.signal, getResponse);
            ws.send(JSON.stringify({ type: 'final', data: jsonResponse }));

        } catch (error) {
            console.error('Error in WebSocket pipeline:', error);
            if (error.message === 'Request aborted') utils.log('🛑 Request aborted by client');
            ws.send(JSON.stringify({ type: 'error', message: 'Error: ' + error.message }));
        }
    });

    ws.on('close', () => {
        utils.log('Client disconnected');
        const controller = abortControllers.get(ws);
        if (controller) { controller.abort(); abortControllers.delete(ws); }
    });

    ws.on('error', error => {
        utils.log('WebSocket error: ' + (error?.message || error));
        const controller = abortControllers.get(ws);
        if (controller) { controller.abort(); abortControllers.delete(ws); }
    });
});

// ----------------------
// HTTP /testchat endpoint (API staccata: usa la stessa logica del WS ma in modalità request/response)
app.post('/testchat', async (req, res) => {
    try {
        const payload = req.body;
        const originalContext = payload.aIContext;
        const provider = payload.provider || DEFAULT_PROVIDER;
        const apiKey = payload.apiKey;

        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), TIMEOUT);

        try {
            if (provider === 'chatgpt' && (!apiKey || !apiKey.trim())) {
                return res.status(400).json({ success: false, error: 'API Key required for ChatGPT provider' });
            }

            const userLang = originalContext?.system?.userLang || 'English';
            const promptJsonSystem = JSON.stringify(originalContext.system || {}).replace(/\\n/g, '').replace(/"/g, "'");

            utils.log('HTTP /testchat request received');

            // Same logic that WS uses, but synchronous (single response)
            if (originalContext.system?.bookingSystemEnabled) {
                const backToNormal = await mw.backToNormalConversation(originalContext, provider, apiKey, abortController.signal, getResponse);
                if (backToNormal) {
                    originalContext.system.bookingSystemEnabled = false;
                    originalContext.form = { ...mw.defaultTrip };
                    const response = await mw.getNormalConversation(originalContext, promptJsonSystem, provider, apiKey, abortController.signal, getResponse);
                    return res.json({ success: true, data: response, type: 'normal' });
                }
            } else {
                const cannotBook = await mw.IcantBook(originalContext, provider, apiKey, abortController.signal, getResponse);
                if (cannotBook) {
                    const response = await mw.getNormalConversation(originalContext, promptJsonSystem, provider, apiKey, abortController.signal, getResponse);
                    return res.json({ success: true, data: response, type: 'normal' });
                }
                originalContext.system = originalContext.system || {};
                originalContext.system.bookingSystemEnabled = true;
            }

            const aiOutput = await mw.getProcessBooking(originalContext, promptJsonSystem, provider, apiKey, abortController.signal, getResponse);
            const filledForm = mw.convertToTripJson(aiOutput);
            const mergeForm = mw.mergeForms(filledForm, originalContext.form);

            utils.log('Merged form: ' + JSON.stringify(mergeForm));

            const finalResponse = await mw.getFinalBooking(originalContext, promptJsonSystem, mergeForm, provider, apiKey, abortController.signal, getResponse);

            res.json({
                success: true,
                data: finalResponse,
                form: mergeForm,
                type: 'booking'
            });

        } finally {
            clearTimeout(timeoutId);
        }

    } catch (error) {
        console.error('HTTP /testchat error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error processing request'
        });
    }
});

// ----------------------
// Health check endpoint (stampa le variabili e lo stato runtime)
app.get('/health', (req, res) => {
    const health = {
        status: 'OK',
        service: '🤖 FrankStack AI Assistant',
        timestamp: new Date().toISOString(),
        config: {
            port: PORT,
            defaultProvider: DEFAULT_PROVIDER,
            ollamaModel: OLLAMA_MODEL,
            chatgptModel: CHATGPT_MODEL,
            requestTimeoutMs: TIMEOUT,
            temperature: TEMPERATURE,
            openAiUrl: OPENAI_URL,
            ollamaUrl: OLLAMA_URL,
            ollamaHost: OLLAMA_HOST,
            ollamaPort: OLLAMA_PORT
        },
        stopSupport: true
    };
    res.json(health);
});

// ----------------------
// Server start
server.listen(PORT, '0.0.0.0', () => {
    utils.info(mw.helloWorld ? mw.helloWorld() : 'FrankStack AI Assistant');
    utils.info(`🤖 Server running on http://0.0.0.0:${PORT}`);
});
