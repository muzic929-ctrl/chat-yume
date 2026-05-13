// ===== 模拟 AI 引擎 =====
const AI = (() => {

  // 性格关键词 → 风格映射
  const STYLE_MAP = [
    { keywords: ['温柔', '体贴', '善良', '暖心', '善解人意'], style: 'gentle' },
    { keywords: ['高冷', '傲娇', '冷淡', '冷漠', '酷'], style: 'cold' },
    { keywords: ['活泼', '开朗', '阳光', '热情', '外向', '可爱'], style: 'lively' },
    { keywords: ['成熟', '稳重', '理性', '冷静', '睿智', '深沉'], style: 'mature' },
    { keywords: ['幽默', '风趣', '搞笑', '逗比', '有趣', '调皮'], style: 'funny' },
    { keywords: ['害羞', '内向', '安静', '腼腆', '文静', '胆小'], style: 'shy' },
  ];

  function detectStyle(personality) {
    if (!personality) return 'gentle';
    for (const item of STYLE_MAP) {
      for (const kw of item.keywords) {
        if (personality.includes(kw)) return item.style;
      }
    }
    // 默认随机
    const styles = ['gentle', 'lively', 'mature'];
    return styles[Math.floor(Math.random() * styles.length)];
  }

  // 回复模板库
  const TEMPLATES = {
    gentle: [
      '嗯嗯，我懂你的感受呢~',
      '你今天过得开心吗？要记得好好照顾自己哦。',
      '没关系啦，不管发生什么我都会陪着你的。',
      '真的吗？听你这么说我也好开心呢！',
      '有什么烦心事随时可以跟我说哦，我一直都在。',
      '注意休息呀，别太累了呢。',
      '能和你聊天真是一件让人开心的事情~',
      '你说的我都认真听了，我觉得你很棒呢。',
      '要不要一起出去走走？天气这么好~',
      '晚安啦，做个好梦哦🌙',
      '辛苦一天了，好好放松一下吧。',
      '我觉得你说得很有道理呢。',
      '只要你开心，我就开心呀。',
      '别担心，慢慢来，一切都会好起来的。',
      '哈哈，你真可爱~',
    ],
    cold: [
      '嗯。',
      '知道了。',
      '随便你怎么想。',
      '……你话真多。',
      '哼，我才不是在关心你。',
      '行吧。',
      '哦，这样啊。',
      '（其实有点开心，但不表现出来）',
      '随便你。',
      '…好吧，就听你一次。',
      '烦死了，不过……也行吧。',
      '你以为我会在意吗？（其实在意）',
      '算了，懒得跟你计较。',
      '才不是因为你呢，别多想。',
    ],
    lively: [
      '哇！真的吗！！太棒了吧！',
      '哈哈哈哈笑死我了🤣',
      '诶诶诶！这么厉害的吗！！',
      '开心！今天跟你聊天真的好开心呀~',
      '冲冲冲！！一起加油！！',
      '呜呜呜太感动了😭',
      '嘿嘿嘿，你猜我怎么想的~',
      '天呐！！这也太有意思了吧！',
      '对对对！我也是这么觉得的！',
      '今天又有什么好玩的事情要跟我分享呀？',
      '啊啊啊太激动了！！',
      '好耶！！我就知道会这样！！',
      '你怎么这么会说话！笑死我了！',
      '超级期待！！快说快说！！',
    ],
    mature: [
      '嗯，这件事可以这样分析一下。',
      '我理解你的感受，不过换个角度也许会不一样。',
      '凡事都有两面性，冷静下来想想。',
      '你的心情我能体会，需要时间。',
      '做决定之前，建议你多想几步。',
      '成熟的人会先处理好自己的情绪。',
      '这个选择不错，我支持你。',
      '沉住气，不要急。',
      '生活不就是这样，有起有落。',
      '与人相处，最重要的是互相理解。',
    ],
    funny: [
      '哈哈哈哈哈你是不是又想套路我！',
      '今天心情好，给你讲个冷笑话吧：为什么程序员总在晚上工作？因为他们喜欢debug（灯黑）🤣',
      '我怀疑你是来逗我笑的，证据确凿！',
      '行行行，你最厉害了！（狗头保命）',
      '哈哈哈哈笑到我妈以为我在看喜剧片。',
      '说真的，你是不是偷偷吃了开心果？',
      '今天的快乐是你给的，账单我记下了！',
      '诶，我突然有个大胆的想法……算了算了还是不要了。',
      '你这是在考验我的笑点吗？你赢了！',
      '笑死我对你有什么好处？继承我的表情包吗？',
    ],
    shy: [
      '嗯…你好……',
      '（不知道该说什么，有点紧张）',
      '啊，没什么……就是有点不好意思。',
      '你这么说我都不好意思了……',
      '好的……（脸红）',
      '嗯嗯，听你的就好了。',
      '其实我也想说很多话，但是一开口就紧张。',
      '谢谢你愿意陪我聊天……',
      '啊那个……算了不说了……',
      '能跟你聊天，我其实挺开心的……（小声）',
    ],
  };

  // 通用回复（风格匹配不上时使用）
  const GENERIC = [
    '嗯嗯，我理解了。',
    '这样啊…',
    '然后呢？',
    '你说得对。',
    '有道理呢。',
    '好的好的~',
    '继续说吧，我在听。',
    '哈哈，有意思。',
    '嗯…让我想想。',
    '是的呢。',
  ];

  function generateReply(character, userMessage, historyMessages) {
    // 综合判断风格：说话风格 > 性格关键词检测
    let style = 'gentle';
    if (character.speakingStyle) {
      const styleMap = {
        '话多活泼': 'lively', '话少简洁': 'cold', '温柔体贴': 'gentle',
        '毒舌犀利': 'cold', '幽默风趣': 'funny', '成熟稳重': 'mature'
      };
      style = styleMap[character.speakingStyle] || detectStyle(character.personality);
    } else {
      style = detectStyle(character.personality);
    }
    const templates = TEMPLATES[style] || GENERIC;

    const msg = userMessage.trim();
    const callMe = character.callMe || '你';

    // 口头禅（30% 概率在回复尾附上）
    const maybeAddCatchphrase = () => {
      if (character.catchphrase && Math.random() < 0.3) {
        return character.catchphrase;
      }
      return '';
    };

    // 你好
    if (msg.includes('你好') || msg.includes('嗨') || msg.includes('hi') || msg.includes('Hi')) {
      if (style === 'cold') return '嗯，你好。';
      if (style === 'shy') return '你……你好……';
      if (style === 'lively') return '你好呀！！好开心见到' + callMe + '！！';
      return '你好呀' + callMe + '，我是' + character.name + '~';
    }

    // 再见/晚安
    if (msg.includes('再见') || msg.includes('拜拜') || msg.includes('晚安')) {
      if (style === 'cold') return '嗯，走吧。';
      if (style === 'gentle') return '晚安哦' + callMe + '，做个好梦~明天我等你！';
      if (style === 'lively') return '拜拜' + callMe + '！！明天还要来找我玩哦！！';
      return '好的' + callMe + '，下次再聊~';
    }

    // 谢谢
    if (msg.includes('谢谢') || msg.includes('感谢')) {
      if (style === 'cold') return '……不用谢。';
      if (style === 'shy') return '不……不客气……';
      return '不客气啦' + callMe + '~';
    }

    // 问身份
    if (msg.includes('你叫什么') || msg.includes('你是谁') || msg.includes('介绍一下')) {
      let intro = '我是' + character.name + '，';
      if (character.age) intro += '今年' + character.age + '岁，';
      if (character.occupation) intro += '是' + character.occupation + '，';
      if (character.hometown) intro += '来自' + character.hometown + '，';
      if (character.hobbies) intro += '喜欢' + character.hobbies + '，';
      if (character.mbtiZodiac) intro += character.mbtiZodiac + '，';
      intro += '很高兴认识你！';
      return intro;
    }

    // 问爱好
    if ((msg.includes('爱好') || msg.includes('喜欢做什么') || msg.includes('兴趣')) && character.hobbies) {
      if (style === 'lively') return '我超喜欢' + character.hobbies + '的！！你也感兴趣吗！！';
      if (style === 'cold') return '……就' + character.hobbies + '吧。';
      return '我平时喜欢' + character.hobbies + '~你呢？';
    }

    // 问职业
    if ((msg.includes('做什么工作') || msg.includes('职业') || msg.includes('上班') || msg.includes('上学')) && character.occupation) {
      const occ = character.occupation;
      if (occ.includes('学生')) return '我在上学呢~每天都好多课。';
      return '我是做' + occ + '的，你呢？';
    }

    // 问家乡
    if ((msg.includes('哪里人') || msg.includes('家乡') || msg.includes('在哪')) && character.hometown) {
      return '我是' + character.hometown + '的~你认识这里吗？';
    }

    // 随机选模板
    let reply = templates[Math.floor(Math.random() * templates.length)];

    // 偶尔在话里插入口头禅
    const extra = maybeAddCatchphrase();
    if (extra) reply = reply + ' ' + extra;

    return reply;
  }

  // 模拟打字延迟
  function getReplyDelay() {
    return 400 + Math.random() * 800;
  }

  // 判断角色是否应该主动开场
  function shouldStartConversation(character) {
    const p = (character.personality || '') + (character.speakingStyle || '') + (character.relationship || '');
    // 主动型：活泼/开朗/热情/恋人/暗恋/话多
    const outgoing = ['活泼', '开朗', '热情', '外向', '话多'];
    const intimate = ['恋人', '暗恋对象'];
    for (const kw of outgoing) { if (p.includes(kw)) return true; }
    for (const kw of intimate) { if (p.includes(kw)) return true; }
    // 被动型：高冷/害羞/内向/稳重/话少
    return false;
  }

  // 生成开场白
  function generateOpening(character) {
    const style = detectStyle(character.personality);
    const callMe = character.callMe || '';
    const openings = {
      gentle: ['你好呀~很高兴认识你！', '嗨，我是' + character.name + '，以后请多关照哦~', '终于等到你了！今天过得怎么样呢？'],
      lively: ['嘿！！终于见到你了！！好开心呀！！', '哇！你就是我一直想认识的人吗！！', '哈喽哈喽～我是' + character.name + '！'],
      cold: ['……你好。', '嗯，来了啊。'],
      mature: ['你好，我是' + character.name + '，很高兴认识你。', '终于见面了，以后可以多聊聊。'],
      funny: ['嘿嘿，终于逮到你了！准备好和我聊天了吗？', '哟！看来我们有缘分啊！'],
      shy: ['你…你好…我有点紧张…', '那个…很高兴认识你……']
    };
    const pool = openings[style] || openings.gentle;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // 主动消息生成（上下文感知）
  function generateProactiveReply(character, history, isWaitingForReply) {
    const style = detectStyle(character.personality);
    const lastMsg = history.length > 0 ? history[history.length - 1] : null;
    const name = character.name || '';

    // 没有历史对话 → 打个招呼
    if (!lastMsg) {
      return generateOpening(character);
    }

    // 用户没回复 AI 的上一条
    if (isWaitingForReply) {
      const nudges = {
        gentle: ['在忙吗？没关系的~', '你还好吗？有点想你了呢', '有空了记得回我哦~'],
        lively: ['诶！！你怎么不理我了！！', '人呢人呢？？快回来！！', '呜呜呜你跑哪去了！'],
        cold: ['…在？', '？', '算了。'],
        mature: ['还在忙吗？不急，有空再说。', '你先忙，我等你。'],
        funny: ['呼叫呼叫！收到请回答！', '失踪人口请回家！', '再不回我就要发搞笑图片了！'],
        shy: ['那个…你还在吗…', '是不是打扰到你了…'],
      };
      const pool = nudges[style] || ['在吗？'];
      return pool[Math.floor(Math.random() * pool.length)];
    }

    // 用户发了最后一条 → 角色回复（基于人设）
    return generateReply(character, lastMsg.content, history);
  }

  // 根据人设返回主动消息间隔（毫秒），unansweredCount 为连续未回复次数
  function getProactiveInterval(character, unansweredCount) {
    const p = (character.personality || '') + (character.speakingStyle || '') + (character.relationship || '');
    const outgoing = ['活泼','开朗','热情','话多','外向','恋人','暗恋'];
    const cold = ['高冷','傲娇','冷淡','冷漠','酷','毒舌','话少'];
    const gentle = ['温柔','体贴','善良','暖心'];
    const cnt = unansweredCount || 0;
    if (outgoing.some(k => p.includes(k))) {
      // 递增：越等越急，间隔越短
      const base = Math.max(30000, 120000 - cnt * 30000);
      return base + Math.random() * 60000;
    }
    if (cold.some(k => p.includes(k))) return 300000 + Math.random() * 300000;        // 5-10分钟
    if (gentle.some(k => p.includes(k))) return 120000 + Math.random() * 180000;      // 2-5分钟
    return 180000 + Math.random() * 240000; // 默认 3-7分钟
  }

  return { generateReply, getReplyDelay, detectStyle, shouldStartConversation, generateOpening, generateProactiveReply, getProactiveInterval };
})();
