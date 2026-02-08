// 简单的聊天机器人
export {
  getApp,
  runStreamingChatbot,
  runStreamingStates,
  StreamingHandler,
  runCustomStreamingHandler,
  runBatchStreaming,
  checkpointer,
} from './chatbot';

// 工具定义
export {
  allTools,
  calculator,
  weatherTool,
  timeTool,
  searchTool,
  toolsMap,
  getAllTools,
  getTool,
  getToolsMap,
  getToolsFromConfig,
  isToolEnabled,
  getEnabledToolNames,
  getToolInfo,
  getAllToolsInfo,
  toolManager,
  initializeAgentTools,
  createAgentToolsConfig,
} from './tools';

// 工具配置
export {
  type ToolConfig,
  type EnvironmentConfig,
  toolsConfig,
  environmentConfig,
  getCurrentEnvironmentConfig,
  getEnabledToolsConfig,
  validateToolConfig,
  addToolConfig,
  disableTool,
  enableTool,
} from './config/tools.config';

// 辅助函数
export function formatMessagesForAgent(messages: { role: string; content: string }[]) {
  return messages.map((msg) => {
    if (msg.role === 'user') {
      return { content: msg.content, type: 'human' };
    } else if (msg.role === 'assistant') {
      return { content: msg.content, type: 'ai' };
    }
    return msg;
  });
}
