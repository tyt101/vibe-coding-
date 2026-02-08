import { z } from 'zod';
import { ToolConfig } from '../types/tool.types';

interface SearchParams {
  query: string;
}

export const searchTool: ToolConfig<SearchParams> = {
  name: 'search',
  description: '搜索相关信息',
  enabled: true,
  schema: z.object({
    query: z.string().describe('搜索查询词'),
  }),
  handler: async (params?: SearchParams) => {
    if (!params) return '';
    const { query } = params;
    // 模拟搜索结果
    const searchResults = [
      `关于 "${query}" 的搜索结果：`,
      `1. ${query} 相关的最新信息...`,
      `2. ${query} 的详细解释和说明...`,
      `3. ${query} 的相关链接和资源...`,
      `\n💡 这是一个模拟的搜索功能，在实际应用中可以接入真实的搜索API。`,
    ];

    return searchResults.join('\n');
  },
  options: {
    maxResults: 5,
    searchEngine: 'mock', // 可以配置为 'google', 'bing', 'tavily' 等
    apiKey: process.env.SEARCH_API_KEY,
  },
};
