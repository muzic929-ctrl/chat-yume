# AI 聊天应用 — 项目指引

## 项目概述
手机网页版 AI 角色聊天应用。用户可创建自定义 AI 角色并与之对话。

## 技术栈
- 纯 HTML + CSS + JavaScript（无框架）
- 数据存储：浏览器 localStorage
- 手机优先的响应式设计

## 标准文档路径

| 文档 | 路径 | 说明 |
|------|------|------|
| 需求规格 | [docs/requirements.md](docs/requirements.md) | 用户需求与功能清单 |
| 技术设计 | [docs/design.md](docs/design.md) | 架构设计、模块职责 |
| 执行步骤 | [docs/execution-plan.md](docs/execution-plan.md) | 分阶段执行任务列表 |
| 接口规范 | [docs/api-spec.md](docs/api-spec.md) | 数据模型、存储结构、AI 接口 |

## 开发日志
每日开发日志存放在 [devlog/](devlog/) 目录，文件名为 `YYYY-MM-DD.md`。

## 工作规范

1. **分阶段开发**：严格按照 execution-plan.md 中的阶段顺序执行，每阶段完成后验证再进入下一阶段
2. **数据兼容**：修改存储结构时必须兼容已有数据，新增字段给默认值
3. **手机优先**：所有 UI 以 375px 宽手机屏幕为基准，使用响应式设计兼容大屏
4. **安全原则**：
   - API Key 只存 localStorage，不上传任何服务器
   - 密码做简单哈希后再存储（使用 SHA-256）
   - 不在前端代码中硬编码任何密钥
5. **错误处理**：所有用户操作必须有反馈（Toast 提示），不允许静默失败
6. **验证方式**：直接双击 `index.html` 在浏览器中打开测试

## 项目结构

```
chat/
├── index.html              # 单页应用入口
├── css/style.css           # 全局样式
├── js/
│   ├── app.js              # 应用主控（页面切换、初始化）
│   ├── auth.js             # 登录注册
│   ├── storage.js          # localStorage 封装
│   ├── characters.js       # 角色 CRUD
│   ├── chat.js             # 聊天逻辑
│   ├── ai.js               # 模拟 AI 引擎
│   ├── api.js              # 真 AI 接口调用
│   └── ui.js               # Toast、弹窗等 UI 工具
├── img/preset/             # 预设头像
├── docs/                   # 项目文档
└── devlog/                 # 开发日志
```
