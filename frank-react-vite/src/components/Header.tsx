/**
 * Header.tsx
 * Chat Header Component
 * -----------------------
 * Displays the header for the AI chat interface.
 * - Shows server status with color indicators
 * - User badge with logout functionality
 * - Language selector (IT/EN)
 * - Interactive weather display
 * - Chat assistant title
 * - Provider selection (Ollama / ChatGPT)
 * - Debug toggle button
 * - API key input for ChatGPT when selected
 * 
 * Author: Edoardo Sabatini
 * Date: 28 August 2025
 */

import React from 'react';
import type { Lang, Provider, ServerStatus, WeatherData } from '../types/chat';

type HeaderProps = {
  userName: string;
  locationName: string;
  currentLang: Lang;
  setCurrentLang: (l: Lang) => void;
  currentProvider: Provider;
  setCurrentProvider: (p: Provider) => void;
  serverStatus: ServerStatus;
  weather: WeatherData;
  apiKey: string;
  setApiKey: (k: string) => void;
  toggleDebug: () => void;
  debugMode: boolean;
};

const Header: React.FC<HeaderProps> = ({
  userName,
  locationName,
  currentLang,
  setCurrentLang,
  currentProvider,
  setCurrentProvider,
  serverStatus,
  weather,
  apiKey,
  setApiKey,
  toggleDebug,
  debugMode
}) => {
  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 relative">

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
        title={`Logout (${userName})`}
        onClick={() => window.dispatchEvent(new CustomEvent('logout'))} 
      >
        {userName.charAt(0).toUpperCase()}
      </div>

      {/* Language selector */}
      <div className="absolute top-5 right-5 flex gap-2 z-10">
        {(['IT','EN'] as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => setCurrentLang(l)}
            className={`px-3 py-1 text-xs rounded-full border transition-all ${
              currentLang === l ? 'bg-white text-indigo-600' : 'border-white/50 hover:bg-white/10'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Interactive weather display */}
      <div
        className="absolute top-14 right-5 bg-white/20 text-white px-3 py-1 rounded-xl text-sm flex items-center gap-2 weather-hover z-10
                  transition-transform duration-200 hover:scale-110 hover:bg-white/30 hover:shadow-lg cursor-pointer"
        title={`${locationName} - ${weather.desc} - ${weather.temp}°C`}
      >
        <span className="text-lg">{weather.icon}</span>
        <div>
          <div className="text-xs opacity-80">{locationName}</div>
          <div className="text-base font-semibold">{weather.temp}°C</div>
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
            placeholder={currentLang === 'IT' ? 'API Key OpenAI' : 'Enter OpenAI API Key'}
            className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-white/70 border border-white/30"
          />
        </div>
      )}
    </div>
  );
};

export default Header;
