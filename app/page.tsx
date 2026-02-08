'use client';

import { useRef, useMemo, useState } from 'react';

// 导入组件
import SessionSidebar from './components/SessionSidebar';
import { MessageList } from './components/MessageList';
import { ChatInput, type ChatInputHandle } from './components/ChatInput';
import { Tool } from './components/ToolSelector';
import { Model } from './components/ModelSelector';

// 导入自定义 Hooks
import { useChatMessages } from './hooks/useChatMessages';
import { useSessionManager } from './hooks/useSessionManager';
import { useChatHistory } from './hooks/useChatHistory';
import { useSendMessage } from './hooks/useSendMessage';

// 导入工具配置
import { toolsConfig } from './agent/config/tools.config';

export default function ChatPage() {
  const chatInputRef = useRef<ChatInputHandle>(null);

  const [currentModel, setCurrentModel] = useState('openai:qwen3-max');

  const availableModels = useMemo<Model[]>(
    () => [
      {
        id: 'openai:qwen3-max',
        name: '通义千问 3 Max',
        description: '最新 Qwen3 旗舰模型，超强推理能力',
      },
      {
        id: 'openai:qwen-plus',
        name: '通义千问 Plus',
        description: '平衡性能与成本的高性能模型',
      },
      {
        id: 'openai:qwen-flash',
        name: '通义千问 Flash',
        description: '快速响应，高性价比',
      },
      {
        id: 'openai:qwen3-vl-plus',
        name: '通义千问 3 VL Plus',
        description: '多模态视觉语言模型，支持图文理解',
      },
    ],
    []
  );

  const availableTools = useMemo<Tool[]>(() => {
    return Object.entries(toolsConfig)
      .filter(([_, config]) => config.enabled)
      .map(([id, config]) => ({
        id,
        name: config.name,
        description: config.description,
        icon: getToolIcon(id), // 根据工具 ID 获取对应图标
      }));
  }, []);

  const {
    messages,
    isLoading, // 是否正在加载(发送消息中)
    setIsLoading, // 设置加载状态
    addUserMessage, // 添加用户消息
    addAssistantMessage, // 添加 AI 助手消息
    updateMessageContent, // 更新消息内容(用于流式响应)
    finishStreaming, // 完成流式传输
    addErrorMessage, // 添加错误消息
    loadMessages, // 加载历史消息
    updateToolCalls, // 更新工具调用
    addToolCall, // 添加工具调用
    updateToolResult, // 更新工具执行结果
    updateToolError, // 更新工具执行错误
  } = useChatMessages();

  const {
    sessionId, // 当前会话 ID
    setSessionId, // 设置会话 ID（接收后端创建的新会话）
    sessions, // 会话列表
    isLoading: sessionsLoading, // 会话列表加载状态
    createSession, // 创建新会话
    selectSession, // 切换会话
    deleteSession, // 删除会话
    renameSession, // 重命名会话
    fetchSessions, // 重新获取会话列表
    setHasUserMessage, // 设置是否有用户消息(用于判断是否需要更新会话名)
  } = useSessionManager();

  useChatHistory(sessionId, loadMessages, setHasUserMessage);

  // ==================== 消息发送 ====================
  const { sendMessage } = useSendMessage({
    sessionId,
    setSessionId,
    setIsLoading,
    addUserMessage,
    addAssistantMessage,
    updateMessageContent,
    finishStreaming,
    addErrorMessage,
    fetchSessions,
    updateToolCalls,
    addToolCall,
    updateToolResult,
    updateToolError,
  });

  // ==================== 渲染 UI ====================
  return (
    <main className='flex-1 flex flex-row relative h-full overflow-hidden'>
      {/* 动态背景 */}
      <div className='absolute inset-0 tech-grid-bg z-0 pointer-events-none'></div>
      <div className='ambient-glow'></div>

      {/* 左侧会话历史侧边栏 - Full Height */}
      <SessionSidebar
        currentSessionId={sessionId}
        sessions={sessions}
        isLoading={sessionsLoading}
        onSelect={selectSession}
        onNew={createSession}
        onDelete={deleteSession}
        onRename={renameSession}
      />

      {/* 右侧主体内容区域 */}
      <div className='flex-1 flex flex-col z-10 overflow-hidden relative h-full'>

        <div className='flex-1 flex flex-col relative overflow-hidden'>
          <div
            className='flex-1 overflow-y-auto scrollbar-hide scroll-smooth flex flex-col z-10 pb-32'
            id='chat-container'
          >
            {/* 消息列表 */}
            <MessageList
              messages={messages}
              isLoading={isLoading}
            />
          </div>

          {/* 消息输入框 */}
          <div className='absolute bottom-8 left-0 right-0 px-4 md:px-8 flex justify-center z-30'>
            <ChatInput
              ref={chatInputRef}
              onSend={sendMessage}
              disabled={isLoading}
              availableTools={availableTools}
              availableModels={availableModels}
              currentModel={currentModel}
              onModelChange={setCurrentModel}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * 根据工具 ID 返回对应的图标
 */
function getToolIcon(toolId: string): string {
  const iconMap: Record<string, string> = {
    calculator: '🔢',
    weather: '🌤️',
    current_time: '🕐',
    search: '🔍',
  };
  return iconMap[toolId] || '🛠️';
}
