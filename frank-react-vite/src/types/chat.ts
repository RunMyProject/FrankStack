/**
 * chat.ts
 * Chat Types
 * -----------------------
 * TypeScript types for the AI chat application.
 * - Defines AI providers, supported languages, server status
 * - Defines message structure, weather data, and AI request/response payloads
 * 
 * Author: Edoardo Sabatini
 * Date: 30 August 2025
 */

/**
 * Supported AI providers
 */
export type Provider = 'ollama' | 'chatgpt';

/**
 * Supported chat languages
 */
export type Lang = 'IT' | 'EN';

/**
 * Server connection status
 */
export type ServerStatus = 'connecting' | 'online' | 'offline';

/**
 * AI context interface
 */
export interface AIContext {
  //---
  maxWords: number;
  user: string;
  userLang: Lang;
  aiName: string;
  cityStart: string;
  //---
  cityEnd?: string;
  kindOfTravel?: string;
  maxBudget?: string;
  numberOfPeople?: string;
  starsOfHotel?: string;
  durationInDays?: string;
  dateTimeStart?: string;
  dateTimeEnd?: string;
  numberOfLuggage?: string;
  //---
  currentDateTime: string;
  weather: string;
  temperature: number;
  //---
  rules: string;
  question: string;
  answer?: string;
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
  message: string;      // User message
  provider: Provider;   // Selected AI provider
  apiKey?: string;      // Optional API key
  debug?: boolean;      // Optional debug flag
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
