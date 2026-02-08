import { DynamicStructuredTool } from '@langchain/core/tools';
import { toolsConfig } from '../config/tools.config';
import type { ToolConfig } from '../types/tool.types';

/**
 * 将自定义工具配置转换为 LangChain Tool 格式
 * @param toolConfig 自定义工具配置
 * @returns LangChain DynamicStructuredTool 实例
 */
export function convertToLangChainTool(
  toolConfig: ToolConfig
): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: toolConfig.name,
    description: toolConfig.description,
    schema: toolConfig.schema,
    func: async (input: any) => {
      try {
        console.log(`调用工具: ${toolConfig.name}，参数:`, input);
        const result = await toolConfig.handler(input);
        console.log(`工具 ${toolConfig.name} 返回结果:`, result);
        return result;
      } catch (error) {
        console.error(`工具 ${toolConfig.name} 执行失败:`, error);
        return `工具执行失败: ${error instanceof Error ? error.message : String(error)}`;
      }
    },
  });
}

/**
 * 根据工具 ID 列表创建 LangChain 工具数组
 * @param toolIds 工具 ID 列表
 * @returns LangChain Tool 数组
 */
export function createLangChainTools(
  toolIds?: string[]
): DynamicStructuredTool[] {
  if (!toolIds || toolIds.length === 0) {
    console.log('未选择任何工具');
    return [];
  }

  const tools: DynamicStructuredTool[] = [];

  for (const toolId of toolIds) {
    const toolConfig = toolsConfig[toolId];

    if (!toolConfig) {
      console.warn(`工具配置不存在: ${toolId}`);
      continue;
    }

    if (!toolConfig.enabled) {
      console.warn(`工具未启用: ${toolId}`);
      continue;
    }

    tools.push(convertToLangChainTool(toolConfig));
    console.log(`已添加工具: ${toolConfig.name}`);
  }

  console.log(`总共创建了 ${tools.length} 个工具`);
  return tools;
}
