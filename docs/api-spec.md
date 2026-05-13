# 数据模型与接口规范

## 1. localStorage 存储结构

### 1.1 键名规范
所有键名以 `chat_` 为前缀，避免与其他应用冲突。

```
chat_session          → { username, loginTime }       # 当前登录会话
chat_users            → [{ username, passwordHash, createdAt }]  # 用户列表
chat_characters_{username}  → [{ id, name, ... }]     # 某用户的角色列表
chat_messages_{characterId} → [{ id, content, ... }]  # 某个角色的聊天记录
chat_settings_{username}    → { aiMode, provider, ... }   # 某用户的设置
```

### 1.2 用户对象
```javascript
{
  username: "zhangsan",           // 用户名（唯一）
  passwordHash: "sha256...",      // SHA-256 哈希后的密码
  createdAt: "2026-05-13T10:00"   // 注册时间
}
```

### 1.3 角色对象
```javascript
{
  id: "c_001",                    // 唯一 ID，格式 c_timestamp
  name: "小明",                   // 角色姓名
  gender: "男",                   // 男 / 女 / 其他
  age: 25,                        // 年龄
  height: 175,                    // 身高 cm
  weight: 68,                     // 体重 kg
  personality: "温柔体贴，善解人意", // 性格描述（必填）
  notes: "大学同学",              // 用户备注（可选，可修改）
  avatar: "preset_1",            // 头像：preset_N 或 base64 数据
  // === 选填字段 ===
  bio: "从小在上海长大...",       // 人物描述（自由文本）
  occupation: "程序员",           // 职业
  hometown: "上海",               // 家乡
  hobbies: "打游戏、跑步",         // 兴趣爱好
  catchphrase: "真的假的",        // 口头禅
  relationship: "朋友",           // 关系类型
  callMe: "兄弟",                 // 对你的称呼
  chatGoal: "日常闲聊",           // 聊天目的
  speakingStyle: "话多活泼",       // 说话风格
  routine: "夜猫子",              // 作息习惯
  mbtiZodiac: "INFP/天蝎座",      // MBTI或星座
  bgType: "color",               // 背景类型：color / image
  bgValue: "#f0f0f0",            // 背景值：颜色码 或 base64 图片
  createdAt: "2026-05-13T10:30"  // 创建时间
}
```

### 1.4 消息对象
```javascript
{
  id: "m_001",                    // 唯一 ID
  characterId: "c_001",           // 所属角色 ID
  content: "你好呀！",            // 消息文本
  type: "sent",                   // sent(用户) / received(AI)
  timestamp: "2026-05-13T10:31"   // 时间戳
}
```

### 1.5 应用设置对象
```javascript
{
  aiMode: "simulate",             // simulate / real
  provider: "openai",             // openai / claude / deepseek / custom
  apiKey: "sk-xxx",               // API Key（仅真 AI 模式有效）
  apiUrl: "https://api.openai.com", // 自定义 API 地址（可选）
  model: "gpt-4o"                 // 模型名称（可选）
}
```

## 2. 真 AI API 接口规范

### 2.0 支持的模型提供商

| 提供商 | 标识 | 默认 API 地址 | 默认模型 |
|--------|------|--------------|----------|
| OpenAI | openai | api.openai.com | gpt-4o |
| Anthropic | claude | api.anthropic.com | claude-sonnet-4-6 |
| DeepSeek | deepseek | api.deepseek.com | deepseek-chat |
| 通义千问 | qwen | dashscope.aliyuncs.com | qwen-plus |
| 智谱 ChatGLM | zhipu | open.bigmodel.cn | glm-4 |
| 月之暗面 Kimi | moonshot | api.moonshot.cn | moonshot-v1-8k |
| 豆包 | doubao | ark.cn-beijing.volces.com | (需自行填写) |
| 文心一言 | qianfan | qianfan.baidubce.com | ernie-4.0-turbo-8k |
| Google Gemini | gemini | generativelanguage.googleapis.com | gemini-2.5-flash |
| 自定义 | custom | (自行填写) | (自行填写) |

> Claude 和 Gemini 使用各自原生 API 格式，其余均使用 OpenAI 兼容接口格式。

### 2.1 OpenAI 兼容接口
```
POST {apiUrl}/v1/chat/completions
Headers:
  Authorization: Bearer {apiKey}
  Content-Type: application/json
Body:
  {
    "model": "{model}",
    "messages": [
      { "role": "system", "content": "{角色人设 prompt}" },
      { "role": "user", "content": "{用户消息}" },
      ...历史消息
    ]
  }
```

### 2.2 角色人设 Prompt 模板
```
你现在扮演一个名叫{name}的人，以下是你的个人信息：
- 性别：{gender}
- 年龄：{age}岁
- 身高：{height}cm
- 体重：{weight}kg
- 性格：{personality}
- 备注：{notes}

请完全代入这个角色，用符合你性格和身份的方式与对方聊天。
回复要简短自然，像真人微信聊天一样，不要长篇大论。
```

## 3. 模拟 AI 引擎规范

### 3.1 性格关键词映射
引擎通过分析 personality 字段中的关键词，匹配回复风格：

| 关键词 | 风格 | 语气特征 |
|--------|------|----------|
| 温柔/体贴/善良 | gentle | 语气温和，关心对方 |
| 高冷/傲娇/冷淡 | cold | 话少，嘴硬心软 |
| 活泼/开朗/阳光 | lively | 热情，多用感叹号 |
| 成熟/稳重/理性 | mature | 简洁有条理 |
| 幽默/风趣/搞笑 | funny | 爱开玩笑 |
| 害羞/内向/安静 | shy | 话少，容易害羞 |

### 3.2 回复生成策略
1. 分析性格关键词，确定主要风格
2. 从对应风格的回复模板库中随机选取
3. 根据对话上下文做简单调整
4. 加入少量随机延迟（300-800ms）模拟打字
