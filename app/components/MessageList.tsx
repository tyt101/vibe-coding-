'use client';

import { useRef, useEffect } from 'react';
import { MessageBubble, type Message } from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export function MessageList({
  messages,
  isLoading,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className='w-full max-w-5xl mx-auto px-4 flex flex-col pb-32'>
      {messages.map((message, index) => (
        <MessageBubble key={message.id} message={message} index={index} />
      ))}

      <div ref={messagesEndRef} />
    </div>
  );
}
