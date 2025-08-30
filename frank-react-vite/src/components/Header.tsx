/**
 * Header.tsx
 * Chat Header Component
 * -----------------------
 * Displays the header for the AI chat interface.
 * Features:
 * - Server status with color indicators
 * - User badge with logout functionality
 * - Language selector (IT/EN)
 * - Interactive weather widget (location, temperature, icon)
 * - Chat assistant title
 * - Provider selection (Ollama / ChatGPT)
 * - Debug toggle button
 * - API key input for ChatGPT when selected
 * 
 * Author: Edoardo Sabatini
 * Date: 30 August 2025
 */

import React, { useEffect, useRef } from 'react';
import type { Lang, Provider, ServerStatus } from '../types/chat';
import { useCurrentWeather } from '../hooks/useWeather';
import { useAuthStore } from '../store/useAuthStore';

type HeaderProps = {
  currentProvider: Provider;
  setCurrentProvider: (p: Provider) => void;
  serverStatus: ServerStatus;
  apiKey: string;
  setApiKey: (k: string) => void;
  toggleDebug: () => void;
  debugMode: boolean;
};

// Helper function to abbreviate specific cities
const abbreviateCity = (city: string): string => {
  if (!city) return '';
  const customAbbr: Record<string,string> = {
    'Cinisello Balsamo': 'Cinisello B.',
    'San Giovanni Valdarno': 'S. Giovanni V.',
    'Reggio Emilia': 'Reggio E.'
  };
  return customAbbr[city] || city;
};

const Header: React.FC<HeaderProps> = ({
  currentProvider,
  setCurrentProvider,
  serverStatus,
  apiKey,
  setApiKey,
  toggleDebug,
  debugMode
}) => {

  // ----- Zustand  / AI configuration - usa selector per minimizzare ri-render -----
  const aIContext = useAuthStore(state => state.aIContext);
  const updateAIContext = useAuthStore(state => state.updateAIContext);

  const { location, weather, isLoading, error, refreshWeather } = useCurrentWeather(aIContext.userLang);
  const lastUpdateRef = useRef<string>('');

  // ---- effect sulla weather update: limitare dipendenze ----
  // ---- Importante: non mettere aIContext intero nelle dipendenze - solo i campi che usi (userLang) e updateAIContext. ---
  useEffect(() => {
    if (location && weather && !isLoading && !error) {
      const currentDataKey = `${location.city}-${location.lat}-${location.lon}-${weather.icon}-${weather.temp}-${aIContext.userLang}`;
      if (lastUpdateRef.current !== currentDataKey) {
        // PASSA SOLO I CAMPI MODIFICATI
        updateAIContext({
          weather: weather.desc,
          temperature: weather.temp,
          cityStart: location.city
        });
        lastUpdateRef.current = currentDataKey;
      }
      }
  }, [location, weather, isLoading, error, aIContext.userLang, updateAIContext]);

  // Safe defaults
  const cityRaw = location?.city || (isLoading ? 'Loading...' : 'Unknown');
  const city = abbreviateCity(cityRaw);
  const temp = weather?.temp ?? 0;
  const desc = weather?.desc ?? (aIContext.userLang === 'IT' ? 'Caricamento...' : 'Loading...');
  const icon = weather?.icon ?? '🌤';

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 relative pb-20 md:pb-13">

      {/* Server status indicator */}
      <div
        className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs ${
          serverStatus === 'online' ? 'bg-green-500/30' :
          serverStatus === 'offline' ? 'bg-red-500/30' : 'bg-yellow-500/30'
        }`}
      >
        {serverStatus === 'online' ? '🟢 Server Online' :
         serverStatus === 'offline' ? '🔴 Server Offline' : '🟡 Connecting...'}
      </div>

      {/* User badge with logout */}
      <div
        className="absolute top-12 left-4 w-10 h-10 bg-white/90 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg cursor-pointer shadow hover:scale-110 transition-transform"
        title={`Logout (${aIContext.user})`}
        onClick={() => window.dispatchEvent(new CustomEvent('logout'))} 
      >
        {aIContext.user.charAt(0).toUpperCase()}
      </div>

      {/* Language selector */}
      <div className="absolute top-5 right-5 flex gap-2 z-10">
        {(['IT','EN'] as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => { updateAIContext({ userLang: l})} }
            className={`px-3 py-1 text-xs rounded-full border transition-all ${
              aIContext.userLang === l ? 'bg-white text-indigo-600' : 'border-white/50 hover:bg-white/10'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Interactive weather widget */}
      <div
        className="absolute top-14 right-5 bg-white/20 text-white px-3 py-1 rounded-xl text-sm flex items-center gap-2 weather-hover z-10
                  transition-transform duration-200 hover:scale-110 hover:bg-white/30 hover:shadow-lg cursor-pointer mt-4"
        title={error ? `Weather error: ${error}` : `${city} - ${desc} - ${temp}°C`}
        onClick={() => !isLoading && !error && refreshWeather?.()}
      >
        <span className="text-lg" style={{ animation: isLoading ? 'pulse 1s infinite' : 'none' }}>
          {error ? '⚠️' : icon}
        </span>
        <div className="overflow-hidden whitespace-nowrap truncate max-w-[120px]">
          <div className="text-xs opacity-80">{city}</div>
          <div className="text-base font-semibold">
            {error ? '--°C' : `${temp}°C`}
          </div>
        </div>
      </div>

      {/* Chat assistant title */}
      <h1 className="text-2xl font-bold text-center mb-4 mt-2">🤖 FrankStack AI Assistant</h1>

      {/* Provider selection buttons */}
      <div className="flex justify-center gap-3 mb-4">
        {(['ollama','chatgpt'] as Provider[]).map((p) => (
          <button
            key={p}
            onClick={() => setCurrentProvider(p)}
            className={`provider-btn px-4 py-2 rounded-full border-2 transition-all ${
              currentProvider === p ? 'bg-white text-indigo-600' : 'border-white/30 hover:bg-white/10'
            }`}
          >
            {p === 'ollama' ? 'Ollama' : 'ChatGPT'}
          </button>
        ))}
      </div>

      {/* Debug toggle button */}
      <button
        onClick={toggleDebug}
        className="absolute bottom-5 left-5 px-3 py-1 text-xs border border-white/50 rounded-full hover:bg-white/10"
      >
        Debug {debugMode ? 'ON' : 'OFF'}
      </button>

      {/* ChatGPT API Key input */}
      {currentProvider === 'chatgpt' && (
        <div className="pt-4">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={aIContext.userLang === 'IT' ? 'API Key OpenAI' : 'Enter OpenAI API Key'}
            className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-white/70 border border-white/30"
          />
        </div>
      )}
    </div>
  );
};

export default Header;
