import { tool } from '@langchain/core/tools';
import { RunnableConfig } from '@langchain/core/runnables';
import {
  getEnabledToolsConfig,
  getCurrentEnvironmentConfig,
  ToolConfig,
  addToolConfig,
  disableTool,
  enableTool,
} from './config/tools.config';

// 从配置创建 LangChain 工具
function createToolFromConfig(config: ToolConfig) {
  return tool(config.handler, {
    name: config.name,
    description: config.description,
    schema: config.schema,
  });
}

// 获取所有启用的工具
export function getAllTools() {
  const enabledConfigs = getEnabledToolsConfig();
  const tools = Object.values(enabledConfigs).map(createToolFromConfig);
  return tools;
}

// 获取特定工具
export function getTool(name: string) {
  const enabledConfigs = getEnabledToolsConfig();
  const config = enabledConfigs[name];
  if (!config) {
    throw new Error(`Tool "${name}" not found or not enabled`);
  }
  return createToolFromConfig(config);
}

// 获取工具映射（向后兼容）
export function getToolsMap() {
  const enabledConfigs = getEnabledToolsConfig();
  const toolsMap: Record<string, unknown> = {};

  for (const [name, config] of Object.entries(enabledConfigs)) {
    toolsMap[name] = createToolFromConfig(config);
  }

  return toolsMap;
}

// 从运行时配置获取工具
export function getToolsFromConfig(config?: RunnableConfig) {
  // 如果配置中有工具，优先使用配置中的工具
  if (config?.configurable?.tools) {
    return config.configurable.tools;
  }

  // 否则使用默认的工具配置
  return getAllTools();
}

// 检查工具是否启用
export function isToolEnabled(name: string): boolean {
  const enabledConfigs = getEnabledToolsConfig();
  return !!enabledConfigs[name];
}

// 获取工具列表（仅名称）
export function getEnabledToolNames(): string[] {
  const envConfig = getCurrentEnvironmentConfig();
  return envConfig.enabledTools;
}

// 获取工具配置信息
export function getToolInfo(name: string) {
  const enabledConfigs = getEnabledToolsConfig();
  const config = enabledConfigs[name];
  if (!config) {
    return null;
  }

  return {
    name: config.name,
    description: config.description,
    enabled: config.enabled,
    options: config.options,
  };
}

// 获取所有工具信息
export function getAllToolsInfo() {
  const enabledConfigs = getEnabledToolsConfig();
  return Object.values(enabledConfigs).map((config) => ({
    name: config.name,
    description: config.description,
    enabled: config.enabled,
    options: config.options,
  }));
}

// 动态工具管理函数（运行时使用）
export const toolManager = {
  // 添加新工具
  addTool: (name: string, config: Omit<ToolConfig, 'name'>) => {
    addToolConfig(name, config);
  },

  // 禁用工具
  disableTool: (name: string) => {
    disableTool(name);
  },

  // 启用工具
  enableTool: (name: string) => {
    enableTool(name);
  },

  // 获取工具状态
  getToolStatus: (name: string) => {
    return {
      exists: isToolEnabled(name),
      info: getToolInfo(name),
    };
  },

  // 列出所有工具
  listTools: () => {
    return getAllToolsInfo();
  },
};

// 向后兼容的导出
export const allTools = getAllTools();
export const toolsMap = getToolsMap();

// 具体工具的快捷访问（向后兼容）
export const calculator = getTool('calculator');
export const weatherTool = getTool('weather');
export const timeTool = getTool('current_time');
export const searchTool = getTool('search');

// 工具初始化函数
export async function initializeAgentTools(config?: RunnableConfig) {
  const tools = getToolsFromConfig(config);
  const envConfig = getCurrentEnvironmentConfig();

  return {
    allTools: tools,
    toolsMap: getToolsMap(),
    enabledTools: getEnabledToolNames(),
    debugMode: envConfig.debugMode,
    toolManager,
  };
}

// 创建工具配置（用于传递给 LangGraph）
export function createAgentToolsConfig() {
  const envConfig = getCurrentEnvironmentConfig();
  return {
    enabledTools: envConfig.enabledTools,
    debugMode: envConfig.debugMode,
    tools: getAllTools(),
  };
}
