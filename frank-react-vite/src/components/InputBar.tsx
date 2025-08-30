/**
 * InputBar.tsx
 * Chat Input Bar Component
 * -------------------------
 * Provides the input area for user messages in the chat interface.
 * - Text input with Enter key support
 * - Max words selector (stored in Zustand AIContext)
 * - Send button with loading state
 * - Clear chat button
 *
 * Author: Edoardo Sabatini
 * Date: 30 August 2025
 */

import React from 'react';
import { useAuthStore } from '../store/useAuthStore';

type InputBarProps = {
  messageInputRef?: React.RefObject<HTMLInputElement>;
  sendMessage: (text?: string) => void; // ora accetta testo opzionale
  clearChat: () => void;
  isLoading: boolean;
};

const InputBar: React.FC<InputBarProps> = ({
  messageInputRef,
  sendMessage,
  clearChat,
  isLoading,
}) => {
  // selettori mirati per minimizzare ri-render
  const storeQuestion = useAuthStore(state => state.aIContext.question);
  const userLang = useAuthStore(state => state.aIContext.userLang);
  const storeMaxWords = useAuthStore(state => state.aIContext.maxWords ?? 50);
  const updateAIContext = useAuthStore(state => state.updateAIContext);

  // stato locale per input (evita scrivere in store ad ogni keystroke)
  const [localQuestion, setLocalQuestion] = React.useState<string>(storeQuestion || '');

  // sincronizza locale quando la store cambia (es: welcome message, lingua, reset)
  React.useEffect(() => {
    setLocalQuestion(storeQuestion || '');
  }, [storeQuestion]);

  // invio (aggiorna la store con l'ultima domanda, poi chiama il parent)
  const handleSendClick = () => {
    const trimmed = localQuestion.trim();
    if (!trimmed || isLoading) return;
    updateAIContext({ question: trimmed }); // aggiorna la store una volta, in modo esplicito
    sendMessage(trimmed); // passa il testo al parent per evitare race condition
    setLocalQuestion(''); // pulisci input locale immediatamente
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendClick();
    }
  };

  return (
    <div className="p-5 bg-white border-t border-gray-200">
      <div className="flex gap-3 items-center flex-wrap">

        {/* Message input field */}
        <input
          ref={messageInputRef}
          type="text"
          value={localQuestion}
          onChange={(e) => setLocalQuestion(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={
            userLang === 'IT' ? 'Scrivi il tuo messaggio...' : 'Type your message...'
          }
          className="flex-1 p-4 border-2 border-gray-200 rounded-full text-base outline-none focus:border-indigo-500 transition-colors input-focus"
          disabled={isLoading}
        />

        {/* Max words selector */}
        <div className="flex items-center gap-1">
          <label className="text-sm text-gray-600">
            {userLang === 'IT' ? 'Parole' : 'Words'}
          </label>
          <input
            type="number"
            min={10}
            max={500}
            value={storeMaxWords}
            onChange={(e) =>
              updateAIContext({ maxWords: parseInt(e.target.value || '50', 10) })
            }
            className="w-16 p-2 border-2 border-gray-200 rounded-lg"
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSendClick}
          disabled={isLoading || !localQuestion.trim()}
          className="send-btn px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:scale-105 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading
            ? userLang === 'IT' ? 'Invio...' : 'Sending...'
            : userLang === 'IT' ? 'Invia' : 'Send'}
        </button>

        {/* Clear chat button */}
        <button
          onClick={clearChat}
          disabled={isLoading}
          title={userLang === 'IT' ? 'Pulisci chat' : 'Clear chat'}
          className="clean-btn p-4 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-full hover:scale-105 transition-all disabled:opacity-50"
        >
          🧹
        </button>
      </div>
    </div>
  );
};

export default InputBar;
