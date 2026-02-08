import { z } from 'zod';
import { ToolConfig } from '../types/tool.types';

interface CalculatorParams {
  expression: string;
}

export const calculatorTool: ToolConfig<CalculatorParams> = {
  name: 'calculator',
  description: '计算数学表达式',
  enabled: true,
  schema: z.object({
    expression: z.string().describe('要计算的数学表达式，例如 "2 + 3 * 4"'),
  }),
  handler: async (params?: CalculatorParams) => {
    if (!params) return '';
    const { expression } = params;
    try {
      // 简单的数学表达式计算（生产环境中应使用更安全的方法）
      const result = Function(`"use strict"; return (${expression})`)();
      return `计算结果: ${expression} = ${result}`;
    } catch {
      return `计算错误: 无法计算表达式 "${expression}"`;
    }
  },
};
