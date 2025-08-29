/**
 * MessageList.tsx
 * Chat Message List Component
 * ---------------------------
 * Responsible for rendering the conversation messages.
 * - Displays both user and AI messages via MessageBubble
 * - Shows a loading indicator when the AI is processing
 * - Auto-scrolls to the latest message if a ref is provided
 *
 * Author: Edoardo Sabatini
 * Date: 29 August 2025
 */

import React from 'react';
import type { ChatMessage } from '../types/chat';
import MessageBubble from './MessageBubble';
import { useAuthStore } from '../store/useAuthStore';

interface MessageListProps {
  messages: ChatMessage[];                         // List of chat messages
  isLoading: boolean;                              // Indicates if AI is generating a response
  messagesEndRef?: React.RefObject<HTMLDivElement>; // Ref used to scroll to the last message
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  messagesEndRef,
}) => {
  const { aiContext } = useAuthStore();
  const currentLang = aiContext.lang; // Current interface language

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {/* Render chat messages */}
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} isUser={msg.type === 'user'} />
      ))}

      {/* AI loading indicator */}
      {isLoading && (
        <div className="flex items-center space-x-2 p-2 animate-fadeIn">
          <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 font-semibold">
            {currentLang === 'IT' ? "L'AI sta pensando" : 'AI is thinking'}
            <span className="ml-1">
              {[0, 200, 400].map((delay) => (
                <span
                  key={delay}
                  className="inline-block animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                >
                  .
                </span>
              ))}
            </span>
          </span>
        </div>
      )}

      {/* Anchor for automatic scroll-to-bottom */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
