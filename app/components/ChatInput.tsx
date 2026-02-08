'use client'

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { ArrowUp, Loader2, Plus, X, FileText } from 'lucide-react'
import ToolSelector, { Tool } from './ToolSelector'
import ToolBadge from './ToolBadge'
import ModelSelector, { Model } from './ModelSelector'

/** 支持的附件类型：仅 .txt */
export type AttachmentPreview = { type: 'txt'; name: string }

interface ChatInputProps {
  onSend: (message: string, selectedTools?: string[], selectedModel?: string, files?: File[]) => void
  disabled?: boolean
  availableTools?: Tool[]
  availableModels?: Model[]
  currentModel?: string
  onModelChange?: (modelId: string) => void
}

export interface ChatInputHandle {
  setInput: (value: string) => void
  focus: () => void
}

/**
 * Chat Input Component
 * 新布局：输入框在上，工具栏在下
 * 仅支持 .txt 文本文件上传
 */
const ACCEPTED_FILE_TYPES = 'text/plain,.txt'
const MAX_FILE_SIZE_MB = 5

export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(
  ({
    onSend,
    disabled,
    availableTools = [],
    availableModels = [],
    currentModel = '',
    onModelChange,
  }, ref) => {
    const [input, setInput] = useState('')
    const [selectedTools, setSelectedTools] = useState<string[]>([])
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
    const [filePreviews, setFilePreviews] = useState<AttachmentPreview[]>([])
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => ({
    setInput: (value: string) => {
      setInput(value)
      setTimeout(() => textareaRef.current?.focus(), 0)
    },
    focus: () => textareaRef.current?.focus()
  }))

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])


  const handleSend = () => {
    if ((input.trim() || uploadedFiles.length > 0) && !disabled) {
      onSend(
        input,
        selectedTools.length > 0 ? selectedTools : undefined,
        currentModel || undefined,
        uploadedFiles.length > 0 ? uploadedFiles : undefined
      )
      setInput('')
      clearAttachments()
    }
  }

  const handleToolToggle = (toolId: string) => {
    setSelectedTools((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    )
  }

  const handleRemoveTool = (toolId: string) => {
    setSelectedTools((prev) => prev.filter((id) => id !== toolId))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 处理文件选择（仅 .txt）
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024
    const allowed = files.filter(file => {
      if (file.type !== 'text/plain' && !file.name.toLowerCase().endsWith('.txt')) return false
      if (file.size > maxBytes) return false
      return true
    })

    if (allowed.length > 0) {
      setUploadedFiles(prev => [...prev, ...allowed])
      setFilePreviews(prev => [...prev, ...allowed.map(f => ({ type: 'txt' as const, name: f.name }))])
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeAttachment = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    setFilePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const clearAttachments = () => {
    setUploadedFiles([])
    setFilePreviews([])
  }

  // 打开文件选择器
  const handleAddClick = () => {
    fileInputRef.current?.click()
  }

    return (
      <div
        className={`w-full max-w-5xl glass-panel rounded-2xl shadow-2xl shadow-black/50 transition-all duration-300 ${
          disabled
            ? 'ring-1 ring-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.15)]'
            : 'focus-within:ring-1 focus-within:ring-blue-500/50 focus-within:shadow-[0_0_40px_rgba(59,130,246,0.2)]'
        }`}
      >
        {/* 输入框区域 */}
        <div className="px-4 pt-4 pb-2">
          {/* 附件预览：仅 .txt */}
          {filePreviews.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {filePreviews.map((preview, index) => (
                  <div
                    key={index}
                    className="relative group min-w-[120px] rounded-lg border border-white/10 flex items-center gap-2 px-3 py-2"
                    style={{ background: 'var(--bg-surface-card)' }}
                  >
                    <FileText className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                    <span className="text-sm truncate flex-1" style={{ color: 'var(--text-primary)' }}>{preview.name}</span>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/20"
                      title="移除附件"
                    >
                      <X className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 文本输入框 */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'AI 正在回复中...' : '输入您的问题，开启 AI 之旅...'}
            className={`w-full bg-transparent border-none outline-none text-base resize-none max-h-32 transition-opacity ${disabled ? 'opacity-60' : ''}`}
            style={{ color: 'var(--text-primary)' }}
            rows={1}
            disabled={disabled}
          />
        </div>

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_FILE_TYPES}
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* 工具栏 */}
        <div className="flex items-center justify-between px-3 pb-3 pt-1 border-t border-white/5">
          {/* 左侧：附件、工具选择器和已选工具徽章 */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* 附件/图片上传按钮 */}
            <button
              onClick={handleAddClick}
              className="p-2 rounded-lg transition flex-shrink-0 relative group"
              style={{ color: 'var(--text-secondary)' }}
              disabled={disabled}
              title="上传 .txt 文本文件"
            >
              <Plus className="w-5 h-5" />
              {uploadedFiles.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[10px] rounded-full flex items-center justify-center">
                  {uploadedFiles.length}
                </span>
              )}
            </button>

            {/* 工具选择器 */}
            {availableTools.length > 0 && (
              <div className="flex-shrink-0">
                <ToolSelector
                  tools={availableTools}
                  selectedTools={selectedTools}
                  onToolToggle={handleToolToggle}
                />
              </div>
            )}

            {/* 已选工具徽章 - 在同一行显示 */}
            {selectedTools.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                {selectedTools.map((toolId) => {
                  const tool = availableTools.find((t) => t.id === toolId)
                  return tool ? (
                    <ToolBadge
                      key={toolId}
                      name={tool.name}
                      icon={tool.icon}
                      onRemove={() => handleRemoveTool(toolId)}
                    />
                  ) : null
                })}
              </div>
            )}
          </div>

          {/* 右侧：模型选择和发送按钮 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* 模型选择器 */}
            {availableModels.length > 0 && onModelChange && (
              <ModelSelector
                models={availableModels}
                selectedModel={currentModel}
                onModelChange={onModelChange}
              />
            )}

            {/* 发送按钮 */}
            <button
              onClick={handleSend}
              disabled={(!input.trim() && uploadedFiles.length === 0) || disabled}
              className={`p-2 rounded-lg shadow-lg transition-all min-w-10 min-h-10 flex items-center justify-center ${
                disabled ? 'cursor-wait' : (input.trim() || uploadedFiles.length > 0) ? '' : 'cursor-not-allowed'
              }`}
              style={
                disabled
                  ? { background: 'var(--bg-surface-card)', color: 'var(--accent-blue)' }
                  : (input.trim() || uploadedFiles.length > 0)
                    ? { background: 'linear-gradient(to right, var(--accent-blue), var(--accent-purple))', color: '#fff' }
                    : { background: 'var(--bg-surface-card)', color: 'var(--text-muted)' }
              }
            >
              {disabled ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowUp className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }
)

ChatInput.displayName = 'ChatInput'
