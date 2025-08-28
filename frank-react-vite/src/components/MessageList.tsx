/**
 * MessageList.tsx
 * Chat Message List Component
 * ---------------------------
 * Displays the list of chat messages in the conversation.
 * - Renders user and AI messages using MessageBubble
 * - Shows a loading indicator when AI is processing
 * - Scrolls to the latest message if messagesEndRef is provided
 * 
 * Author: Edoardo Sabatini
 * Date: 28 August 2025
 */

import React from 'react';
import type { ChatMessage, Lang } from '../types/chat';
import MessageBubble from './MessageBubble';

interface MessageListProps {
  messages: ChatMessage[];                       // Array of chat messages
  isLoading: boolean;                             // Loading state for AI response
  currentLang: Lang;                              // Current language for labels
  messagesEndRef?: React.RefObject<HTMLDivElement>; // Ref to scroll to latest message
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  currentLang,
  messagesEndRef
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {/* Render all chat messages */}
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} isUser={msg.type === 'user'} />
      ))}

      {/* Loading indicator when AI is processing */}
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

      {/* Invisible div to scroll into view */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
