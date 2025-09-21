/**
 * magicWords.js
 * -----------------------
 * Utility class for text wrapping with Ollama delimiters
 * and AI response processing.
 * Provides:
 *   - wrapSystem/wrapUser/wrapAssistant
 *   - extractHumanAnswer()
 *   - getEmptyAndNoValidFields(), choiceTwoOrAnEmptyField()
 *   - convertToTripJson(), mergeForms()
 *   - Async functions for AI prompts and booking workflow
 * Uses arrow functions and MyUtility for logging.
 * 
 * Author: Edoardo Sabatini
 * Date: 21 September 2025
 */

const MyUtility = require('./myUtility');
const utils = new MyUtility();

class MagicWords {
    constructor() {
        // ----------------------
        // Delimiters for Ollama-like wrapping
        this.DELIM_START_SYSTEM = "<|im_start|>system";
        this.DELIM_START_USER = "<|im_start|>user";
        this.DELIM_START_ASSISTANT = "<|im_start|>assistant";
        this.DELIM_END = "</|im_end|>";

        // ----------------------
        // Default trip template with all fields initialized
        this.defaultTrip = {
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

        // ----------------------
        // Simple test method
        this.helloWorld = () => "Hello World 🌍";

        // ----------------------
        // Wrapping methods
        // Wrap a string with the appropriate Ollama delimiter for system, user, or assistant
        this.wrapSystem = line => `${this.DELIM_START_SYSTEM}\n${line}\n${this.DELIM_END}\n`;
        this.wrapUser = line => `${this.DELIM_START_USER}\n${line}\n${this.DELIM_END}\n`;
        this.wrapAssistant = line => `${this.DELIM_START_ASSISTANT}\n${line}\n${this.DELIM_END}`;

        // ----------------------
        // Extract human-readable answer from AI response
        this.extractHumanAnswer = (aiResponse, provider) => {
            if (provider === 'chatgpt') return aiResponse;
            return aiResponse
                .replace(this.DELIM_START_ASSISTANT, '')
                .replace(this.DELIM_END, '')
                .trim();
        };

        // ----------------------
        // Utility: find empty or invalid fields in a form object
        this.getEmptyAndNoValidFields = form => {
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
                if (typeof value === "string") {
                    if (value.trim() === "") result.push({ field, value });
                } else if (typeof value === "number") {
                    if (value <= 0 || Number.isNaN(value)) result.push({ field, value });
                } else {
                    result.push({ field, value });
                }
            }
            return result;
        };

        // ----------------------
        // Utility: randomly choose one or two missing fields from an array
        this.choiceTwoOrAnEmptyField = missingFields => {
            if (!Array.isArray(missingFields) || missingFields.length === 0) return [];
            if (missingFields.length === 1) return [missingFields[0].field];
            const indices = new Set();
            while (indices.size < 2) indices.add(Math.floor(Math.random() * missingFields.length));
            return Array.from(indices).map(i => missingFields[i].field);
        };

        // ----------------------
        // Convert AI response string or object to a valid trip JSON
        this.convertToTripJson = aiResponse => {
            let parsed;
            if (typeof aiResponse === "string") {
                try {
                    let clean = aiResponse.replace(/```json|```/gi, "").trim();
                    clean = clean.replace(/'/g, '"');
                    parsed = JSON.parse(clean);
                } catch (e) {
                    utils.log("⚠️ Parsing failed, returning defaultTrip: " + e.message);
                    return { ...this.defaultTrip };
                }
            } else if (typeof aiResponse === "object" && aiResponse !== null) {
                parsed = aiResponse;
            } else {
                return { ...this.defaultTrip };
            }
            return { ...this.defaultTrip, ...parsed };
        };

        // ----------------------
        // Merge filled form into original form, keeping only valid values
        this.mergeForms = (filledForm, originalForm) => {
            const merged = { ...originalForm };
            for (const key of Object.keys(filledForm)) {
                const value = filledForm[key];
                const isStringValid = typeof value === "string" && value.trim() !== "";
                const isNumberValid = typeof value === "number" && value !== 0;
                if (isStringValid || isNumberValid) merged[key] = value;
            }
            return merged;
        };

        // ----------------------
        // ASYNC FUNCTIONS FOR AI REASONING
        // Each function generates prompts, calls getResponse, and logs outputs

        this.IcantBook = async (originalContext, provider, apiKey, abortSignal, getResponse) => {
            const prompt =
                this.wrapSystem("You are a helpful parser.") +
                this.wrapUser(
                    "Generates 'ok' if this natural-language " + originalContext.system.userLang +
                    " sentence contains references to travel, vacations, reservations, or the like." +
                    " Otherwise, return 'ko'."
                ) +
                this.wrapUser("Sentence: " + originalContext.input) +
                this.wrapAssistant("");
            utils.log("prompt/question\n" + prompt);
            const aiResponse = await getResponse(prompt, provider, apiKey, abortSignal);
            utils.log(aiResponse);
            return (aiResponse.trim() != 'ok');
        };

        this.backToNormalConversation = async (originalContext, provider, apiKey, abortSignal, getResponse) => {
            const prompt =
                this.wrapSystem("You are a helpful parser.") +
                this.wrapUser(
                    "Generates 'ok' if this natural-language " + originalContext.system.userLang +
                    " sentence contains interruption intentions (examples: I want to interrupt," + 
                    " I don't want to book anymore, tiredness, etc.). " +
                    " Otherwise, return 'ko'."
                ) +
                this.wrapUser("Sentence: " + originalContext.input) +
                this.wrapAssistant("");
            utils.log("prompt/question\n" + prompt);
            const aiResponse = await getResponse(prompt, provider, apiKey, abortSignal);
            utils.log(aiResponse);
            return (aiResponse.trim() != 'ko');
        };

        this.getNormalConversation = async (originalContext, promptJsonSystem, provider, apiKey, abortSignal, getResponse) => {
            const prompt =
                this.wrapSystem("You are a helpful assistant using system data: " + promptJsonSystem) +
                this.wrapUser(
                    "Generate only in natural " + originalContext.system.userLang +
                    " language for user input sentence:" + originalContext.input
                ) +
                this.wrapUser("without '<|im_start|>' or similar and with friendly emoji") +
                this.wrapAssistant("");
            utils.log("prompt/normal conversation\n" + prompt);
            const anyAiResponse = await getResponse(prompt, provider, apiKey, abortSignal);
            const newContext = {
                system: originalContext.system,
                form: originalContext.form,
                input: originalContext.input,
                output: anyAiResponse
            };
            const jsonResponse = { response: newContext };
            utils.log(jsonResponse);
            return jsonResponse;
        };

        this.getProcessBooking = async (originalContext, promptJsonSystem, provider, apiKey, abortSignal, getResponse) => {
            const promptJson = JSON.stringify(originalContext.form)
                .replace(/\\n/g, '')
                .replace(/"/g, "'");
            const prompt =
                this.wrapSystem("You are an entity extractor from natural language sentences and" +
                    " system data: " + promptJsonSystem) +
                this.wrapUser(
                    "Compile a JSON object (original structure, no comments) in " +
                    originalContext.system.userLang + " only: " + promptJson +
                    " from sentence: " + originalContext.input
                ) +
                this.wrapUser("Also uses system data, e.g., dates, when not explicitly mentioned.") +
                this.wrapUser("travelMode example: bus, car, plane; dateTimeRoundTripReturn is ISO date extracted from sentence") +
                this.wrapUser("Sets duration aligned with departure and return dates") +
                this.wrapUser("TravelMode translated into English; numerical expressions parsed") + 
                this.wrapUser("Allow user to edit existing fields") +
                this.wrapUser("Overwrite fields if user specifies corrections") +
                this.wrapAssistant("");
            utils.log("\n" + "prompt/fill data\n", prompt);
            const aiOutput = await getResponse(prompt, provider, apiKey, abortSignal);
            utils.log("aiOutput RAW:\n", aiOutput);
            return aiOutput;
        };

        this.getFinalBooking = async (originalContext, promptJsonSystem, mergeForm, provider, apiKey, abortSignal, getResponse) => {
            const missingFields = this.getEmptyAndNoValidFields(mergeForm);
            const choiceFields = this.choiceTwoOrAnEmptyField(missingFields);

            const prompt =
                this.wrapSystem("You are a helpful assistant also using system data: " + promptJsonSystem) +
                this.wrapUser("Generate only in natural " + originalContext.system.userLang +
                    " language a question asking for the missing fields: " + choiceFields) +
                this.wrapAssistant("");
            utils.log(prompt);
            utils.log("\nprompt/question\n", prompt);
            const aiOutput = await getResponse(prompt, provider, apiKey, abortSignal);
            const humanAnswer = this.extractHumanAnswer(aiOutput, provider);
            utils.log(humanAnswer);
            const newContext = {
                system: originalContext.system,
                form: mergeForm,
                input: originalContext.input,
                output: humanAnswer
            };
            const jsonResponse = { response: newContext };
            utils.log(jsonResponse);
            return jsonResponse;
        };
    }
}

// CommonJS export
module.exports = MagicWords;
