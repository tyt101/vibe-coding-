/**
 * 会话 API 单元测试
 * 覆盖：新创建会话、列表、删除、重命名
 */
import { GET, POST, DELETE, PATCH } from '../route';

jest.mock('@/app/agent/db', () => ({
  getAllSessions: jest.fn(),
  createSession: jest.fn(),
  deleteSession: jest.fn(),
  updateSessionName: jest.fn(),
}));

const db = require('@/app/agent/db');

function request(body?: object, method = 'POST') {
  return new Request('http://localhost/api/chat/sessions', {
    method,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
  });
}

describe('GET /api/chat/sessions', () => {
  it('返回会话列表', async () => {
    (db.getAllSessions as jest.Mock).mockReturnValue([
      { id: 'id1', name: '会话1', created_at: '2025-01-01 00:00:00' },
    ]);
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sessions).toHaveLength(1);
    expect(json.sessions[0]).toMatchObject({ id: 'id1', name: '会话1' });
  });

  it('getAllSessions 抛错时返回 500', async () => {
    (db.getAllSessions as jest.Mock).mockImplementation(() => {
      throw new Error('db error');
    });
    const res = await GET();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('获取会话列表失败');
    expect(json.detail).toContain('db error');
  });
});

describe('POST /api/chat/sessions - 新创建会话', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('传入 name 时创建会话并返回 id', async () => {
    const res = await POST(request({ name: '新会话' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('id');
    expect(typeof json.id).toBe('string');
    expect(db.createSession).toHaveBeenCalledWith(json.id, '新会话');
  });

  it('未传 name 时使用默认名称（新会话-xxx）', async () => {
    const res = await POST(request({}));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('id');
    expect(db.createSession).toHaveBeenCalledWith(
      json.id,
      expect.stringMatching(/^新会话-/)
    );
  });

  it('body 非法时返回 500', async () => {
    const req = new Request('http://localhost/api/chat/sessions', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('新建会话失败');
  });
});

describe('DELETE /api/chat/sessions', () => {
  it('缺少 id 返回 400', async () => {
    const res = await DELETE(request({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('缺少 id');
  });

  it('传入 id 时删除并返回 success', async () => {
    const res = await DELETE(request({ id: 'session-123' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(db.deleteSession).toHaveBeenCalledWith('session-123');
  });

  it('deleteSession 抛错时返回 500', async () => {
    (db.deleteSession as jest.Mock).mockImplementation(() => {
      throw new Error('delete failed');
    });
    const res = await DELETE(request({ id: 'session-123' }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('删除会话失败');
    expect(json.detail).toContain('delete failed');
  });
});

describe('PATCH /api/chat/sessions', () => {
  it('缺少 id 或 name 返回 400', async () => {
    const r1 = await PATCH(request({ name: '新名' }));
    expect(r1.status).toBe(400);
    const r2 = await PATCH(request({ id: 'id1' }));
    expect(r2.status).toBe(400);
  });

  it('传入 id 和 name 时重命名并返回 success', async () => {
    const res = await PATCH(request({ id: 'id1', name: '新名称' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(db.updateSessionName).toHaveBeenCalledWith('id1', '新名称');
  });

  it('updateSessionName 抛错时返回 500', async () => {
    (db.updateSessionName as jest.Mock).mockImplementation(() => {
      throw new Error('update failed');
    });
    const res = await PATCH(request({ id: 'id1', name: '新名称' }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('重命名会话失败');
    expect(json.detail).toContain('update failed');
  });
});
