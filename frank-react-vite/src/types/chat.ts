/**
 * chat.ts
 * Chat Types
 * -----------------------
 * TypeScript types for the AI chat application.
 * - Defines AI providers, supported languages, server status
 * - Defines message structure, weather data, and AI request/response payloads
 * 
 * Author: Edoardo Sabatini
 * Date: 29 August 2025
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

/**
 * Represents a single chat message
 */
export interface ChatMessage {
  id: string;           // Unique message identifier
  type: 'user' | 'ai';  // Message sender type
  content: string;      // Message content
  timestamp: Date;      // Message timestamp
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
 * Structure of AI response
 */
export interface AIResponse {
  success: boolean;     // Indicates if request was successful
  response?: string;    // AI response text
  error?: string;       // Error message if request failed
}
