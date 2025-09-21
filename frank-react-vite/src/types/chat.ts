/**
 * chat.ts
 * Chat Types
 * -----------------------
 * TypeScript type definitions for the AI chat application.
 *
 * Provides:
 *   - Supported AI providers and languages
 *   - Server connection status
 *   - Core context objects (system, form, AI context)
 *   - Chat message structure
 *   - Request and response payloads
 *   - Location and weather data types
 *
 * Author: Edoardo Sabatini
 * Date: September 21, 2025
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
 * AI status state
 */
export interface AIStatus {
  msg: string;   // Status message
  status: 'stopped' | 'cancel' | 'thinking' | 'processing' | 'error' | 'done'; // Current state
  data: unknown; // Additional data, type-safe but flexible
}

/**
 * System-level context
 * (Fixed values, should not be modified by AI)
 */
export interface SystemContext {
  maxWords: number | 50;          // Max words allowed per AI response
  user: string;                   // Current user identifier
  userLang: Lang;                 // Preferred language
  aiName: string;                 // AI display name
  currentDateTime: string;        // Current system datetime
  weather: string;                // Weather description
  temperatureWeather: number | 0; // Temperature in Celsius
  bookingSystemEnabled: boolean;  // Whether booking integration is enabled
}

/**
 * Form data to be filled by the AI
 */
export interface FillForm {
  tripDeparture: string | "";              // Departure location
  tripDestination: string | "";            // Destination location
  dateTimeRoundTripDeparture: string | ""; // Outbound departure datetime
  dateTimeRoundTripReturn: string | "";    // Return trip datetime
  durationOfStayInDays: number | 0;        // Length of stay in days
  travelMode: string | "";                 // Transportation mode
  budget: number | 0;                      // Estimated budget
  people: number | 0;                      // Number of travelers
  starsOfHotel: number | 0;                // Desired hotel rating
  luggages: number | 0;                    // Number of luggage items
}

/**
 * Complete AI context object
 */
export interface AIContext {
  system: SystemContext; // Fixed system-level data
  form: FillForm;        // Form fields to be filled
  input: string;         // User input message
  output: string;        // AI output response
}

/**
 * Represents a single chat message
 */
export interface ChatMessage {
  id: string;           // Unique message identifier
  type: 'user' | 'ai';  // Message sender type
  timestamp: Date;      // Message timestamp
  aIContext: AIContext; // Context snapshot at the time of message
}

/**
 * Structure of an AI response
 */
export interface AIResponse {
  success: boolean;     // Whether the request succeeded
  response?: string;    // AI response text if successful
  error?: string;       // Error message if failed
}

/**
 * Payload for sending a message to the AI
 */
export interface AIRequestPayload {
  aIContext: AIContext;   // Context including user message
  provider?: Provider;    // Selected AI provider
  apiKey?: string;        // Optional API key
  debug?: boolean;        // Optional debug flag
}

/**
 * Location information
 */
export interface LocationData {
  city: string;   // City name resolved from coordinates
  lat: number;    // Latitude (decimal degrees)
  lon: number;    // Longitude (decimal degrees)
}

/**
 * Weather information
 */
export interface WeatherData {
  icon: string;   // Weather icon code
  desc: string;   // Weather description
  temp: number;   // Temperature in Celsius
}
