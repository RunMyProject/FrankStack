/**
 * ai_server.js
 * -----------------------
 *
 * Author: Edoardo Sabatini
 * Date: 9 September 2025
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const app = express();
const request = require('sync-request');

app.use(cors());
app.use(express.json());

const MODEL = "gemma2:9b-instruct-q4_0";
const TIMEOUT = 70000;

function getTimeStamp() {
    const now = new Date();
    const timeMsg = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return timeMsg;
}

function log(message) {
    console.log(getTimeStamp() + '->' + message);
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
        result.push({ field: field, valore: value });
      }
    } else if (typeof value === "number") {
      if (value <= 0 || Number.isNaN(value)) {
        result.push({ field: field, valore: value });
      }
    } else {
      // qualunque altro tipo considerato non valido
      result.push({ field: field, valore: value });
    }
  }

  return result;
}

function choiceTwoOrAnEmptyField(missingFields) {
  if (!Array.isArray(missingFields) || missingFields.length === 0) {
    return [];
  }

  // se c'è un solo field, ritorna quello
  if (missingFields.length === 1) {
    return [missingFields[0].field];
  }

  // scegli 2 indici diversi a caso
  const indices = new Set();
  while (indices.size < 2) {
    indices.add(Math.floor(Math.random() * missingFields.length));
  }

  return Array.from(indices).map(i => (missingFields[i].field));
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

function IcantBook(originalContext) {
    const prompt =
        wrapSystem("You are a helpful parser.") + 
        wrapUser("Generates 'ok' if this natural-language " + originalContext.system.userLang 
          + " sentence contains references to travel, vacations, reservations, or the like. Otherwise, return 'ko'.") +
        wrapUser("Sentence: " + originalContext.input) +
        wrapAssistant("");
    log("prompt/question\n" + prompt);
    const aiResponse = getResponse(prompt);
    log(aiResponse);
    return (aiResponse.trim()!='ok');
}

function getNormalConversation(originalContext, promptJsonSystem) {
    const prompt =
        wrapSystem("You are a helpful assistant using system data: " + promptJsonSystem) +
        wrapUser("Generate only in natural " + originalContext.system.userLang 
          + " language for user input sentence:" + originalContext.input) +
        wrapAssistant(""); 
    log("prompt/normal conversation\n" + prompt);
    const anyAiResponse = getResponse(prompt);
    const newContext = {
        system: originalContext.system,
        form: originalContext.form,
        input: originalContext.input,
        output: anyAiResponse
    }
    const jsonResponse = { response: newContext };
    log(jsonResponse);
    return jsonResponse;
}

function getProcessBooking(originalContext, promptJsonSystem) {
    const promptJson = JSON.stringify(originalContext.form)
      .replace(/\\n/g, '')
      .replace(/"/g, "'");
    const prompt =
        wrapSystem("You are an entity extractor from natural language sentences and system data: " + promptJsonSystem) +
        wrapUser("Compile a JSON object (give back the original structure without comments) in " +
            originalContext.system.userLang + " only: " + promptJson + " from sentence: " + originalContext.input) +
        wrapUser("It also uses system data, especially for dates, when the user does not clearly spell out dates. (example: tomorrow morning") +
        wrapUser("travelMode example: car, plane, train; dateTimeRoundTripReturn is an ISO date extracted from a natural language sentence") + 
        wrapUser("Sets the number of days of stay aligned with the dateTimeRoundTripDeparture and dateTimeRoundTripReturn fields") + 
        wrapAssistant(""); 
    log("\n" + "prompt (fill data)\n", prompt);
    const aiOutput = getResponse(prompt);
    log("aiOutput RAW:\n", aiOutput);
    return aiOutput;
}

function getMergeFormAndFinalBooking(originalContext, promptJsonSystem, filledForm) {
      // mergeForm: filledForm + originalContext.form
      const mergeForm = mergeForms(filledForm, originalContext.form);
      log(mergeForm);
      const missingFields = getEmptyAndNoValidFields(mergeForm);
      const choiceFields = choiceTwoOrAnEmptyField(missingFields);
  
      const prompt =
        wrapSystem("You are a helpful assistant also using system data: " + promptJsonSystem) +
        wrapUser("Generate only in natural " + originalContext.system.userLang 
          + " language a question asking for the missing fields: " + choiceFields) +
        wrapAssistant(""); 
      log(prompt);
      log("\nprompt/question\n", prompt);
      const aiOutput = getResponse(prompt);
      const humanAnswer = extractHumanAnswer(aiOutput);
      log(humanAnswer);    
      const newContext = {
          system: originalContext.system,
          form: mergeForm,
          input: originalContext.input,
          output: humanAnswer
      };
      const jsonResponse = { response: newContext };
      log(jsonResponse);
      return jsonResponse;
}

app.post('/chat', async (req, res) => {
  try {
      const originalContext = req.body.aIContext || {};
      const promptJsonSystem = JSON.stringify(originalContext.system)
      .replace(/\\n/g, '')
      .replace(/"/g, "'");

      // Check first control booking
      if(!originalContext.system.bookingSystemEnabled) {
            if(IcantBook(originalContext)) return res.json(getNormalConversation(originalContext, promptJsonSystem));
            originalContext.system.bookingSystemEnabled = true;
      }
    
      // enabled Process Booking with originalContext.system.bookingSystemEnabled    
      //
      const filledForm = convertToTripJson(getProcessBooking(originalContext, promptJsonSystem));
      const jsonResponse = getMergeFormAndFinalBooking(originalContext, promptJsonSystem, filledForm);      
      return res.json(jsonResponse);

   } catch (error) {
      console.error(getTimeStamp(), "Errore nella pipeline:", error && (error.stack || error.message) || String(error));
      return res.status(500).json({ error: "Errore nella comunicazione con il modello", detail: (error && error.message) || String(error) });
  }
});

function getResponse(prompt) {
  const res = request('POST', 'http://localhost:11434/api/generate', {
    json: {
      model: MODEL,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.5,
        top_p: 0.85,
        top_k: 30,
        repeat_penalty: 1.1,
        num_predict: -1
      }
    },
    timeout: TIMEOUT
  });

  if (res.statusCode === 200) {
    const json = JSON.parse(res.getBody('utf8'));
    return json.response;
  } else {
    throw new Error(`HTTP ${res.statusCode}`);
  }
}

app.get('/health', (req, res) => {
  res.json({ status: 'OK', model: MODEL, timestamp: new Date().toISOString(), service: 'AI Travel Agent' });
});

app.listen(3000, '0.0.0.0', () => {
  console.log('Server running on http://0.0.0.0:3000');
});
