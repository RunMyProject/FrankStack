/**
 * useWeather.ts
 * Weather Hook
 * -----------------------
 * Custom hook to fetch and track current weather data.
 * - Retrieves weather from Open-Meteo API
 * - Maps weather codes to icons and localized descriptions
 * - Auto-refreshes every 30 minutes
 * 
 * Author: Edoardo Sabatini
 * Date: 28 August 2025
 */

import { useEffect, useState } from 'react';
import type { Lang, WeatherData } from '../types/chat';
import { weatherCodeMap } from '../utils/weatherCodes';

/**
 * useWeather hook
 * @param lat Latitude of the location
 * @param lon Longitude of the location
 * @param lang Language for weather description ('IT' | 'EN')
 * @returns Current weather data (icon, description, temperature)
 */
export const useWeather = (lat: number, lon: number, lang: Lang) => {
  const [weather, setWeather] = useState<WeatherData>({
    icon: '☀',
    desc: lang === 'IT' ? 'Soleggiato' : 'Sunny',
    temp: 0
  });

  /**
   * Loads current weather from Open-Meteo API
   */
  const loadWeather = async () => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
      );
      const data = await response.json();
      const current = data.current_weather;
      const entry = weatherCodeMap[current.weathercode] || ["❓", { IT: "Condizioni sconosciute", EN: "Unknown conditions" }];
      setWeather({ icon: entry[0], desc: entry[1][lang], temp: current.temperature });
    } catch {
      setWeather({
        icon: "⚠",
        desc: lang === 'IT' ? "Meteo non disponibile" : "Weather unavailable",
        temp: 0
      });
    }
  };

  // Initial load and auto-refresh every 30 minutes
  useEffect(() => {
    loadWeather();
    const interval = setInterval(loadWeather, 1800000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, lat, lon]);

  return weather;
};
