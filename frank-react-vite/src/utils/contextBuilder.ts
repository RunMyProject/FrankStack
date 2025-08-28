/**
 * contextBuilder.ts
 * AI Context Builder
 * -----------------------
 * Utility function to construct a context string for AI requests.
 * - Includes max words, date/time, AI name, location, weather, and user information
 * - Designed to be prepended to user messages before sending to the AI
 * 
 * Author: Edoardo Sabatini
 * Date: 28 August 2025
 */

import { formatDateTime } from './datetime';
import type { WeatherData } from '../types/chat';

/**
 * Constructs the AI context string.
 * @param maxWords Maximum number of words allowed for AI response
 * @param aiName Name of the AI assistant
 * @param locationName Name of the user's location
 * @param weather Current weather data
 * @param userName Name of the user
 * @returns Formatted context string for AI
 */
export const buildAIContext = (
  maxWords: number,
  aiName: string,
  locationName: string,
  weather: WeatherData,
  userName: string
): string => {
  const dateTime = formatDateTime(new Date());
  return `Max words: ${maxWords} | ${dateTime} | AI Name: ${aiName} | ${locationName} - ${weather.desc} - ${weather.temp}°C | User: ${userName}\n\n`;
};
