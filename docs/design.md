# 技术设计与架构

## 1. 架构概览

```
┌─────────────────────────────────────┐
│            index.html               │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌────┐ │
│  │登录页│ │列表页│ │角色页│ │聊天│ │  ← 页面容器（display 切换）
│  └──────┘ └──────┘ └──────┘ └────┘ │
│  ┌──────┐                          │
│  │设置页│                          │
│  └──────┘                          │
├─────────────────────────────────────┤
│            js/ 模块层               │
│  app.js ←→ auth.js                 │
│    ↓                                │
│  characters.js ←→ storage.js       │
│    ↓                                │
│  chat.js ←→ ai.js / api.js         │
│    ↓                                │
│  ui.js                             │
├─────────────────────────────────────┤
│         localStorage                │
│  ├── chat_users                    │
│  ├── chat_characters_{userId}      │
│  ├── chat_messages_{characterId}   │
│  ├── chat_settings_{userId}        │
│  └── chat_session                  │
└─────────────────────────────────────┘
```

## 2. 技术选型理由

| 选择 | 理由 |
|------|------|
| 纯 HTML/CSS/JS | 零依赖，双击即运行，用户无需安装任何工具 |
| localStorage | 纯前端存储，无需服务器，数据存用户浏览器 |
| 单文件多页面 | 通过 display 切换模拟页面跳转，简单可靠 |
| CSS 变量 | 统一管理白色主题色值，方便后续扩展 |

## 3. 模块职责

| 模块 | 职责 | 依赖 |
|------|------|------|
| app.js | 页面切换、应用初始化、全局状态 | auth.js, storage.js |
| auth.js | 注册、登录、登出、会话管理 | storage.js |
| storage.js | localStorage 读写封装、数据序列化 | 无 |
| characters.js | 角色增删改查 | storage.js |
| chat.js | 消息收发、列表渲染、滚动控制 | ai.js, api.js, storage.js |
| ai.js | 模拟 AI 回复生成（性格模板匹配） | 无 |
| api.js | 真 AI 接口调用（多模型支持） | storage.js（读配置） |
| ui.js | Toast 提示、确认弹窗、加载动画 | 无 |

## 4. 页面状态切换

```javascript
// 页面枚举
const PAGES = {
  LOGIN: 'login',
  CHARACTER_LIST: 'list',
  CHARACTER_FORM: 'form',   // 创建/编辑共用
  CHAT: 'chat',
  SETTINGS: 'settings'
};

// 切换方法：隐藏所有页面，显示目标页面
function showPage(pageName, params) { ... }
```

## 5. 手机端适配策略

- viewport 设置：width=device-width, initial-scale=1.0
- 基准宽度：375px（iPhone 6/7/8）
- 最大宽度：max-width: 480px，居中显示
- 使用 rem 单位（1rem = 16px）
- 触摸事件：使用 click（兼容性最好），长按使用定时器
- 输入框在底部时注意软键盘弹出遮挡
