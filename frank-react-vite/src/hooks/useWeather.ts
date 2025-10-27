/**
 * useWeather.ts
 * Weather Hook
 * -----------------------
 * Custom hook to fetch and track current weather data.
 * - Retrieves weather from Open-Meteo API
 * - Maps weather codes to icons and localized descriptions
 * - Auto-refreshes every 30 minutes
 * - Waits for real GPS data before showing weather
 * 
 * Author: Edoardo Sabatini
 * Date: 27 October 2025
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import type { Lang, WeatherData, LocationData } from '../types/chat';
import { weatherCodeMap } from '../utils/weatherCodes';

console.log("VITE: ENV " + JSON.stringify(import.meta.env));

const locationProxyUrl = import.meta.env.VITE_LOCATION_PROXY_URL || 'http://localhost:3000/api/location/reverse';

/**
 * Helper function to fetch with a timeout
 */
const fetchWithTimeout = async (url: string, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error('[fetchWithTimeout] Fetch error:', err);
    throw err;
  } finally {
    clearTimeout(id);
  }
};

/**
 * Map internal chat Lang type to Open-Meteo language codes
 */
const langMap: Record<Lang, string> = {
  Italian: 'it',
  English: 'en'
};

/**
 * Map internal chat Lang type to IT/EN keys in weatherCodeMap
 */
const langKey: Record<Lang, 'IT' | 'EN'> = {
  Italian: 'IT',
  English: 'EN'
};

/**
 * Get current location using browser geolocation and reverse geocoding
 */
const getCurrentLocation = (lang: Lang): Promise<LocationData> => {

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
              // -----------------------------------
              // Reverse geocoding via backend proxy
              // -----------------------------------
              const query = `?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json&accept-language=${langMap[lang]}`;
            
              const data = await fetchWithTimeout(`${locationProxyUrl}${query}`, 15000);
              
              const city =
                data.address?.city ||
                data.address?.town ||
                data.address?.village ||
                data.address?.municipality ||
                data.address?.county ||
                data.address?.state ||
                'Unknown Location';

              resolve({ city, lat: position.coords.latitude, lon: position.coords.longitude });
        } catch (err) {
          if(err instanceof Error) {
            resolve({ city: 'Unknown Location', lat: position.coords.latitude, lon: position.coords.longitude });
          }
        }
      },
      (err) => reject(new Error(`GPS Error: ${err.message} (Code: ${err.code})`)),
      { timeout: 20000, enableHighAccuracy: true, maximumAge: 0 }
    );
  });
};

/**
 * Custom hook to fetch current weather and track location
 */
export const useCurrentWeather = (lang: Lang) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  /**
   * Fetch weather data for given coordinates
   */
  const loadWeather = useCallback(async (lat: number, lon: number) => {
    try {
      setIsLoadingWeather(true);
      setError(null);

      const data = await fetchWithTimeout(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto&language=${langMap[lang]}`
      );

      if (!data.current_weather) throw new Error('Weather data unavailable');

      const current = data.current_weather;

      const key = langKey[lang];
      const entry = weatherCodeMap[current.weathercode] || [
        "❓",
        { IT: "Condizioni sconosciute", EN: "Unknown conditions" }
      ];

      setWeather(prev => {
        const newWeather = { icon: entry[0], desc: entry[1][key], temp: Math.round(current.temperature) };
        if (!prev || prev.icon !== newWeather.icon || prev.temp !== newWeather.temp || prev.desc !== newWeather.desc) {
          return newWeather;
        }
        return prev;
      });

    } catch (err) {
      console.error('[loadWeather] Weather error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setWeather({
        icon: "⚠",
        desc: lang === 'Italian' ? "Weather unavailable" : "Weather unavailable",
        temp: 0
      });
    } finally {
      setIsLoadingWeather(false);
    }
  }, [lang]);

  /**
   * Initialize location and weather on mount / lang change
   */
  useEffect(() => {
    setIsLoadingLocation(true);
    setError(null);

    getCurrentLocation(lang)
      .then((loc) => {
        setLocation(loc);
        setIsLoadingLocation(false);
        return loadWeather(loc.lat, loc.lon);
      })
      .catch((err) => {
        console.error('[useCurrentWeather] GPS completely failed:', err);
        setIsLoadingLocation(false);
        setError(`Unable to get location: ${err.message}`);
      });
  }, [lang, loadWeather]);

  /**
   * Auto refresh weather every 30 minutes
   */
  useEffect(() => {
    if (!location || isLoadingLocation) return;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = window.setInterval(() => {
      loadWeather(location.lat, location.lon);
    }, 1800000); // 30 minutes

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [location, isLoadingLocation, loadWeather]);

  /**
   * Update only description when language changes
   */
  useEffect(() => {
    if (!weather || isLoadingWeather || weather.icon === '⚠') return;

    const currentCode = Object.keys(weatherCodeMap).find(code => 
      weatherCodeMap[parseInt(code)][0] === weather.icon
    );

    if (!currentCode) return;

    const entry = weatherCodeMap[parseInt(currentCode)];
    const key = langKey[lang];
    const newDesc = entry[1][key];

    if (weather.desc !== newDesc) {
      setWeather(prev => prev ? { ...prev, desc: newDesc } : null);
    }
  }, [lang, weather, isLoadingWeather]);

  const refreshWeather = useCallback(() => {
    if (location) loadWeather(location.lat, location.lon);
  }, [location, loadWeather]);

  return { 
    location, 
    weather, 
    isLoading: isLoadingLocation || isLoadingWeather,
    isLoadingLocation,
    isLoadingWeather, 
    error,
    refreshWeather 
  };
};
