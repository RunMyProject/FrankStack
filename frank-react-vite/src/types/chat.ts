/**
 * chat.ts
 * Chat Types
 * -----------------------
 * TypeScript types for the AI chat application.
 * - Defines AI providers, supported languages, server status
 * - Defines message structure, weather data, and AI request/response payloads
 * 
 * Author: Edoardo Sabatini
 * Date: 31 August 2025
 */

/**
 * Supported AI providers
 */
export type Provider = 'ollama' | 'chatgpt';


/**
 * Server connection status
 */
export type ServerStatus = 'connecting' | 'online' | 'offline';


/**
 * Supported chat languages
 */
export type Lang = 'Italian' | 'English';

/**
 * AI context interface
 */

/**
 * System-level context (fisso, AI non deve modificarlo)
 */
export interface SystemContext {
  maxWords: number | 50;
  user: string;
  userLang: Lang;
  aiName: string;
  currentDateTime: string;
  weather: string;
  temperatureWeather: number | 0;
  bookingSystemEnabled: boolean;
}

/**
 * Form da compilare dall'AI
 */
export interface FillForm {
  
  tripDeparture: string | "";
  tripDestination: string | "";
  dateTimeRoundTripDeparture: string | "";
  dateTimeRoundTripReturn: string | "";
  durationOfStayInDays: number | 0;
  travelMode: string | "";
  budget: number | 0;
  people: number | 0;
  starsOfHotel: number | 0;
  luggages: number | 0;
}

/**
 * Contesto AI complessivo
 */
export interface AIContext {
  system: SystemContext; // fissi
  form: FillForm;        // compilabili
  input: string;         // input utente
  output: string;        // output AI
}

/**
 * Represents a single chat message
 */
export interface ChatMessage {
  id: string;           // Unique message identifier
  type: 'user' | 'ai';  // Message sender type
  timestamp: Date;      // Message timestamp
  aIContext: AIContext;
}

/**
 * Structure of AI response
 */
export interface AIResponse {
  success: boolean;     // Indicates if request was successful
  response?: string;    // AI response text
  error?: string;       // Error message if request failed
}

/**
 * Payload for sending a message to the AI
 */
export interface AIRequestPayload {
  aIContext: AIContext;   // User message
  provider?: Provider;    // Selected AI provider
  apiKey?: string;        // Optional API key
  debug?: boolean;        // Optional debug flag
}

/**
 * Location information structure
 */
export interface LocationData {
  city: string;   // City name resolved from coordinates
  lat: number;    // Latitude in decimal degrees
  lon: number;    // Longitude in decimal degrees
}

/**
 * Weather information structure
 */
export interface WeatherData {
  icon: string;   // Weather icon code
  desc: string;   // Weather description
  temp: number;   // Temperature in Celsius
}
