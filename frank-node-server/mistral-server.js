// mistral-server.js — versione: prima chiamata attesa esplicitamente + separator + seconda chiamata come nella tua prima versione
const isDebug = true;
const express = require('express');
const cors = require('cors');
const http = require('http');
const app = express();

app.use(cors());
app.use(express.json());

// const MODEL = "mistral:7b-instruct-v0.2-q4_0";

const MODEL = "gemma2:9b-instruct-q4_0";
const TIMEOUT = 70000;

/*
Ho solo 8GB di VRAM CUDA
NAME                                      ID              SIZE      MODIFIED       
gemma2:9b-instruct-q4_0                   ff02c3702f32    5.4 GB    16 minutes ago    
phi4-mini-reasoning:latest                3ca8c2865ce9    3.2 GB    2 days ago        
llama3.2:1b                               baf6a787fdff    1.3 GB    2 days ago        
qwen2.5:3b                                357c53fb659c    1.9 GB    2 days ago        
mistral:7b-instruct-v0.2-q4_0             61e88e884507    4.1 GB    5 days ago        
adrienbrault/nous-hermes2pro:Q4_0-json    739cf988d7af    4.1 GB    6 days ago        
gpt-oss:20b                               aa4295ac10c3    13 GB     13 days ago    
*/

const keepAliveAgent = new http.Agent({ keepAlive: true, maxSockets: 5 });

function formatTimestamp(d = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())} - ${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

function parseAIListAndMerge(originalForm, aiResponseString) {
  const mergedForm = { ...originalForm }; // cloniamo il form originale

  // cerco il primo trattino, lì inizia la lista vera
  const startIdx = aiResponseString.indexOf('-');
  if (startIdx === -1) return mergedForm; // niente da parsare

  const listPart = aiResponseString.substring(startIdx);
  const items = listPart
    .split('-')
    .map(i => i.trim())
    .filter(Boolean);

  items.forEach(item => {
    const [key, val] = item.split(':').map(s => s.trim());
    if (!key) return;

    let value = val || "";

    // tolgo eventuali apici attorno
    value = value.replace(/^["']|["']$/g, '');

    // cast numerico se possibile
    if (!isNaN(value) && value !== '') value = Number(value);

    // aggiorno solo se la chiave esiste nel form originale
    if (mergedForm.hasOwnProperty(key)) {
      mergedForm[key] = value;
    }
  });

  return mergedForm;
}

function jsonToFlatList(obj) {
  let result = "";
  function flatten(o) {
    for (const [key, value] of Object.entries(o)) {
      if (value !== null && typeof value === "object") {
        if (Array.isArray(value)) {
          value.forEach((item, i) => {
            if (typeof item === "object") flatten(item);
            else if (typeof item === "string") result += `-${key}${i + 1}: '${item}'\n`;
            else result += `-${key}${i + 1}: ${item}\n`;
          });
        } else flatten(value);
      } else {
        if (typeof value === "string") result += `-${key}: '${value}'\n`;
        else result += `-${key}: ${value}\n`;
      }
    }
  }
  flatten(obj);
  return result;
}

function makeOllamaRequest(prompt, opts = {}) {
  const timeout = opts.timeout || TIMEOUT;
  const payload = {
    options: { temperature: 0.5, top_p: 0.85, top_k: 30, repeat_penalty: 1.1, num_predict: -1 },
    model: MODEL,
    prompt: prompt,
    stream: false
  };

  const bodyString = JSON.stringify(payload);

  console.log("bodyString: " + bodyString);

  const hasFetch = typeof fetch === 'function';

  if (hasFetch) {
    return new Promise(async (resolve, reject) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      try {
        if (isDebug) console.log(formatTimestamp(), "-> fetch to /api/generate");
        const resp = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: bodyString,
          signal: controller.signal
        });
        clearTimeout(timer);
        if (!resp.ok) return reject(new Error('HTTP ' + resp.status));
        const json = await resp.json();
        return resolve(json.response);
      } catch (err) {
        clearTimeout(timer);
        return reject(err);
      }
    });
  } else {
    return new Promise((resolve, reject) => {
      if (isDebug) console.log(formatTimestamp(), "-> http.request to /api/generate");
      const req = http.request({
        hostname: 'localhost',
        port: 11434,
        path: '/api/generate',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        agent: keepAliveAgent
      }, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          try {
            const json = JSON.parse(data);
            return resolve(json.response);
          } catch (err) {
            return reject(err);
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.setTimeout(timeout, () => {
        req.abort();
        reject(new Error('timeout'));
      });

      req.write(bodyString);
      req.end();
    });
  }
}

function getEmptyAndNoValidFields(form) {
  const result = [];

  const fieldsOrder = [
    "tripDeparture",
    "tripDestination",
    "dateTimeRoundTripDeparture",
    "dateTimeRoundTripReturn",
    "durationOfStayInDays",
    "travelMode",
    "budget",
    "people",
    "starsOfHotel",
    "luggages",
  ];

  for (const field of fieldsOrder) {
    const value = form[field];

    // controlli
    if (typeof value === "string") {
      if (value.trim() === "") {
        result.push({ campo: field, valore: value });
      }
    } else if (typeof value === "number") {
      if (value <= 0 || Number.isNaN(value)) {
        result.push({ campo: field, valore: value });
      }
    } else {
      // qualunque altro tipo considerato non valido
      result.push({ campo: field, valore: value });
    }
  }

  return result;
}

function choiceAnEmptyField(missingFields) {
  if (!Array.isArray(missingFields) || missingFields.length === 0) {
    return [];
  }

  // se c'è un solo campo, ritorna quello
  if (missingFields.length === 1) {
    return [missingFields[0].campo];
  }

  // scegli 2 indici diversi a caso
  const indices = new Set();
  while (indices.size < 2) {
    indices.add(Math.floor(Math.random() * missingFields.length));
  }

  return Array.from(indices).map(i => (missingFields[i].campo));
}

// Delimiters for AI prompt blocks
const DELIM_START_SYSTEM = "<|im_start|>system";
const DELIM_START_USER = "<|im_start|>user";
const DELIM_START_ASSISTANT = "<|im_start|>assistant";
const DELIM_END = "</|im_end|>";

// Wrap functions for each type
const wrapSystem = (line) => `${DELIM_START_SYSTEM}\n${line}\n${DELIM_END}\n`;
const wrapUser = (line) => `${DELIM_START_USER}\n${line}\n${DELIM_END}\n`;
const wrapAssistant = (line) => `${DELIM_START_ASSISTANT}\n${line}\n${DELIM_END}`;

// Function to extract human-readable answer
function extractHumanAnswer(aiResponse) {
  // Rimuove start/end e eventuali spazi iniziali/finali
  return aiResponse
    .replace(DELIM_START_ASSISTANT, '')
    .replace(DELIM_END, '')
    .trim();
}

// Schema di default del viaggio
const defaultTrip = {
  tripDeparture: "",
  tripDestination: "",
  dateTimeRoundTripDeparture: "",
  dateTimeRoundTripReturn: "",
  durationOfStayInDays: 0,
  travelMode: "",
  budget: 0,
  people: 0,
  starsOfHotel: 0,
  luggages: 0
};

/**
 * Converte e normalizza un input AI in JSON strutturato
 * @param {Object|string} aiResponse - Risposta AI (stringa JSON-like o oggetto parziale)
 * @returns {Object} JSON normalizzato secondo schema defaultTrip
 */
function convertToTripJson(aiResponse) {
  let parsed;

  if (typeof aiResponse === "string") {
    try {
      // Step 1: ripulisci dai backticks e dal tag ```json
      let clean = aiResponse
        .replace(/```json|```/gi, "")
        .trim();

      // Step 2: sostituisci gli apici singoli con doppi
      clean = clean.replace(/'/g, '"');

      // Step 3: JSON.parse sicuro
      parsed = JSON.parse(clean);
    } catch (e) {
      console.warn("⚠️ Parsing fallito, ritorno defaultTrip:", e.message);
      return { ...defaultTrip };
    }
  } else if (typeof aiResponse === "object" && aiResponse !== null) {
    parsed = aiResponse;
  } else {
    return { ...defaultTrip };
  }

  // Step 4: normalizza campi mancanti
  const result = { ...defaultTrip, ...parsed };
  return result;
}

/**
 * Merge intelligente tra due form identici di struttura
 * @param {Object} filledForm - Risultato AI con campi valorizzati (o vuoti)
 * @param {Object} originalForm - Form originale già popolato
 * @returns {Object} mergedForm - Originale aggiornato solo con i campi "nuovi" da filledForm
 */
function mergeForms(filledForm, originalForm) {
  const merged = { ...originalForm };

  for (const key of Object.keys(filledForm)) {
    const value = filledForm[key];

    // Regole: accetta solo valori "significativi"
    const isStringValid = typeof value === "string" && value.trim() !== "";
    const isNumberValid = typeof value === "number" && value !== 0;

    if (isStringValid || isNumberValid) {
      merged[key] = value;
    }
  }

  return merged;
}

app.post('/chat', async (req, res) => {
  
  const originalContext = req.body.aIContext || {};
  const promptJsonSystem = JSON.stringify(originalContext.system)
    .replace(/\\n/g, '')
    .replace(/"/g, "'");

  try {

    if(!originalContext.system.bookingSystemEnabled) {
        // --- CHIAMATA ZERO START: verifico esistenza di richiesta utente per una prenotazione
        const promptPlan0 =
            wrapSystem("You are a helpful parser.") + 
            wrapUser("Generates 'ok' if this natural-language " + originalContext.system.userLang + " sentence contains references to travel, vacations, reservations, or the like. Otherwise, return 'ko'.") +
            wrapUser("Sentence: " + originalContext.input) +
            wrapAssistant(""); // empty line for assistant start

        console.log(promptPlan0);
        console.log("\n" + formatTimestamp() + " >>> promptPlan0 (question) >>>\n", promptPlan0);

        const aiResponse0 = await makeOllamaRequest(promptPlan0, { timeout: TIMEOUT }); 
        const humanAnswer0 = extractHumanAnswer(aiResponse0);

        console.log(humanAnswer0);
        if(humanAnswer0!='ok') {
            
            //  and system data: " + promptJsonSystem) +

            const anyAiResponse = await makeOllamaRequest(originalContext.input, { timeout: TIMEOUT }); 
            const newContext = {
                system: originalContext.system,
                form: originalContext.form,
                input: originalContext.input,
                output: anyAiResponse
            }
            console.log({response: newContext });
            return res.json({ response: newContext });
        }

        originalContext.system.bookingSystemEnabled = true;
    }

    /***************************************** */    
    
    // attivato il processo di prenotazione: originalContext.system.bookingSystemEnabled

    const promptJson = JSON.stringify(originalContext.form)
    .replace(/\\n/g, '')
    .replace(/"/g, "'");

    // --- SECONDA CHIAMATA
    const promptPlanJSON =
        wrapSystem("You are an entity extractor from natural language sentences and system data: " + promptJsonSystem) +
        wrapUser("Compile a JSON object (give back the original structure without comments) in " +
            originalContext.system.userLang + " only: " + promptJson + " from sentence: " + originalContext.input) +
        wrapUser("It also uses system data, especially for dates, when the user does not clearly spell out dates. (example: tomorrow morning") +
        wrapUser("travelMode example: car, plane, train; dateTimeRoundTripReturn is an ISO date extracted from a natural language sentence") + 
        wrapUser("Sets the number of days of stay aligned with the dateTimeRoundTripDeparture and dateTimeRoundTripReturn fields") + 
        wrapAssistant(""); // empty line for assistant start

    console.log("--------------------");
    console.log("\n" + formatTimestamp() + " >>> promptPlanJSON (fill data) >>>\n", promptPlanJSON);
    const t1 = Date.now();
    const aiOutput = await makeOllamaRequest(promptPlanJSON, { timeout: TIMEOUT });
    console.log(formatTimestamp(), "<<< aiOutput (ms):", Date.now() - t1);
    if (isDebug) console.log("<<< aiOutput RAW:\n", aiOutput);

    const filledForm = convertToTripJson(aiOutput);

    console.log("--------------------");

    // mergeForm: filledForm + originalContext.form
    const mergeForm = mergeForms(filledForm, originalContext.form);

    console.log(mergeForm);

    const missingFields = getEmptyAndNoValidFields(mergeForm);
    const choiceFields = choiceAnEmptyField(missingFields);

    // --- CHIAMATA: genero la domanda
    const promptPlanQuestion =
        wrapSystem("You are a helpful assistant also using system data: " + promptJsonSystem) +
        wrapUser("Generate only in natural " + originalContext.system.userLang + " language a question asking for the missing fields: " + choiceFields) +
        wrapAssistant(""); // empty line for assistant start

    console.log(promptPlanQuestion);

    console.log("\n" + formatTimestamp() + " >>> promptPlanQuestion (question) >>>\n", promptPlanQuestion);
    const t0 = Date.now();
    const aiResponse = await makeOllamaRequest(promptPlanQuestion, { timeout: TIMEOUT }); 
    const humanAnswer = extractHumanAnswer(aiResponse);

    console.log(humanAnswer); 
 
    console.log(formatTimestamp(), "<<< Question (ms):", Date.now() - t0);

    // Stampa esplicita separator
    console.log('------------------------------------------------------------');
    console.log(`ho finito la prima chiamata, risultato: ${humanAnswer}`);
    console.log('------------------------------------------------------------');

    /* Piccola pulizia: se il modello ripete la destinazione più volte, deduplica le linee
    const lines = String(secondResponseRaw || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const unique = [...new Set(lines)];
    const cleaned = unique.join('\n');

    // Preparo il contesto: valorizzo i 2 campi come mi avevi chiesto prima (input e filledList)
    const context = originalContext;
    // mantengo come input IL MESSAGGIO UTENTE ORIGINALE se presente, altrimenti la firstResponse
    context.output = firstResponse;
    context.filledList = cleaned;

    // Log finale e invio
    console.log("\n" + formatTimestamp() + " >> FINAL FILLED LIST (cleaned):\n" + cleaned);
    console.log(formatTimestamp(), "<< RESPONSE SENT >>\n");

    // nell’endpoint
    const mergedForm = parseAIListAndMerge(originalContext.form || {}, cleaned);
    */
    
    /*
*/

    // const mergedForm = originalContext.form;
    const newContext = {
        system: originalContext.system,
        form: mergeForm,
        input: originalContext.input,
        output: humanAnswer
     };

     console.log({response: newContext });
     return res.json({ response: newContext });

   } catch (error) {
    console.error(formatTimestamp(), "Errore nella pipeline:", error && (error.stack || error.message) || String(error));
    return res.status(500).json({ error: "Errore nella comunicazione con il modello", detail: (error && error.message) || String(error) });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', model: MODEL, timestamp: new Date().toISOString(), service: 'AI Travel Agent' });
});

app.listen(3000, '0.0.0.0', () => {
  console.log('Server running on http://0.0.0.0:3000');
});
