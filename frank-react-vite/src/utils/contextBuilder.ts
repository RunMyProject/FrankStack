/**
 * contextBuilder.ts
 * AI Context Builder
 * -----------------------
 * Utility function to construct a structured JSON context for AI requests.
 * - Includes max words, date/time, AI name, location, weather, and user info
 * - Designed to be prepended to user messages before sending to the AI
 * 
 * Author: Edoardo Sabatini
 * Last Update: 29 August 2025
 */

import { formatDateTime } from './datetime';
import { useAuthStore } from '../store/useAuthStore';

export const buildAIContext = (aiName: string, userMessage: string): string => {
  const { aiContext, user } = useAuthStore.getState();

  const maxWords = aiContext?.maxWords || 300;
  const userName = user || 'Unknown';
  const lang = aiContext?.lang || 'EN';
  const cityStart = aiContext?.locationData?.city || 'Unknown';
  const weatherDesc = aiContext?.weatherData?.desc || 'N/A';
  const weatherTemp = aiContext?.weatherData?.temp ?? 0;
  const dateTime = formatDateTime(new Date());

  return JSON.stringify({
    maxWords,
    user: userName,
    userLang: lang,
    aiName,
    cityStart,
    cityEnd: "?",
    kindOfTravel: "?",
    maxBudget: "?",
    numberOfPeople: "?",
    starsOfHotel: "?",
    durationInDays: "?",
    dateTimeStart: "?",
    dateTimeEnd: "?",
    numberOfLuggage: "?",
    currentDateTime: dateTime,
    weather: weatherDesc,
    temperature: weatherTemp,
    userMessage,
    answer: "*",
    rules: [
      "If some required fields are missing, include them in 'missingFields': [ ... ] and set 'answer' to a natural message asking for missing info.",
      "If all fields are present, set 'answer' to 'ok' (or another short confirmation).",
      "Numbers must be numbers, strings must be strings, dates in ISO format.",
      "Return only JSON, no extra explanations or comments."
    ]
  });
};
