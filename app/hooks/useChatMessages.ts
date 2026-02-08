import { useState, useCallback, useEffect } from 'react'
import { HumanMessage, AIMessage } from '@langchain/core/messages'
import type { Message, ToolCall } from '../components/MessageBubble'

/**
 * 初始欢迎消息
 * 在新会话开始时显示给用户
 */
export function useChatMessages() {
  // 消息列表状态,默认为空 (不再显示初始欢迎消息)
  const [messages, setMessages] = useState<Message[]>(() => {
    console.log('%c useChatMessages 初始化', 'color:#9C27B0; font-weight:bold')
    return []
  })
  // 加载状态,标识是否正在发送/接收消息
  const [isLoading, setIsLoading] = useState(false)

  /**
   * 添加用户消息（使用 LangChain HumanMessage）
   * @param content - 消息内容（文本或多模态内容数组）
   * @returns 创建的消息对象
   */
  const addUserMessage = useCallback((content: string | Array<any>): Message => {
    const userMessage = new HumanMessage({
      content,
      id: Date.now().toString()
    }) as Message
    setMessages(prev => [...prev, userMessage])
    return userMessage
  }, [])

  /**
   * 添加 AI 助手消息（使用 LangChain AIMessage）
   * 创建一个空的流式消息,用于后续逐步填充内容
   * @returns 创建的消息对象
   */
  const addAssistantMessage = useCallback((): Message => {
    const assistantMessage = new AIMessage({
      content: '',                       // 初始为空,等待流式填充
      id: (Date.now() + 1).toString()
    }) as Message
    // 使用对象展开确保 React 能检测到变化
    const streamingMessage = {
      ...assistantMessage,
      isStreaming: true
    } as Message
    setMessages(prev => [...prev, streamingMessage])
    return streamingMessage
  }, [])

  /**
   * 更新消息内容(用于流式响应)
   * 将新内容追加到指定消息的末尾
   * @param messageId - 消息 ID
   * @param content - 要追加的内容
   */
  const updateMessageContent = useCallback((messageId: string, content: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        // 创建新的 AIMessage 对象，保留流式状态和工具调用信息
        const currentContent = typeof msg.content === 'string' ? msg.content : ''
        const updatedMessage = new AIMessage({
          content: currentContent + content,
          id: msg.id
        }) as Message
        updatedMessage.isStreaming = msg.isStreaming
        updatedMessage.toolCallResults = msg.toolCallResults
        updatedMessage.tool_calls = msg.tool_calls
        return updatedMessage
      }
      return msg
    }))
  }, [])

  /**
   * 完成流式传输
   * 将消息标记为完成,移除流式打字光标
   * @param messageId - 消息 ID
   */
  const finishStreaming = useCallback((messageId: string) => {
    console.log('%c 完成流式传输', 'color:#2196F3; font-weight:bold', { messageId })
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        console.log('%c 流式传输前的消息', 'color:#9C27B0; font-weight:bold', {
          content: msg.content,
          toolCallResults: msg.toolCallResults,
          tool_calls: msg.tool_calls
        })
        // 创建新对象以确保 React 检测到变化，保留所有属性
        const updated = {
          ...msg,
          isStreaming: false
        } as Message
        console.log('%c 流式传输后的消息', 'color:#4CAF50; font-weight:bold', {
          content: updated.content,
          toolCallResults: updated.toolCallResults,
          tool_calls: updated.tool_calls
        })
        return updated
      }
      return msg
    }))
  }, [])

  /**
   * 添加错误消息
   * 在发生错误时向用户显示友好的错误提示
   */
  const addErrorMessage = useCallback(() => {
    const errorMessage = new AIMessage({
      content: '抱歉，发送消息时出现错误。请稍后重试。',
      id: (Date.now() + 1).toString()
    }) as Message
    setMessages(prev => [...prev, errorMessage])
  }, [])

  /**
   * 重置消息列表
   * 恢复到初始状态(空)
   */
  const resetMessages = useCallback(() => {
    setMessages([])
  }, [])

  /**
   * 更新消息的工具调用信息
   * @param messageId - 消息 ID
   * @param toolCalls - 工具调用数组
   */
  const updateToolCalls = useCallback((messageId: string, toolCalls: ToolCall[]) => {
    console.log('%c 更新工具调用', 'color:#FF9800; font-weight:bold', {
      messageId,
      toolCalls,
      count: toolCalls.length
    })
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const updatedMsg = { ...msg, toolCallResults: toolCalls } as Message
        console.log('%c 工具调用已更新', 'color:#4CAF50; font-weight:bold', updatedMsg)
        return updatedMsg
      }
      return msg
    }))
  }, [])

  /**
   * 添加工具调用到消息
   * @param messageId - 消息 ID
   * @param toolCall - 要添加的工具调用
   */
  const addToolCall = useCallback((messageId: string, toolCall: ToolCall) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const existing = msg.toolCallResults || []
        const updatedMsg = {
          ...msg,
          toolCallResults: [...existing, toolCall]
        } as Message
        return updatedMsg
      }
      return msg
    }))
  }, [])

  /**
   * 更新工具调用结果
   * @param messageId - 消息 ID
   * @param toolName - 工具名称
   * @param output - 工具输出结果
   */
  const updateToolResult = useCallback((messageId: string, toolName: string, output: any) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const toolCalls = msg.toolCallResults || []
        const updatedToolCalls = toolCalls.map(tc =>
          tc.name === toolName ? { ...tc, output } : tc
        )
        return { ...msg, toolCallResults: updatedToolCalls } as Message
      }
      return msg
    }))
  }, [])

  /**
   * 更新工具调用错误
   * @param messageId - 消息 ID
   * @param toolName - 工具名称
   * @param error - 错误信息
   */
  const updateToolError = useCallback((messageId: string, toolName: string, error: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const toolCalls = msg.toolCallResults || []
        const updatedToolCalls = toolCalls.map(tc =>
          tc.name === toolName ? { ...tc, error } : tc
        )
        return { ...msg, toolCallResults: updatedToolCalls } as Message
      }
      return msg
    }))
  }, [])

  /**
   * 加载历史消息
   * 用于从服务器加载会话历史记录
   * @param historyMessages - 历史消息数组
   */
  const loadMessages = useCallback((historyMessages: Message[]) => {
    console.log('%c 加载历史消息', 'color:#4CAF50; font-weight:bold', {
      count: historyMessages.length,
      messages: historyMessages
    })
    setMessages(historyMessages.length > 0 ? historyMessages : [])
  }, [])

  // 监控 messages 状态变化
  useEffect(() => {
    console.log('%c Messages 状态更新', 'color:#E91E63; font-weight:bold', {
      count: messages.length,
      messages
    })
  }, [messages])

  return {
    messages,
    isLoading,
    setIsLoading,
    addUserMessage,
    addAssistantMessage,
    updateMessageContent,
    finishStreaming,
    addErrorMessage,
    resetMessages,
    loadMessages,
    updateToolCalls,
    addToolCall,
    updateToolResult,
    updateToolError
  }
}
