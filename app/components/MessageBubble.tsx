'use client';

import { Bot, User } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ToolCallDisplay } from './ToolCallDisplay';
import type { BaseMessage } from '@langchain/core/messages';

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
  output?: any;
  error?: string;
}

export interface Message extends BaseMessage {
  isStreaming?: boolean;
  tool_calls?: ToolCall[];
  toolCallResults?: ToolCall[];
}

interface MessageBubbleProps {
  message: Message;
  index: number;
}

export function MessageBubble({ message, index }: MessageBubbleProps) {


  const messageType = message.getType?.() || (message as any)._getType?.();
  const isUser = messageType === 'human';

  // 处理 content（仅文本；附件为 .txt 时已并入文本）
  let messageContent = '';

  if (typeof message.content === 'string') {
    messageContent = message.content;
  } else if (Array.isArray(message.content)) {
    message.content.forEach((block) => {
      if (typeof block === 'string') {
        messageContent += block;
      } else if (block && typeof block === 'object' && 'text' in block && block.text) {
        messageContent += block.text;
      }
    });
  } else {
    messageContent = JSON.stringify(message.content);
  }

  return (
    <div
      className={`flex gap-4 mb-8 w-full animate-fade-in-up ${
        isUser ? 'justify-end' : ''
      }`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {!isUser && (
        <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0'>
          <Bot className='text-white w-4 h-4' />
        </div>
      )}

      <div
        className={`
        ${
          isUser
            ? 'max-w-2xl bg-surface-user border rounded-2xl rounded-tr-none p-4 leading-relaxed shadow-lg'
            : 'flex-1 rounded-2xl rounded-tl-none p-4'
        }
      `}
        style={
          isUser
            ? { borderColor: 'var(--border-default)', color: 'var(--text-primary)' }
            : { background: 'var(--bg-surface-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }
        }
      >
        {!isUser && (message.tool_calls || message.toolCallResults) && (
          <div className='mb-1'>
            <ToolCallDisplay
              toolCalls={message.toolCallResults || message.tool_calls || []}
            />
          </div>
        )}

        {messageContent ? (
          <div className="text-[15px] leading-relaxed">
            <MarkdownRenderer content={messageContent} />
          </div>
        ) : !isUser ? (
          <div className='text-sm animate-pulse' style={{ color: 'var(--accent-blue)' }}>
            AI 正在思考...
          </div>
        ) : null}

        {message.isStreaming && messageContent && (
          <div className='text-sm animate-pulse' style={{ color: 'var(--accent-blue)' }}>
            AI 正在思考...
          </div>
        )}
      </div>

      {isUser && (
        <div className='ml-0 w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border shadow-lg' style={{ background: 'var(--bg-surface-user)', borderColor: 'var(--border-default)' }}>
          <div className='w-full h-full flex items-center justify-center' style={{ color: 'var(--text-secondary)' }}>
            <User className='w-5 h-5' />
          </div>
        </div>
      )}
    </div>
  );
}
