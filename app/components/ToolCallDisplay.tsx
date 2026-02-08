'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Wrench, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import type { ToolCall } from './MessageBubble'

interface ToolCallDisplayProps {
  toolCalls: ToolCall[]
}

export function ToolCallDisplay({ toolCalls }: ToolCallDisplayProps) {
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set())

  const toggleTool = (toolId: string) => {
    setExpandedTools(prev => {
      const next = new Set(prev)
      if (next.has(toolId)) {
        next.delete(toolId)
      } else {
        next.add(toolId)
      }
      return next
    })
  }

  if (!toolCalls || toolCalls.length === 0) {
    return null
  }

  return (
    <div className="mt-3 space-y-2">
      {toolCalls.map((toolCall) => {
        const isExpanded = expandedTools.has(toolCall.id)
        const hasOutput = toolCall.output !== undefined
        const hasError = toolCall.error !== undefined
        const isExecuting = !hasOutput && !hasError

        return (
          <div
            key={toolCall.id}
            className="border rounded-lg overflow-hidden"
            style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface-card)' }}
          >
            {/* 工具调用头部 - 可点击折叠/展开 */}
            <button
              onClick={() => toggleTool(toolCall.id)}
              className="w-full px-3 py-2 flex items-center gap-2 transition-colors text-left"
              style={{ color: 'var(--text-primary)' }}
            >
              {/* 折叠/展开图标 */}
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
              ) : (
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
              )}

              {/* 工具图标 */}
              <Wrench className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent-blue)' }} />

              {/* 工具名称 */}
              <span className="text-sm font-medium flex-1">
                {toolCall.name}
              </span>

              {/* 状态指示器 */}
              {isExecuting && (
                <Loader2 className="w-4 h-4 text-yellow-400 animate-spin flex-shrink-0" />
              )}
              {hasOutput && (
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              )}
              {hasError && (
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}
            </button>

            {/* 展开的详细信息 */}
            {isExpanded && (
              <div className="px-3 pb-3 space-y-2 text-sm">
                {/* 输入参数 */}
                {toolCall.args && Object.keys(toolCall.args).length > 0 && (
                  <div>
                    <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                      输入参数:
                    </div>
                    <pre className="rounded p-2 overflow-x-auto text-xs" style={{ background: 'var(--code-bg)', color: 'var(--text-secondary)' }}>
                      {JSON.stringify(toolCall.args, null, 2)}
                    </pre>
                  </div>
                )}

                {/* 输出结果 */}
                {hasOutput && (
                  <div>
                    <div className="text-xs font-semibold text-green-400 mb-1">
                      输出结果:
                    </div>
                    <pre className="rounded p-2 overflow-x-auto text-xs" style={{ background: 'var(--code-bg)', color: 'var(--text-secondary)' }}>
                      {typeof toolCall.output === 'string'
                        ? toolCall.output
                        : JSON.stringify(toolCall.output, null, 2)}
                    </pre>
                  </div>
                )}

                {/* 错误信息 */}
                {hasError && (
                  <div>
                    <div className="text-xs font-semibold text-red-400 mb-1">
                      错误信息:
                    </div>
                    <pre className="bg-red-900/20 rounded p-2 overflow-x-auto text-xs text-red-300">
                      {toolCall.error}
                    </pre>
                  </div>
                )}

                {/* 执行中状态 */}
                {isExecuting && (
                  <div className="text-xs text-yellow-400 italic">
                    正在执行工具...
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
