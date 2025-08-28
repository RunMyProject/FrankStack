/**
 * MessageBubble.tsx
 * Chat Message Bubble Component
 * ----------------------------
 * Displays a single chat message in a bubble style.
 * - Supports user and AI messages
 * - TailwindCSS styling with hover effects
 * - Fade-in animation for new messages
 * 
 * Author: Edoardo Sabatini
 * Date: 28 August 2025
 */

import React from 'react';
import type { ChatMessage } from '../types/chat';

interface MessageBubbleProps {
  message: ChatMessage; // Chat message object
  isUser: boolean;      // Whether the message is from the user
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isUser }) => {
  // Base bubble styling
  const baseClasses =
    'max-w-[75%] p-3 rounded-2xl mb-2 break-words transition-transform duration-200 ease-in-out animate-fadeIn';

  // Styling for user messages
  const userClasses =
    'bg-indigo-100 text-indigo-900 self-end shadow-[0_4px_12px_rgba(79,70,229,0.3)] hover:scale-105';

  // Styling for AI messages
  const aiClasses =
    'bg-gray-100 text-gray-900 self-start shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:scale-[1.02]';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`${baseClasses} ${isUser ? userClasses : aiClasses}`}>
        {message.content}
      </div>
    </div>
  );
};

export default MessageBubble;
