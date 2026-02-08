import { z } from 'zod';
import { ToolConfig } from '../types/tool.types';

export const currentTimeTool: ToolConfig = {
  name: 'current_time',
  description: '获取当前时间和日期',
  enabled: true,
  schema: z.object({}),
  handler: async (_params?: Record<string, never>) => {
    const now = new Date();
    return `当前时间: ${now.toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'long',
    })}`;
  },
};
