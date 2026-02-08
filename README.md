# LangGraph Chat App

基于 Next.js 16 和 LangGraphJS 构建的智能聊天应用，支持流式响应、多会话管理和历史记录持久化。

## 特性

- **流式响应** - 实时 AI 对话体验
- **多会话管理** - 支持创建、切换、删除多个会话
- **历史记录** - 聊天记录自动保存到 SQLite

## 技术栈

| 类别     | 技术                         |
| -------- | ---------------------------- |
| 前端框架 | Next.js 16 + React 19        |
| 样式     | Tailwind CSS 4               |
| AI 模型  | Qwen          |
| AI 框架  | LangGraphJS + LangChain      |
| 数据库   | SQLite (better-sqlite3)      |
| 语言     | TypeScript 5                 |

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

在 `.env` 中添加：

# AI 模型配置
在（根目录.env文件和utils/.env文件）中配置API_KEY
OPENAI_API_KEY=xxxxxx
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1  # 阿里云百炼
OPENAI_MODEL_NAME=qwen-plus  # 阿里云百炼模型
### 3. 启动开发服务器

```bash
pnpm run dev 启动项目
```

访问 http://localhost:3000

```bash
pnpm run test 启动单元测试
pnpm run test:coverage 查看单元测试覆盖率
```

## 项目结构

```
app/
├── page.tsx                 # 主页面
├── hooks/                   # 自定义 Hooks
│   ├── useChatMessages.ts   # 消息状态管理
│   ├── useSessionManager.ts # 会话管理
│   ├── useChatHistory.ts    # 历史记录加载
│   └── useSendMessage.ts    # 消息发送
├── components/              # UI 组件
│   ├── MessageList.tsx
│   ├── MessageBubble.tsx
│   ├── ChatInput.tsx
│   └── ...
├── api/chat/                # API 路由
│   ├── route.ts             # 聊天接口
│   └── sessions/route.ts    # 会话管理接口
└── agent/                   # LangGraph Agent
    ├── chatbot.ts           # 状态图定义
    ├── db.ts                # 数据库操作
    └── tools.ts             # 工具函数
```

## API 接口

| 方法   | 路径                      | 说明                 |
| ------ | ------------------------- | -------------------- |
| POST   | `/api/chat`               | 发送消息（流式响应） |
| GET    | `/api/chat?thread_id=xxx` | 获取历史记录         |
| GET    | `/api/chat/sessions`      | 获取会话列表         |
| POST   | `/api/chat/sessions`      | 创建会话             |
| PATCH  | `/api/chat/sessions`      | 更新会话名称         |
| DELETE | `/api/chat/sessions`      | 删除会话             |




## 文档
[记忆，历史记录功能实现详解](1.记忆，历史记录功能实现详解.md)
