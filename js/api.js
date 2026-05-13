// ===== 真 AI 接口调用模块 =====
const AIAPI = (() => {

  // 默认 API 地址
  const DEFAULT_URLS = {
    openai: 'https://api.openai.com',
    claude: 'https://api.anthropic.com',
    deepseek: 'https://api.deepseek.com',
    qwen: 'https://dashscope.aliyuncs.com/compatible-mode',
    zhipu: 'https://open.bigmodel.cn/api/paas/v4',
    moonshot: 'https://api.moonshot.cn',
    doubao: 'https://ark.cn-beijing.volces.com/api/v3',
    qianfan: 'https://qianfan.baidubce.com/v2',
    gemini: 'https://generativelanguage.googleapis.com/v1beta',
    custom: ''
  };

  // 默认模型
  const DEFAULT_MODELS = {
    openai: 'gpt-4o',
    claude: 'claude-sonnet-4-6',
    deepseek: 'deepseek-chat',
    qwen: 'qwen-plus',
    zhipu: 'glm-4',
    moonshot: 'moonshot-v1-8k',
    doubao: 'ep-20241201000000-xxxxx',
    qianfan: 'ernie-4.0-turbo-8k',
    gemini: 'gemini-2.5-flash',
    custom: ''
  };

  // 构建角色人设 Prompt
  function buildSystemPrompt(character) {
    const genderText = character.gender === '女' ? '女性' : character.gender === '男' ? '男性' : '人';
    let prompt = `你现在扮演一个名叫"${character.name}"的${genderText}，以下是你的个人信息：
- 年龄：${character.age}岁
- 身高：${character.height}cm
- 体重：${character.weight}kg
- 性格：${character.personality}`;

    if (character.bio) prompt += '\n- 人物描述：' + character.bio;
    if (character.occupation) prompt += '\n- 职业：' + character.occupation;
    if (character.hometown) prompt += '\n- 家乡：' + character.hometown;
    if (character.hobbies) prompt += '\n- 兴趣爱好：' + character.hobbies;
    if (character.catchphrase) prompt += '\n- 口头禅：' + character.catchphrase;
    if (character.relationship) prompt += '\n- 与对方的关系：' + character.relationship;
    if (character.callMe) prompt += '\n- 称呼对方为：' + character.callMe;
    if (character.chatGoal) prompt += '\n- 聊天目的：' + character.chatGoal;
    if (character.speakingStyle) prompt += '\n- 说话风格：' + character.speakingStyle;
    if (character.routine) prompt += '\n- 作息习惯：' + character.routine;
    if (character.mbtiZodiac) prompt += '\n- MBTI/星座：' + character.mbtiZodiac;
    if (character.notes) prompt += '\n- 备注：' + character.notes;

    prompt += `\n\n请完全代入这个角色，用符合你性格和身份的方式与对方聊天。
回复要简短自然，像真人微信聊天一样，1-3句话即可，不要长篇大论。
不要提及自己是AI或模型，你就是${character.name}本人。`;

    return prompt;
  }

  // 构建消息历史
  function buildMessages(character, currentMsg, historyMessages) {
    const messages = [
      { role: 'system', content: buildSystemPrompt(character) }
    ];
    // 取最近 20 条历史
    const recent = historyMessages.slice(-20);
    for (const msg of recent) {
      if (msg.type === 'sent') {
        messages.push({ role: 'user', content: msg.content });
      } else {
        messages.push({ role: 'assistant', content: msg.content });
      }
    }
    messages.push({ role: 'user', content: currentMsg });
    return messages;
  }

  async function sendMessage(settings, character, userMessage, historyMessages) {
    const provider = settings.provider || 'openai';
    const apiUrl = settings.apiUrl || DEFAULT_URLS[provider];
    const model = settings.model || DEFAULT_MODELS[provider];
    const apiKey = settings.apiKey;

    if (!apiKey) {
      throw new Error('请先配置 API Key');
    }

    if (!apiUrl) {
      throw new Error('请填写 API 地址');
    }

    const messages = buildMessages(character, userMessage, historyMessages);

    let endpoint, headers, body;

    if (provider === 'claude') {
      endpoint = apiUrl + '/v1/messages';
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      };
      body = JSON.stringify({
        model: model,
        max_tokens: 300,
        system: buildSystemPrompt(character),
        messages: [
          ...recentMessages(historyMessages, character),
          { role: 'user', content: userMessage }
        ]
      });
    } else if (provider === 'gemini') {
      // Gemini 专用格式
      endpoint = apiUrl + '/models/' + model + ':generateContent?key=' + encodeURIComponent(apiKey);
      headers = { 'Content-Type': 'application/json' };
      const systemPrompt = buildSystemPrompt(character);
      const geminiContents = [];
      const recent = historyMessages.slice(-20);
      for (const msg of recent) {
        geminiContents.push({
          role: msg.type === 'sent' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      }
      geminiContents.push({ role: 'user', parts: [{ text: userMessage }] });
      body = JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: geminiContents
      });
    } else {
      // OpenAI 兼容格式（OpenAI / DeepSeek / 自定义）
      endpoint = apiUrl + '/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      };
      body = JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: 300,
        temperature: 0.8
      });
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: body
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg;
      try {
        const errJson = JSON.parse(errText);
        // Gemini 错误格式不同
        errMsg = errJson.error?.message || errJson.error?.code || errText;
      } catch {
        errMsg = errText;
      }
      throw new Error('API 请求失败 (' + response.status + '): ' + errMsg);
    }

    const data = await response.json();

    // 解析回复
    if (provider === 'claude') {
      return data.content?.[0]?.text || '（无回复）';
    } else if (provider === 'gemini') {
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '（无回复）';
    } else {
      return data.choices?.[0]?.message?.content || '（无回复）';
    }
  }

  function recentMessages(historyMessages, character) {
    const recent = historyMessages.slice(-20);
    return recent.map(msg => ({
      role: msg.type === 'sent' ? 'user' : 'assistant',
      content: msg.content
    }));
  }

  // 测试连接
  async function testConnection(settings) {
    const testChar = {
      name: '测试',
      gender: '其他',
      age: 18,
      height: 170,
      weight: 60,
      personality: '开朗',
      notes: ''
    };
    await sendMessage(settings, testChar, '你好，请回复"连接成功"', []);
    return true;
  }

  return { sendMessage, testConnection, DEFAULT_URLS, DEFAULT_MODELS };
})();
