import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';

/**
 * 创建模型实例（支持多个提供商）
 * @param modelId 模型 ID，格式为 "provider:modelName"，例如 "openai:qwen-max" 或 "google:gemini-2.5-flash"
 * @returns ChatGoogleGenerativeAI 或 ChatOpenAI 实例
 */
export function createModel(modelId?: string): ChatGoogleGenerativeAI | ChatOpenAI {
  // 解析模型 ID
  const fullId = modelId || `openai:qwen-max`;
  const [provider, modelName] = fullId.includes(':')
    ? fullId.split(':', 2)
    : ['google', fullId];

  console.log('创建模型实例 - 提供商:', provider, '模型:', modelName);

  // 创建对应提供商的模型
  if (provider === 'openai') {
    return new ChatOpenAI({
      model: modelName,
      apiKey: process.env.OPENAI_API_KEY,
      configuration: {
        baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      },
      temperature: 0.7,
      streaming: true,
    });
  }

  // 默认使用 Google Gemini
  return new ChatGoogleGenerativeAI({
    model: modelName,
    apiKey: process.env.GOOGLE_API_KEY,
    temperature: 0.7,
    streaming: true,
  });
}
