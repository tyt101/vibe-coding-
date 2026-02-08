import '../utils/loadEnv';
import {
  StateGraph,
  MessagesAnnotation,
  START,
  END
} from '@langchain/langgraph';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import path from 'path';
import Database from 'better-sqlite3';
import { createModel } from './utils/models';
import { createLangChainTools } from './utils/tools';

const dbPath = path.resolve(process.cwd(), 'chat_history.db');
export const db = new Database(dbPath);

// 全局缓存：存储不同配置的 workflow
const workflowCache = new Map<string, ReturnType<typeof createWorkflow>>();

/**
 * 创建聊天机器人 workflow
 * @param modelId 模型 ID
 * @param toolIds 工具 ID 列表
 */
function createWorkflow(modelId?: string, toolIds?: string[]) {
  console.log('创建 workflow - 模型:', modelId, '工具:', toolIds);

  // 创建模型实例
  const model = createModel(modelId);

  // 创建工具实例
  const tools = createLangChainTools(toolIds);

  // 绑定工具到模型
  const modelWithTools = tools.length > 0 ? model.bindTools(tools) : model;

  // 聊天节点：处理用户输入并生成回复
  async function chatbotNode(state: typeof MessagesAnnotation.State) {

    try {
      const response = await modelWithTools.invoke(state.messages);
      console.log('模型响应成功，类型:', response._getType?.());
      return { messages: [response] };
    } catch (error) {
      console.error('chatbotNode 错误详情:', error);
      console.error('错误栈:', error instanceof Error ? error.stack : '无栈信息');
      throw error;
    }
  }

  // 判断是否需要调用工具
  function shouldContinue(state: typeof MessagesAnnotation.State) {
    const lastMessage = state.messages[state.messages.length - 1];

    // 检查最后一条消息是否包含 tool_calls
    if (lastMessage && lastMessage._getType() === 'ai') {
      const aiMessage = lastMessage as AIMessage;
      if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
        console.log('检测到工具调用:', aiMessage.tool_calls.length, '个工具');
        return 'tools';
      }
    }

    console.log('无工具调用，结束对话');
    return END;
  }

  // 构建 workflow
  const workflow = new StateGraph(MessagesAnnotation)
    .addNode('chatbot', chatbotNode);

  // 如果有工具，添加工具节点和条件路由
  if (tools.length > 0) {
    const toolNode = new ToolNode(tools);
    workflow
      .addNode('tools', toolNode)
      .addEdge(START, 'chatbot')
      .addConditionalEdges('chatbot', shouldContinue, {
        tools: 'tools',
        [END]: END,
      })
      .addEdge('tools', 'chatbot');
  } else {
    // 无工具，直接连接
    workflow.addEdge(START, 'chatbot').addEdge('chatbot', END);
  }

  return workflow;
}

// 异步初始化检查点保存器
let checkpointer: SqliteSaver;

export const getCheckpointer = () => {
  if (!checkpointer) {
    // 创建 SQLite 检查点保存器
    console.log('初始化 SqliteSaver，数据库路径:', dbPath);
    try {
      checkpointer = new SqliteSaver(db);
      console.log('SqliteSaver 初始化成功');
    } catch (error) {
      console.error('SqliteSaver 初始化失败:', error);
      throw error;
    }
  }
  return checkpointer;
};

/**
 * 获取应用实例
 * @param modelId 模型 ID（可选）
 * @param toolIds 工具 ID 列表（可选）
 * @returns 编译后的 LangGraph 应用
 */
export const getApp = async (modelId?: string, toolIds?: string[]) => {
  // 初始化 checkpointer
  if (!checkpointer) {
    getCheckpointer();
  }

  // 生成缓存 key
  const cacheKey = `${modelId || 'default'}-${(toolIds || []).sort().join(',')}`;
  console.log("%c Line:125 🍎 cacheKey", "color:#33a5ff", cacheKey);
  // 检查缓存
  if (workflowCache.has(cacheKey)) {
    console.log('使用缓存的 workflow:', cacheKey);
    return workflowCache.get(cacheKey)!;
  }

  // 创建新的 workflow
  console.log('创建新的 workflow:', cacheKey);
  const workflow = createWorkflow(modelId, toolIds);
  const app = workflow.compile({ checkpointer });

  // 缓存 workflow（限制缓存大小）
  if (workflowCache.size > 10) {
    const firstKey = workflowCache.keys().next().value;
    workflowCache.delete(firstKey);
    console.log('清理缓存:', firstKey);
  }

  workflowCache.set(cacheKey, app);

  return app;
};

// 流式响应示例
async function runStreamingChatbot() {
  console.log('=== 流式聊天机器人示例 ===');

  const app = await getApp();

  const threadConfig = {
    configurable: { thread_id: 'streaming-demo' + Math.random() },
  };

  console.log('\n--- 流式响应演示 ---');
  console.log('用户: 请详细介绍一下 React 的核心概念');
  console.log('AI: ', { newline: false });

  // 使用 streamEvents 获取流式响应
  for await (const event of app.streamEvents(
    {
      messages: [new HumanMessage('你是谁？')],
    },
    { version: 'v2', ...threadConfig }
  )) {
    // 过滤 LLM 流式输出事件
    if (event.event === 'on_chat_model_stream') {
      const chunk = event.data?.chunk;
      if (chunk?.content) {
        process.stdout.write(chunk.content);
      }
    }
  }

  console.log('\n\n--- 另一个流式响应 ---');
  console.log('用户: 能给我一些学习建议吗？');
  console.log('AI: ', { newline: false });

  for await (const event of app.streamEvents(
    {
      messages: [new HumanMessage('能给我一些学习建议吗？')],
    },
    { version: 'v2', ...threadConfig }
  )) {
    if (event.event === 'on_chat_model_stream') {
      const chunk = event.data?.chunk;
      if (chunk?.content) {
        process.stdout.write(chunk.content);
      }
    }
  }

  console.log('\n');
}

// 流式状态更新示例
async function runStreamingStates() {
  console.log('\n=== 流式状态更新示例 ===');

  const app = await getApp();
  const threadConfig = { configurable: { thread_id: 'state-streaming' } };

  console.log('\n--- 监听状态变化 ---');

  // 使用 stream 方法获取每步的状态更新
  const stream = await app.stream(
    {
      messages: [new HumanMessage('你好，请介绍一下自己')],
    },
    { streamMode: 'updates', ...threadConfig }
  );

  for await (const chunk of stream) {
    console.log('状态更新:', JSON.stringify(chunk, null, 2));
  }
}

// 自定义流式处理器
class StreamingHandler {
  private buffer: string = '';
  private onToken?: (token: string) => void;
  private onComplete?: (fullResponse: string) => void;

  constructor(options: {
    onToken?: (token: string) => void;
    onComplete?: (fullResponse: string) => void;
  }) {
    this.onToken = options.onToken;
    this.onComplete = options.onComplete;
  }

  async handleStream(
    graph: Awaited<ReturnType<typeof getApp>>,
    input: { messages: HumanMessage[] },
    config: { configurable: { thread_id: string } }
  ) {
    this.buffer = '';

    for await (const event of graph.streamEvents(input, {
      version: 'v2',
      ...config,
    })) {
      if (event.event === 'on_chat_model_stream') {
        const chunk = event.data?.chunk;
        if (chunk?.content) {
          this.buffer += chunk.content;
          this.onToken?.(chunk.content);
        }
      }
    }

    this.onComplete?.(this.buffer);
    return this.buffer;
  }
}

// 使用自定义流式处理器的示例
async function runCustomStreamingHandler() {
  console.log('\n=== 自定义流式处理器示例 ===');

  const app = await getApp();
  const threadConfig = { configurable: { thread_id: 'custom-streaming' } };

  const handler = new StreamingHandler({
    onToken: (token) => {
      process.stdout.write(token);
    },
    onComplete: (fullResponse) => {
      console.log(`\n\n[完整响应长度: ${fullResponse.length} 字符]`);
    },
  });

  console.log('\n用户: 请解释一下什么是状态管理');
  console.log('AI: ');

  await handler.handleStream(
    app,
    {
      messages: [new HumanMessage('请解释一下什么是状态管理')],
    },
    threadConfig
  );
}

// 批量流式处理示例
async function runBatchStreaming() {
  console.log('\n=== 批量流式处理示例 ===');

  const app = await getApp();
  const questions = ['什么是组件？', '什么是 Props？', '什么是 State？'];

  for (let i = 0; i < questions.length; i++) {
    const threadConfig = { configurable: { thread_id: `batch-${i}` } };

    console.log(`\n--- 问题 ${i + 1}: ${questions[i]} ---`);
    console.log('AI: ');

    for await (const event of app.streamEvents(
      {
        messages: [new HumanMessage(questions[i])],
      },
      { version: 'v2', ...threadConfig }
    )) {
      if (event.event === 'on_chat_model_stream') {
        const chunk = event.data?.chunk;
        if (chunk?.content) {
          process.stdout.write(chunk.content);
        }
      }
    }

    console.log('\n');
  }
}



export {
  runStreamingChatbot,
  runStreamingStates,
  StreamingHandler,
  runCustomStreamingHandler,
  runBatchStreaming,
  checkpointer,
};
