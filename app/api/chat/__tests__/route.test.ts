/**
 * 聊天 API 单元测试
 * 覆盖：流式传输、获取历史记录、新创建会话
 */
import { NextRequest } from 'next/server';
import { POST, GET } from '../route';

jest.mock('../../../utils/loadEnv', () => ({}));
jest.mock('@/app/agent/chatbot', () => ({
  getApp: jest.fn(),
}));
jest.mock('@/app/agent/db', () => ({
  createSession: jest.fn(),
}));
jest.mock('@langchain/core/messages', () => {
  const actual = jest.requireActual('@langchain/core/messages');
  return {
    ...actual,
    mapStoredMessageToChatMessage: jest.fn(),
  };
});

const { getApp } = require('@/app/agent/chatbot');
const { createSession } = require('@/app/agent/db');
const { mapStoredMessageToChatMessage } = require('@langchain/core/messages');
const { HumanMessage } = require('@langchain/core/messages');

// 测试时屏蔽 route 内的 console，避免误以为报错
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  jest.restoreAllMocks();
});

function nextRequest(url: string, init?: { method?: string; body?: string }) {
  return new NextRequest(url, {
    method: init?.method ?? 'GET',
    body: init?.body,
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
  });
}

/** 读取流式响应的所有行（按 \n 分割的 JSON） */
async function readStreamLines(res: Response): Promise<string[]> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const lines: string[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n');
    buffer = parts.pop() ?? '';
    for (const line of parts) if (line.trim()) lines.push(line.trim());
  }
  if (buffer.trim()) lines.push(buffer.trim());
  return lines;
}

describe('POST /api/chat - 流式传输与新会话', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('无 message 时返回 400', async () => {
    const req = nextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('无效的消息格式');
  });

  it('message 为数组（多模态）时正常处理', async () => {
    const mockStreamEvents = jest.fn(async function* () {
      yield { event: 'on_chat_model_end', data: { output: {} } };
    });
    (getApp as jest.Mock).mockResolvedValue({
      streamEvents: mockStreamEvents,
      getState: jest.fn().mockResolvedValue({ values: { messages: [] } }),
    });
    const req = nextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: [{ type: 'text', text: '看图说句话' }],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const lines = await readStreamLines(res);
    const endEvent = lines.map((l) => JSON.parse(l)).find((o) => o.type === 'end');
    expect(endEvent).toBeDefined();
  });

  it('message 为 object 且 mapStoredMessageToChatMessage 成功时使用其返回值', async () => {
    (mapStoredMessageToChatMessage as jest.Mock).mockReturnValue(new HumanMessage('来自对象'));
    const mockStreamEvents = jest.fn(async function* () {
      yield { event: 'on_chat_model_end', data: { output: {} } };
    });
    (getApp as jest.Mock).mockResolvedValue({
      streamEvents: mockStreamEvents,
      getState: jest.fn().mockResolvedValue({ values: { messages: [] } }),
    });
    const req = nextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: { type: 'human', content: '来自对象' },
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mapStoredMessageToChatMessage).toHaveBeenCalled();
  });

  it('message 为 object 且 mapStoredMessageToChatMessage 抛错但有 content 时用 content 构造', async () => {
    (mapStoredMessageToChatMessage as jest.Mock).mockImplementation(() => {
      throw new Error('parse error');
    });
    const mockStreamEvents = jest.fn(async function* () {
      yield { event: 'on_chat_model_end', data: { output: {} } };
    });
    (getApp as jest.Mock).mockResolvedValue({
      streamEvents: mockStreamEvents,
      getState: jest.fn().mockResolvedValue({ values: { messages: [] } }),
    });
    const req = nextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: { content: 'fallback 文本' },
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const lines = await readStreamLines(res);
    const endEvent = lines.map((l) => JSON.parse(l)).find((o) => o.type === 'end');
    expect(endEvent).toBeDefined();
  });

  it('message 为 object 且 mapStoredMessageToChatMessage 抛错时使用 kwargs.content', async () => {
    (mapStoredMessageToChatMessage as jest.Mock).mockImplementation(() => {
      throw new Error('parse error');
    });
    const mockStreamEvents = jest.fn(async function* () {
      yield { event: 'on_chat_model_end', data: { output: {} } };
    });
    (getApp as jest.Mock).mockResolvedValue({
      streamEvents: mockStreamEvents,
      getState: jest.fn().mockResolvedValue({ values: { messages: [] } }),
    });
    const req = nextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: { kwargs: { content: '来自 kwargs' } },
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const lines = await readStreamLines(res);
    const endEvent = lines.map((l) => JSON.parse(l)).find((o) => o.type === 'end');
    expect(endEvent).toBeDefined();
  });

  it('message 为 object 且无 content 时返回 400', async () => {
    (mapStoredMessageToChatMessage as jest.Mock).mockImplementation(() => {
      throw new Error('parse error');
    });
    const req = nextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: { foo: 'bar' },
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('无效的消息格式');
    expect(json.detail).toContain('content');
  });

  it('message 为 null 时返回 400', async () => {
    const req = nextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: null }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('无效的消息格式');
  });

  it('新创建会话：不传 thread_id 时先收到 session 事件且调用 createSession', async () => {
    const mockStreamEvents = jest.fn(async function* () {
      yield { event: 'on_chat_model_end', data: { output: {} } };
    });
    const mockGetState = jest.fn().mockResolvedValue({ values: { messages: [] } });
    (getApp as jest.Mock).mockResolvedValue({
      streamEvents: mockStreamEvents,
      getState: mockGetState,
    });

    const req = nextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: '第一条消息' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/plain');

    const lines = await readStreamLines(res);
    expect(lines.length).toBeGreaterThanOrEqual(2); // session + end

    const first = JSON.parse(lines[0]);
    expect(first.type).toBe('session');
    expect(first.thread_id).toBeDefined();
    expect(typeof first.thread_id).toBe('string');

    const last = JSON.parse(lines[lines.length - 1]);
    expect(last.type).toBe('end');
    expect(last.thread_id).toBe(first.thread_id);
    expect(last.status).toBe('success');

    expect(createSession).toHaveBeenCalledTimes(1);
    expect(createSession).toHaveBeenCalledWith(first.thread_id, '第一条消息');
  });

  it('流式传输：能收到 chunk 与 end 事件', async () => {
    const mockStreamEvents = jest.fn(async function* () {
      yield {
        event: 'on_chat_model_stream',
        data: { chunk: { content: '你' } },
      };
      yield {
        event: 'on_chat_model_stream',
        data: { chunk: { content: '好' } },
      };
      yield { event: 'on_chat_model_end', data: { output: {} } };
    });
    (getApp as jest.Mock).mockResolvedValue({
      streamEvents: mockStreamEvents,
      getState: jest.fn().mockResolvedValue({ values: { messages: [] } }),
    });

    const req = nextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'hi' }),
    });
    const res = await POST(req);
    const lines = await readStreamLines(res);

    const chunks = lines.map((l) => JSON.parse(l)).filter((o) => o.type === 'chunk');
    expect(chunks.length).toBe(2);
    expect(chunks[0].content).toBe('你');
    expect(chunks[1].content).toBe('好');

    const endEvent = lines.map((l) => JSON.parse(l)).find((o) => o.type === 'end');
    expect(endEvent).toBeDefined();
    expect(endEvent.messages).toEqual([]);
  });

  it('新会话且 message 为数组时 sessionName 从 text 提取', async () => {
    const mockStreamEvents = jest.fn(async function* () {
      yield { event: 'on_chat_model_end', data: { output: {} } };
    });
    (getApp as jest.Mock).mockResolvedValue({
      streamEvents: mockStreamEvents,
      getState: jest.fn().mockResolvedValue({ values: { messages: [] } }),
    });
    const req = nextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: [{ type: 'text', text: '多模态标题' }],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const lines = await readStreamLines(res);
    const first = JSON.parse(lines[0]);
    expect(first.type).toBe('session');
    expect(createSession).toHaveBeenCalledWith(first.thread_id, '多模态标题');
  });

  it('新会话且 message 为 object 时 sessionName 从 content 提取', async () => {
    (mapStoredMessageToChatMessage as jest.Mock).mockReturnValue(new HumanMessage('obj'));
    const mockStreamEvents = jest.fn(async function* () {
      yield { event: 'on_chat_model_end', data: { output: {} } };
    });
    (getApp as jest.Mock).mockResolvedValue({
      streamEvents: mockStreamEvents,
      getState: jest.fn().mockResolvedValue({ values: { messages: [] } }),
    });
    const req = nextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: { content: '来自 content 的标题' },
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const lines = await readStreamLines(res);
    const first = JSON.parse(lines[0]);
    expect(first.type).toBe('session');
    expect(createSession).toHaveBeenCalledWith(first.thread_id, '来自 content 的标题');
  });

  it('新会话且 message 为 object 且 content 为数组时 sessionName 从 text 项提取', async () => {
    (mapStoredMessageToChatMessage as jest.Mock).mockReturnValue(new HumanMessage('obj'));
    const mockStreamEvents = jest.fn(async function* () {
      yield { event: 'on_chat_model_end', data: { output: {} } };
    });
    (getApp as jest.Mock).mockResolvedValue({
      streamEvents: mockStreamEvents,
      getState: jest.fn().mockResolvedValue({ values: { messages: [] } }),
    });
    const req = nextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: { content: [{ type: 'text', text: '数组内容标题' }] },
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const lines = await readStreamLines(res);
    const first = JSON.parse(lines[0]);
    expect(first.type).toBe('session');
    expect(createSession).toHaveBeenCalledWith(first.thread_id, '数组内容标题');
  });

  it('已有 thread_id 时不发送 session 事件且不调用 createSession', async () => {
    const tid = 'existing-thread-123';
    const mockStreamEvents = jest.fn(async function* () {
      yield { event: 'on_chat_model_end', data: { output: {} } };
    });
    (getApp as jest.Mock).mockResolvedValue({
      streamEvents: mockStreamEvents,
      getState: jest.fn().mockResolvedValue({ values: { messages: [] } }),
    });

    const req = nextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: '继续', thread_id: tid }),
    });
    const res = await POST(req);
    const lines = await readStreamLines(res);

    const sessionEvents = lines.map((l) => JSON.parse(l)).filter((o) => o.type === 'session');
    expect(sessionEvents.length).toBe(0);
    expect(createSession).not.toHaveBeenCalled();

    const endEvent = lines.map((l) => JSON.parse(l)).find((o) => o.type === 'end');
    expect(endEvent.thread_id).toBe(tid);
  });

  it('流式错误时收到 type: error', async () => {
    (getApp as jest.Mock).mockRejectedValue(new Error('model error'));

    const req = nextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'hi' }),
    });
    const res = await POST(req);
    const lines = await readStreamLines(res);
    const err = lines.map((l) => JSON.parse(l)).find((o) => o.type === 'error');
    expect(err).toBeDefined();
    expect(err.error).toBe('服务器内部错误');
  });

  it('流式事件包含 tool_calls、on_tool_end、on_tool_error 时正确透传', async () => {
    const mockStreamEvents = jest.fn(async function* () {
      yield {
        event: 'on_chat_model_end',
        data: {
          output: {
            tool_calls: [{ name: 'search', args: { q: 'x' } }],
          },
        },
      };
      yield { event: 'on_tool_end', name: 'search', data: { result: 'ok' } };
      yield { event: 'on_tool_error', name: 'search', data: { error: 'tool failed' } };
    });
    (getApp as jest.Mock).mockResolvedValue({
      streamEvents: mockStreamEvents,
      getState: jest.fn().mockResolvedValue({ values: { messages: [] } }),
    });
    const req = nextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'hi', thread_id: 't1' }),
    });
    const res = await POST(req);
    const lines = await readStreamLines(res);
    const parsed = lines.map((l) => JSON.parse(l));
    const toolCalls = parsed.find((o) => o.type === 'tool_calls');
    expect(toolCalls).toBeDefined();
    expect(toolCalls.tool_calls).toHaveLength(1);
    expect(toolCalls.tool_calls[0].name).toBe('search');

    const toolResult = parsed.find((o) => o.type === 'tool_result');
    expect(toolResult).toBeDefined();
    expect(toolResult.name).toBe('search');
    expect(toolResult.data).toEqual({ result: 'ok' });

    const toolError = parsed.find((o) => o.type === 'tool_error');
    expect(toolError).toBeDefined();
    expect(toolError.name).toBe('search');
    expect(toolError.data).toEqual({ error: 'tool failed' });
  });

  it('POST 请求体非 JSON 时返回 500', async () => {
    const req = nextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: 'not json at all',
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('服务器内部错误');
  });
});

describe('GET /api/chat - 获取历史记录', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('无 thread_id 时返回 API 信息', async () => {
    const req = nextRequest('http://localhost/api/chat');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toBe('LangGraph 聊天 API 正在运行');
    expect(json.version).toBe('1.0.0');
    expect(json.endpoints?.history).toContain('thread_id');
  });

  it('有 thread_id 时返回该会话历史', async () => {
    const threadId = 'thread-456';
    const historyMessages = [
      { type: 'human', content: '你好' },
      { type: 'ai', content: '你好！' },
    ];
    (getApp as jest.Mock).mockResolvedValue({
      getState: jest.fn().mockResolvedValue({ values: { messages: historyMessages } }),
    });

    const req = nextRequest(`http://localhost/api/chat?thread_id=${threadId}`);
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.thread_id).toBe(threadId);
    expect(json.history).toHaveLength(2);
    expect(json.history[0].content).toBe('你好');
    expect(json.history[1].content).toBe('你好！');
  });

  it('getState 失败时返回 500', async () => {
    (getApp as jest.Mock).mockResolvedValue({
      getState: jest.fn().mockRejectedValue(new Error('db error')),
    });
    const req = nextRequest('http://localhost/api/chat?thread_id=bad');
    const res = await GET(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('获取历史记录失败');
  });
});
