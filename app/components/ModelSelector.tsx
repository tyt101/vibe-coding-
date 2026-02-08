'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface Model {
  id: string;
  name: string;
  description?: string;
}

interface ModelSelectorProps {
  models: Model[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export default function ModelSelector({
  models,
  selectedModel,
  onModelChange,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentModel = models.find((m) => m.id === selectedModel) || models[0];

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

  const handleModelClick = (modelId: string) => {
    onModelChange(modelId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 模型选择按钮 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-all duration-200"
        style={{ color: 'var(--text-primary)' }}
        title="选择模型"
      >
        <span className="font-medium">{currentModel.name}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div
          className="absolute bottom-full left-0 mb-2 w-64 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200 border"
          style={{ background: 'var(--bg-glass)', borderColor: 'var(--border-default)' }}
        >
          {/* 标题 */}
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              选择模型
            </h3>
          </div>

          {/* 模型列表 */}
          <div className="max-h-80 overflow-y-auto">
            {models.map((model) => {
              const isSelected = model.id === selectedModel;
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => handleModelClick(model.id)}
                  className="w-full px-4 py-3 text-left transition-colors duration-150"
                  style={{
                    color: 'var(--text-primary)',
                    background: isSelected ? 'rgba(37, 99, 235, 0.15)' : undefined,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-sm font-medium"
                        style={{ color: isSelected ? 'var(--accent-blue)' : 'var(--text-primary)' }}
                      >
                        {model.name}
                      </div>
                      {model.description && (
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                          {model.description}
                        </p>
                      )}
                    </div>

                    {/* 选中标记 */}
                    {isSelected && (
                      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
