'use client';

import { useState, useRef, useEffect } from 'react';

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

interface ToolSelectorProps {
  tools: Tool[];
  selectedTools: string[];
  onToolToggle: (toolId: string) => void;
}

export default function ToolSelector({
  tools,
  selectedTools,
  onToolToggle,
}: ToolSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleToolClick = (toolId: string) => {
    onToolToggle(toolId);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 工具按钮 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200"
        style={
          selectedTools.length > 0
            ? { background: 'linear-gradient(to right, var(--accent-blue), var(--accent-purple))', color: '#fff' }
            : { color: 'var(--text-secondary)' }
        }
        title="选择工具"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
        <span className="text-sm font-medium">工具</span>
        {selectedTools.length > 0 && (
          <span className="flex items-center justify-center w-5 h-5 text-xs rounded-full" style={{ background: 'rgba(255,255,255,0.3)' }}>
            {selectedTools.length}
          </span>
        )}
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div
          className="absolute bottom-full left-0 mb-2 w-72 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200 border"
          style={{ background: 'var(--bg-glass)', borderColor: 'var(--border-default)' }}
        >
          {/* 标题 */}
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              选择工具
            </h3>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              点击选择或取消选择工具
            </p>
          </div>

          {/* 工具列表 */}
          <div className="max-h-80 overflow-y-auto">
            {tools.map((tool) => {
              const isSelected = selectedTools.includes(tool.id);
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => handleToolClick(tool.id)}
                  className="w-full px-4 py-3 text-left transition-colors duration-150"
                  style={{
                    color: 'var(--text-primary)',
                    background: isSelected ? 'rgba(37, 99, 235, 0.15)' : undefined,
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* 复选框 */}
                    <div
                      className="flex-shrink-0 w-5 h-5 mt-0.5 border-2 rounded transition-all duration-200"
                      style={isSelected ? { background: 'var(--accent-blue)', borderColor: 'var(--accent-blue)' } : { borderColor: 'var(--border-default)' }}
                    >
                      {isSelected && (
                        <svg
                          className="w-full h-full"
                          style={{ color: '#fff' }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>

                    {/* 工具信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {tool.icon && <span className="text-lg">{tool.icon}</span>}
                        <span
                          className="text-sm font-medium"
                          style={{ color: isSelected ? 'var(--accent-blue)' : 'var(--text-primary)' }}
                        >
                          {tool.name}
                        </span>
                      </div>
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                        {tool.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 底部操作 */}
          {selectedTools.length > 0 && (
            <div className="px-4 py-3 border-t border-white/10 bg-slate-800/50">
              <button
                type="button"
                onClick={() => {
                  selectedTools.forEach((toolId) => onToolToggle(toolId));
                }}
                className="text-xs text-blue-400 hover:underline"
              >
                清除全部选择
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
