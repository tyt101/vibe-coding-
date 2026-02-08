import { useEffect, useCallback } from 'react'
import { mapStoredMessagesToChatMessages, HumanMessage, AIMessage } from '@langchain/core/messages'
import type { Message } from '../components/MessageBubble'

/**
 * 聊天历史加载 Hook
 *
 * 功能:
 * - 自动加载指定会话的历史消息
 * - 当会话 ID 变化时自动重新加载
 * - 直接使用 LangChain 原始消息格式，无需转换
 * - 判断会话是否包含用户消息
 *
 * 使用场景:
 * - 切换到历史会话时加载之前的对话
 * - 刷新页面后恢复当前会话
 *
 * @param sessionId - 当前会话 ID
 * @param onLoadMessages - 加载完成后的回调,接收消息数组
 * @param onHasUserMessage - 设置是否有用户消息的回调
 */
export function useChatHistory(
  sessionId: string,
  onLoadMessages: (messages: Message[]) => void,
  onHasUserMessage: (hasUser: boolean) => void
) {
  /**
   * 加载历史消息
   *
   * 流程:
   * 1. 从 API 获取会话历史
   * 2. 直接使用 LangChain 消息对象（无需格式转换）
   * 3. 更新消息列表和用户消息标记
   *
   * @param threadId - 要加载的会话 ID
   */
  const loadHistory = useCallback(async (threadId: string) => {
    console.log('%c 开始加载历史', 'color:#2196F3; font-weight:bold', { threadId })

    try {
      // 1. 请求历史记录
      const res = await fetch(`/api/chat?thread_id=${threadId}`)
      const data = await res.json()

      console.log('%c API 返回数据', 'color:#FF9800', {
        hasHistory: Array.isArray(data.history),
        historyLength: data.history?.length,
        rawData: data
      })

      if (Array.isArray(data.history) && data.history.length > 0) {
        let historyMsgs: Message[] = []

        try {
          // 2. 使用 LangChain 的反序列化方法重建消息对象
          // 首先确保数据是纯 JSON 对象
          const serializedData = JSON.parse(JSON.stringify(data.history))
          console.log('%c 序列化数据', 'color:#00BCD4', { serializedData })

          historyMsgs = mapStoredMessagesToChatMessages(serializedData) as Message[]
          console.log('%c 反序列化后的消息', 'color:#ed9ec7', {
            count: historyMsgs.length,
            messages: historyMsgs
          })
        } catch (deserializeError) {
          console.error('反序列化失败，尝试手动重建:', deserializeError)

          // 手动重建消息对象作为备选方案
          historyMsgs = data.history.map((msg: any, idx: number) => {
            // 多种方式提取消息类型
            let msgType = null

            // 优先从 id 数组中提取（LangChain 序列化格式）
            if (msg.id && Array.isArray(msg.id)) {
              // LangChain 消息的 id 格式: ["langchain_core", "messages", "HumanMessage"]
              const idArray = msg.id
              for (const part of idArray) {
                if (part === 'HumanMessage' || part === 'human') {
                  msgType = 'human'
                  break
                } else if (part === 'AIMessage' || part === 'ai') {
                  msgType = 'ai'
                  break
                }
              }
            }

            // 如果没找到，检查 type 字段（但排除 "constructor"）
            if (!msgType && msg.type && msg.type !== 'constructor') {
              msgType = msg.type
            }

            // 如果还是没有，从 kwargs 或 data 中提取
            if (!msgType) {
              const msgData = msg.data || msg.kwargs
              if (msgData) {
                msgType = msgData.type
              }
            }

            // 如果依然无法判断，根据消息顺序推测（偶数=用户，奇数=AI）
            if (!msgType) {
              msgType = idx % 2 === 0 ? 'human' : 'ai'
            }

            const msgData = msg.data || msg.kwargs || msg
            const content = msgData.content || msg.content || ''
            const messageId = msgData.id || msg.id

            if (msgType === 'human' || msgType === 'HumanMessage') {
              return new HumanMessage({
                content,
                id: messageId
              }) as Message
            } else {
              return new AIMessage({
                content,
                id: messageId
              }) as Message
            }
          })
        }

        // 3. 更新消息列表
        onLoadMessages(historyMsgs)

        // 4. 检查是否有用户消息(用于判断是否需要更新会话名)
        const hasUserMsg = historyMsgs.some(msg => {
          const msgType = msg.getType?.() || (msg as any)._getType?.()
          return msgType === 'human'
        })
        onHasUserMessage(hasUserMsg)
      } else {
        // 没有历史记录,重置为初始状态
        onLoadMessages([])
        onHasUserMessage(false)
      }
    } catch (error) {
      // 静默失败,不影响用户体验
      console.error('加载历史记录失败:', error)
      onLoadMessages([])
      onHasUserMessage(false)
    }
  }, [onLoadMessages, onHasUserMessage])

  // 当 sessionId 变化时自动加载历史记录
  useEffect(() => {
    // 如果 sessionId 为空，说明是新会话，不需要加载历史
    if (!sessionId) {
      onLoadMessages([])
      onHasUserMessage(false)
      return
    }

    loadHistory(sessionId)
  }, [sessionId, loadHistory, onLoadMessages, onHasUserMessage])

  return { loadHistory }
}
