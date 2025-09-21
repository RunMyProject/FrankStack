/**
 * InputBar.tsx
 * Chat Input Component for AI Conversations
 * -----------------------
 * Custom React component to handle user input for AI chat requests.
 *
 * Features:
 *   - sendMessage(): sends the current input to the AI
 *   - clearChat(): clears the entire conversation history
 *   - stopAI(): stops ongoing AI processing (optional, if provided)
 *
 * Responsibilities:
 *   - Manages local input state while keeping it synchronized with the global AIContext store
 *   - Provides a configurable "max words" setting per request
 *   - Handles Enter key events (send new message or stop AI when loading)
 *   - Updates UI state and disables interactions during AI processing
 *
 * Author: Edoardo Sabatini
 * Date: 21 September 2025
 */

import React from 'react';
import { useAuthStore } from '../store/useAuthStore';

type InputBarProps = {
  messageInputRef?: React.RefObject<HTMLInputElement>;
  sendMessage: (text?: string) => void;
  clearChat: () => void;
  isLoading: boolean;
  stopAI?: () => void; // Optional handler to stop AI processing
};

const InputBar: React.FC<InputBarProps> = ({
  messageInputRef,
  sendMessage,
  clearChat,
  isLoading,
  stopAI
}) => {
  // ----- Store selectors -----
  const storeQuestion = useAuthStore(state => state.aIContext.input);
  const userLang = useAuthStore(state => state.aIContext.system.userLang);
  const storeMaxWords = useAuthStore(state => state.aIContext.system.maxWords ?? 50);
  const updateAIContext = useAuthStore(state => state.updateAIContext);

  // ----- Local input state -----
  const [localQuestion, setLocalQuestion] = React.useState<string>(storeQuestion || '');

  // Keep local input in sync with store updates
  React.useEffect(() => {
    setLocalQuestion(storeQuestion || '');
  }, [storeQuestion]);

  // ----- Event handlers -----

  /**
   * Handles sending a message:
   * - Trims input
   * - Updates store with last user question
   * - Calls sendMessage() from parent
   * - Resets local state
   */
  const handleSendClick = () => {
    const trimmed = localQuestion.trim();
    if (!trimmed || isLoading) return;

    updateAIContext({ input: trimmed });
    sendMessage(trimmed);
    setLocalQuestion('');
  };

  /**
   * Handles stopping AI processing:
   * Calls optional stopAI() prop if available
   */
  const handleStopClick = () => {
    if (stopAI) {
      stopAI();
    }
  };

  /**
   * Handles "max words" configuration changes:
   * - Reads current store snapshot
   * - Updates only the system.maxWords field
   */
  const handleMaxWordsChange = (value: number) => {
    const storeSnapshot = useAuthStore.getState().aIContext;
    updateAIContext({ system: { ...storeSnapshot.system, maxWords: value } });
  };

  /**
   * Handles Enter key press in the input field:
   * - Sends message if idle
   * - Stops AI if currently processing
   */
  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isLoading) {
        handleStopClick();
      } else {
        handleSendClick();
      }
    }
  };

  // ----- Render -----
  return (
    <div className="p-5 bg-white border-t border-gray-200">
      <div className="flex gap-3 items-center flex-wrap">

        {/* Input field for user messages */}
        <input
          ref={messageInputRef}
          type="text"
          value={localQuestion}
          onChange={(e) => setLocalQuestion(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={userLang === 'Italian' ? 'Scrivi il tuo messaggio...' : 'Type your message...'}
          className={`flex-1 p-4 border-2 border-gray-200 rounded-full text-base outline-none focus:border-indigo-500 transition-colors ${isLoading ? 'cursor-not-allowed' : ''}`}
          disabled={isLoading}
        />

        {/* Max words configuration field */}
        <div className="flex items-center gap-1">
          <label className="text-sm text-gray-600">
            {userLang === 'Italian' ? 'Parole' : 'Words'}
          </label>
          <input
            type="number"
            min={10}
            max={500}
            value={storeMaxWords}
            onChange={(e) => handleMaxWordsChange(parseInt(e.target.value || '50', 10))}
            className={`w-16 p-2 border-2 border-gray-200 rounded-lg ${isLoading ? 'cursor-not-allowed' : ''}`}
            disabled={isLoading}
          />
        </div>

        {/* Send or Stop button depending on loading state */}
        {isLoading ? (
          <button
            onClick={handleStopClick}
            className="stop-btn px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full hover:scale-105 hover:shadow-lg transition-all"
            title={userLang === 'Italian' ? 'Ferma elaborazione' : 'Stop processing'}
          >
            🔴 {userLang === 'Italian' ? 'Stop' : 'Stop'}
          </button>
        ) : (
          <button
            onClick={handleSendClick}
            disabled={!localQuestion.trim()}
            className="send-btn px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:scale-105 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {userLang === 'Italian' ? 'Invia' : 'Send'}
          </button>
        )}

        {/* Clear chat button */}
        <button
          onClick={clearChat}
          disabled={isLoading}
          title={userLang === 'Italian' ? 'Pulisci chat' : 'Clear chat'}
          className={`clean-btn p-4 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-full hover:scale-105 transition-all disabled:opacity-50 ${isLoading ? 'cursor-not-allowed' : ''}`}
        >
          🧹
        </button>
      </div>
    </div>
  );
};

export default InputBar;
