/**
 * InputBar.tsx
 * -----------------------
 * Chat input bar for AI conversation.
 * Works with structured AIContext (system + form).
 * 
 * Author: Edoardo Sabatini
 * Date: 31 August 2025
 */

import React from 'react';
import { useAuthStore } from '../store/useAuthStore';

type InputBarProps = {
  messageInputRef?: React.RefObject<HTMLInputElement>;
  sendMessage: (text?: string) => void;
  clearChat: () => void;
  isLoading: boolean;
};

const InputBar: React.FC<InputBarProps> = ({
  messageInputRef,
  sendMessage,
  clearChat,
  isLoading
}) => {
  // ----- Selectors -----
  const storeQuestion = useAuthStore(state => state.aIContext.input);
  const userLang = useAuthStore(state => state.aIContext.system.userLang);
  const storeMaxWords = useAuthStore(state => state.aIContext.system.maxWords ?? 50);
  const updateAIContext = useAuthStore(state => state.updateAIContext);

  // ----- Local input state -----
  const [localQuestion, setLocalQuestion] = React.useState<string>(storeQuestion || '');

  // Sync locale input when store changes
  React.useEffect(() => {
    setLocalQuestion(storeQuestion || '');
  }, [storeQuestion]);

  // ----- Handlers -----
  const handleSendClick = () => {
    const trimmed = localQuestion.trim();
    if (!trimmed || isLoading) return;

    // Aggiorna la store con l’ultima domanda
    updateAIContext({ input: trimmed });
    sendMessage(trimmed); // Passa il testo al parent
    setLocalQuestion('');  // Reset locale input
  };

  const handleMaxWordsChange = (value: number) => {
    // Leggi snapshot attuale
    const storeSnapshot = useAuthStore.getState().aIContext;
    // Aggiorna solo il campo maxWords dentro system
    updateAIContext({ system: { ...storeSnapshot.system, maxWords: value } });
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendClick();
    }
  };

  // ----- Render -----
  return (
    <div className="p-5 bg-white border-t border-gray-200">
      <div className="flex gap-3 items-center flex-wrap">

        {/* Input field */}
        <input
          ref={messageInputRef}
          type="text"
          value={localQuestion}
          onChange={(e) => setLocalQuestion(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={userLang === 'Italian' ? 'Scrivi il tuo messaggio...' : 'Type your message...'}
          className="flex-1 p-4 border-2 border-gray-200 rounded-full text-base outline-none focus:border-indigo-500 transition-colors"
          disabled={isLoading}
        />

        {/* Max words selector */}
        <div className="flex items-center gap-1">
          <label className="text-sm text-gray-600">{userLang === 'Italian' ? 'Parole' : 'Words'}</label>
          <input
            type="number"
            min={10}
            max={500}
            value={storeMaxWords}
            onChange={(e) => handleMaxWordsChange(parseInt(e.target.value || '50', 10))}
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
            ? userLang === 'Italian' ? 'Invio...' : 'Sending...'
            : userLang === 'Italian' ? 'Invia' : 'Send'}
        </button>

        {/* Clear chat button */}
        <button
          onClick={clearChat}
          disabled={isLoading}
          title={userLang === 'Italian' ? 'Pulisci chat' : 'Clear chat'}
          className="clean-btn p-4 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-full hover:scale-105 transition-all disabled:opacity-50"
        >
          🧹
        </button>
      </div>
    </div>
  );
};

export default InputBar;
