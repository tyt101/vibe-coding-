import { useState, useCallback, useEffect } from 'react'

/**
 * 会话数据接口
 */
export interface Session {
  id: string
  name: string
  created_at: string
}

/**
 * 会话管理 Hook
 *
 * 负责管理聊天会话的所有状态和操作:
 * - 当前会话 ID 管理
 * - 会话列表管理
 * - 创建、删除、重命名会话
 * - 切换会话
 * - 自动更新会话名称
 *
 * 会话生命周期:
 * 1. 页面加载时自动获取或创建会话 ID,并加载会话列表
 * 2. 用户发送第一条消息时,使用消息内容更新会话名称
 * 3. 用户可以切换到历史会话或创建新会话
 * 4. 用户可以重命名或删除会话
 */
export function useSessionManager() {
  // ==================== 状态管理 ====================
  // 当前会话 ID,初始值为空,由后端 chat 接口创建时返回
  const [sessionId, setSessionId] = useState<string>('')

  // 标记当前会话是否已有用户消息(用于判断是否需要更新会话名)
  const [hasUserMessage, setHasUserMessage] = useState(false)

  // 会话列表
  const [sessions, setSessions] = useState<Session[]>([])

  // 加载状态
  const [isLoading, setIsLoading] = useState(false)

  // ==================== 会话列表管理 ====================
  /**
   * 获取会话列表
   * 从后端 API 获取所有会话并更新状态
   */
  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/chat/sessions')
      const data = await res.json()
      if (Array.isArray(data.sessions)) {
        setSessions(data.sessions)
      }
    } catch (error) {
      console.error('获取会话列表失败:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 页面加载时自动获取会话列表
  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // 当前会话变化时重新获取列表(确保列表包含新会话)
  useEffect(() => {
    fetchSessions()
  }, [sessionId, fetchSessions])

  // ==================== 会话操作 ====================
  /**
   * 创建新会话
   * 1. 调用 API 创建会话
   * 2. 设置新的会话 ID
   * 3. 重置用户消息标记
   * 4. 刷新会话列表
   */
  const createSession = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '' })
      })
      const data = await res.json()

      if (data.id) {
        setSessionId(data.id)       // 更新当前会话 ID
        setHasUserMessage(false)    // 重置用户消息标记
        await fetchSessions()       // 刷新会话列表
      }
    } catch (error) {
      console.error('创建会话失败:', error)
    }
  }, [fetchSessions])

  /**
   * 选择(切换)会话
   * 用户从侧边栏点击历史会话时调用
   *
   * @param id - 要切换到的会话 ID
   */
  const selectSession = useCallback((id: string) => {
    setSessionId(id)
    setHasUserMessage(false)  // 切换会话时重置标记
  }, [])

  /**
   * 删除会话
   * 调用 API 删除指定会话并刷新列表
   *
   * @param id - 要删除的会话 ID
   */
  const deleteSession = useCallback(async (id: string) => {
    try {
      await fetch('/api/chat/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      await fetchSessions()  // 刷新会话列表

      // 如果删除的是当前会话,创建新会话
      if (id === sessionId) {
        await createSession()
      }
    } catch (error) {
      console.error('删除会话失败:', error)
    }
  }, [sessionId, fetchSessions, createSession])

  /**
   * 重命名会话
   * 调用 API 更新会话名称并刷新列表
   *
   * @param id - 要重命名的会话 ID
   * @param name - 新的会话名称
   */
  const renameSession = useCallback(async (id: string, name: string) => {
    if (!name.trim()) return

    try {
      await fetch('/api/chat/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: name.trim() })
      })
      await fetchSessions()  // 刷新会话列表
    } catch (error) {
      console.error('重命名会话失败:', error)
    }
  }, [fetchSessions])

  /**
   * 更新会话名称
   * 在用户发送第一条消息时自动调用
   * 使用消息内容的前 20 个字符作为会话名称
   *
   * 注意: 每个会话只会更新一次名称(hasUserMessage 标记)
   *
   * @param name - 新的会话名称(通常是用户的第一条消息)
   * @param targetSessionId - 可选的目标会话 ID（用于新创建的会话）
   */
  const updateSessionName = useCallback(async (name: string, targetSessionId?: string) => {
    // 如果已经有用户消息,则不再更新会话名
    if (hasUserMessage) return

    // 使用传入的 sessionId 或当前的 sessionId
    const idToUpdate = targetSessionId || sessionId

    // 如果 sessionId 为空,说明会话还未创建,跳过更新
    if (!idToUpdate) return

    try {
      await fetch('/api/chat/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: idToUpdate,
          name: name.slice(0, 20)  // 截取前 20 个字符
        })
      })
      await fetchSessions()      // 刷新会话列表
      setHasUserMessage(true)    // 标记已更新
    } catch (error) {
      console.error('更新会话名称失败:', error)
    }
  }, [sessionId, hasUserMessage, fetchSessions])

  return {
    // 状态
    sessionId,
    hasUserMessage,
    sessions,
    isLoading,

    // 状态设置方法
    setSessionId,
    setHasUserMessage,

    // 会话操作方法
    fetchSessions,
    createSession,
    selectSession,
    deleteSession,
    renameSession,
    updateSessionName
  }
}
