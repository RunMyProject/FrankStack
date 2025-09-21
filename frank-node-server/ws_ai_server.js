/**
 * ws_ai_server.js
 * -----------------------
 * Node.js server using native HTTPS with AbortController for immediate stop.
 * Provides WebSocket endpoints for AI services (Ollama or ChatGPT).
 * Handles:
 *   - Preliminary analysis
 *   - Travel data extraction and form completion
 *   - Async AI calls with abort support
 *   - Health check endpoint
 * Uses MagicWords and MyUtility for logging and workflow management.
 * 
 * Author: Edoardo Sabatini
 * Date: 21 September 2025
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

app.use(express.json());
app.use(cors());

const OLLAMA_MODEL = "gemma2:9b-instruct-q4_0";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const TIMEOUT = 120000;

// ----------------------
// Map to track AbortControllers per WebSocket client
const abortControllers = new WeakMap();

// ----------------------
// HTTP request helper with abort support
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
                if (abortSignal.aborted) req.destroy();
                else data += chunk;
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
// Async AI helper
async function getResponse(prompt, provider, apiKey, abortSignal) {
    if (provider === 'chatgpt') {
        utils.log('Using ChatGPT API...');
        const requestBody = JSON.stringify({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.5
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

        if (response.choices?.length > 0) return response.choices[0].message.content;
        throw new Error('No response from ChatGPT API');
    } else {
        utils.log('Using Ollama API...');
        const requestBody = JSON.stringify({
            model: OLLAMA_MODEL,
            prompt: prompt,
            stream: false,
            options: { temperature: 0.5, top_p: 0.85, top_k: 30, repeat_penalty: 1.1, num_predict: -1 }
        });
        const response = await makeRequest('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(requestBody) },
            body: requestBody
        }, abortSignal);
        return response.response;
    }
}

// ----------------------
// WebSocket connection handling
wss.on('connection', ws => {
    utils.log('Client connected via WebSocket');
    const abortController = new AbortController();
    abortControllers.set(ws, abortController);

    ws.on('message', async message => {
        try {
            const payload = JSON.parse(message);

            if (payload.type === 'stop') {
                utils.log('🛑 Stop requested by client');
                abortController.abort();
                ws.send(JSON.stringify({ type: 'status', message: 'AI process stopped by client' }));
                return;
            }

            const originalContext = payload.aIContext;
            const provider = payload.provider || 'ollama';
            const apiKey = payload.apiKey;
            if (provider === 'chatgpt' && (!apiKey || !apiKey.trim())) throw new Error('API Key is required for ChatGPT provider');

            const bookingSystemEnabled = originalContext.system.bookingSystemEnabled;
            const userLang = originalContext.system.userLang;
            const promptJsonSystem = JSON.stringify(originalContext.system).replace(/\\n/g, '').replace(/"/g, "'");

            // Step 1: Preliminary analysis
            ws.send(JSON.stringify({ type: 'status', message: userLang === "Italian" ? 'Analisi preliminare...' : 'Preliminary analysis...' }));

            if (bookingSystemEnabled) {
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
        utils.log('WebSocket error: ' + error.message);
        const controller = abortControllers.get(ws);
        if (controller) { controller.abort(); abortControllers.delete(ws); }
    });
});

// ----------------------
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', model: OLLAMA_MODEL, timestamp: new Date().toISOString(), service: '🤖 FrankStack AI Assistant', stopSupport: true });
});

// ----------------------
// Server start
// ----------------------
const port = 3000;

server.listen(port, '0.0.0.0', () => {
    utils.info(mw.helloWorld());
    utils.info(`🤖 FrankStack AI Assistant Server running on http://0.0.0.0:${port}`);
    // utils.isDebug = true;
    utils.log('🚀 Stop functionality enabled with native HTTPS');
});
