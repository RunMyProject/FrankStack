/**
 * InputBar.tsx
 * Chat Input Bar Component
 * -----------------------
 * Provides the input area for user messages in the chat interface.
 * - Text input with Enter key support
 * - Max words selector
 * - Send button with loading state
 * - Clear chat button
 * 
 * Author: Edoardo Sabatini
 * Date: 28 August 2025
 */

import React from 'react';
import type { Lang } from '../types/chat';

type InputBarProps = {
  messageInputRef?: React.RefObject<HTMLInputElement>; // Optional ref for focusing input
  currentMessage: string;                             // Current text in input
  setCurrentMessage: (v: string) => void;            // Update message text
  sendMessage: () => void;                            // Function to send message
  clearChat: () => void;                              // Function to clear chat
  isLoading: boolean;                                 // Loading state
  currentLang: Lang;                                  // Current language
  maxWords: number;                                   // Max words limit
  setMaxWords: (n: number) => void;                  // Update max words
};

const InputBar: React.FC<InputBarProps> = ({
  messageInputRef,
  currentMessage,
  setCurrentMessage,
  sendMessage,
  clearChat,
  isLoading,
  currentLang,
  maxWords,
  setMaxWords
}) => {

  // Handle Enter key to send message
  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div className="p-5 bg-white border-t border-gray-200">
      <div className="flex gap-3 items-center flex-wrap">

        {/* Message input field */}
        <input
          ref={messageInputRef}
          type="text"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={currentLang === 'IT' ? 'Scrivi il tuo messaggio...' : 'Type your message...'}
          className="flex-1 p-4 border-2 border-gray-200 rounded-full text-base outline-none focus:border-indigo-500 transition-colors input-focus"
          disabled={isLoading}
        />

        {/* Max words selector */}
        <div className="flex items-center gap-1">
          <label className="text-sm text-gray-600">
            {currentLang === 'IT' ? 'Parole' : 'Words'}
          </label>
          <input
            type="number"
            min={10}
            max={500}
            value={maxWords}
            onChange={(e) => setMaxWords(parseInt(e.target.value || '50', 10))}
            className="w-16 p-2 border-2 border-gray-200 rounded-lg"
          />
        </div>

        {/* Send button */}
        <button
          onClick={sendMessage}
          disabled={isLoading || !currentMessage.trim()}
          className="send-btn px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:scale-105 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading
            ? (currentLang === 'IT' ? 'Invio...' : 'Sending...')
            : (currentLang === 'IT' ? 'Invia' : 'Send')}
        </button>

        {/* Clear chat button */}
        <button
          onClick={clearChat}
          disabled={isLoading}
          title="Pulisci chat / Clear chat"
          className="clean-btn p-4 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-full hover:scale-105 transition-all disabled:opacity-50"
        >
          🧹
        </button>

      </div>
    </div>
  );
};

export default InputBar;
