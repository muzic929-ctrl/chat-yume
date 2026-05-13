// ===== 聊天模块 =====
const Chat = (() => {

  let currentCharacterId = null;
  let currentUsername = null;

  function init(username, characterId) {
    currentUsername = username;
    currentCharacterId = characterId;
    renderMessages();
    updateChatHeader();
    document.getElementById('chat-input').value = '';
  }

  function updateChatHeader() {
    const char = Characters.getById(currentUsername, currentCharacterId);
    if (!char) return;
    document.getElementById('chat-name').textContent = char.notes || char.name;
    setAvatar('chat-avatar', char.avatar);
  }

  function setAvatar(imgId, avatar) {
    const img = document.getElementById(imgId);
    if (!img) return;
    if (avatar && avatar.startsWith('data:')) {
      img.src = avatar;
    } else if (avatar && avatar.startsWith('preset_')) {
      const num = avatar.replace('preset_', '');
      img.src = 'img/preset/' + num + '.svg';
    } else {
      img.src = 'img/default-avatar.svg';
    }
  }

  function renderMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    const messages = Characters.getMessages(currentCharacterId);

    let html = '';
    let lastDate = '';
    let lastTime = 0;
    const GAP = 5 * 60 * 1000; // 5分钟间隔

    messages.forEach((msg, i) => {
      const date = new Date(msg.timestamp);
      const msgTime = date.getTime();
      const dateStr = formatDate(date);
      const timeStr = formatTime(date);

      // 日期变化
      if (dateStr !== lastDate) {
        html += '<div class="message-time">' + dateStr + '</div>';
        lastDate = dateStr;
        lastTime = 0; // 新日期重置
      }

      // 间隔过长显示时间
      if (i === 0 || msgTime - lastTime > GAP) {
        html += '<div class="message-time">' + timeStr + '</div>';
      }

      lastTime = msgTime;

      const rowClass = msg.type === 'sent' ? 'sent' : 'received';
      html += '<div class="message-row ' + rowClass + '">';
      html += '<div class="message-bubble">' + escapeHtml(msg.content) + '</div>';
      html += '</div>';
    });

    container.innerHTML = html;
    scrollToBottom();

    // 聊天页开着 = 已读，退出后不显示未读
    if (isChatPageVisible() && currentUsername && currentCharacterId) {
      Characters.markRead(currentUsername, currentCharacterId);
    }
  }

  function formatDate(date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diff = (today - msgDay) / 86400000;

    if (diff === 0) return '今天';
    if (diff === 1) return '昨天';
    if (diff === 2) return '前天';
    return (date.getMonth() + 1) + '/' + date.getDate();
  }

  function formatTime(date) {
    return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
  }

  function scrollToBottom() {
    const container = document.getElementById('chat-messages');
    if (container) {
      setTimeout(() => { container.scrollTop = container.scrollHeight; }, 50);
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async function sendMessage(text) {
    if (!text.trim()) return;

    const username = currentUsername || Auth.getCurrentUser();
    if (!username || !currentCharacterId) return;

    // 保存用户消息
    Characters.addMessage(currentCharacterId, { content: text.trim(), type: 'sent' });
    document.getElementById('chat-input').value = '';
    renderMessages();

    // 获取角色和应用设置
    const character = Characters.getById(username, currentCharacterId);
    if (!character) return;

    const settings = Storage.get('settings_' + username, { aiMode: 'simulate' });

    if (settings.aiMode === 'real' && settings.apiKey) {
      // 真 AI 模式
      try {
        showTyping();
        const history = Characters.getMessages(currentCharacterId);
        const reply = await AIAPI.sendMessage(settings, character, text.trim(), history.slice(0, -1));
        hideTyping();
        Characters.addMessage(currentCharacterId, { content: reply, type: 'received' });
        renderMessages();
        maybeNotify(character, reply);
        checkAutoSummary();
      } catch (e) {
        hideTyping();
        UI.showToast('AI 回复失败：' + e.message, 2000);
        const fallback = AI.generateReply(character, text.trim(), []);
        Characters.addMessage(currentCharacterId, { content: fallback, type: 'received' });
        renderMessages();
        maybeNotify(character, fallback);
        checkAutoSummary();
      }
    } else {
      const history = Characters.getMessages(currentCharacterId);
      const delay = AI.getReplyDelay();
      showTyping();
      await sleep(delay);
      const reply = AI.generateReply(character, text.trim(), history);
      hideTyping();
      Characters.addMessage(currentCharacterId, { content: reply, type: 'received' });
      renderMessages();
      maybeNotify(character, reply);
	    checkAutoSummary();
	  }
  }

  function showTyping() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    const typingHtml = '<div class="message-row received" id="typing-indicator"><div class="message-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div></div>';
    container.insertAdjacentHTML('beforeend', typingHtml);
    scrollToBottom();
  }

  function hideTyping() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function clearChat() {
    Characters.saveMessages(currentCharacterId, []);
    renderMessages();
  }

  function reset() {
    currentCharacterId = null;
    currentUsername = null;
  }

  function getCurrentCharacterId() {
    return currentCharacterId;
  }

  function isChatPageVisible() {
    const cp = document.getElementById('page-chat');
    return cp && cp.style.display === 'flex';
  }

  function getAvatarSrc(avatar) {
    if (!avatar) return 'img/default-avatar.svg';
    if (avatar.startsWith('data:')) return avatar;
    if (avatar.startsWith('preset_')) return 'img/preset/' + avatar.replace('preset_', '') + '.svg';
    return 'img/default-avatar.svg';
  }

  function maybeNotify(character, reply) {
    if (isChatPageVisible() && getCurrentCharacterId() === character.id) return;
    UI.showNotification(
      getAvatarSrc(character.avatar),
      character.notes || character.name,
      reply,
      () => {
        // 点击后跳转到聊天
        if (typeof App !== 'undefined' && App.goToChat) {
          App.goToChat(character.id);
        }
      }
    );
  }

  // ===== 角色主动发消息（人格感知间隔） =====
  let proactiveTimers = {};

  function startProactive() {
    scheduleAllProactive();
  }

  function stopProactive() {
    Object.values(proactiveTimers).forEach(t => clearTimeout(t));
    proactiveTimers = {};
  }

  function scheduleAllProactive() {
    stopProactive();
    const username = currentUsername || (typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null);
    if (!username) return;
    const chars = typeof Characters !== 'undefined' ? Characters.getAll(username).filter(c => c.status === 'accepted') : [];
    if (chars.length === 0) return;
    chars.forEach(char => {
      scheduleCharProactive(char);
    });
  }

  function scheduleCharProactive(char, unansweredCount) {
    if (proactiveTimers[char.id]) clearTimeout(proactiveTimers[char.id]);
    let interval;
    if (typeof AI !== 'undefined' && AI.getProactiveInterval) {
      interval = AI.getProactiveInterval(char, unansweredCount || 0);
    } else {
      interval = 120000 + Math.random() * 180000;
    }
    proactiveTimers[char.id] = setTimeout(() => {
      tickProactiveForChar(char);
    }, interval);
  }

  async function tickProactiveForChar(char) {
    const username = currentUsername || (typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null);
    if (!username) { scheduleCharProactive(char); return; }
    // 重新检查角色是否还存在且已接受
    const freshChar = typeof Characters !== 'undefined' ? Characters.getById(username, char.id) : null;
    if (!freshChar || freshChar.status !== 'accepted') { delete proactiveTimers[char.id]; return; }
    // 如果正在和这个角色聊天，跳过并重新调度
    if (isChatPageVisible() && getCurrentCharacterId() === freshChar.id) {
      scheduleCharProactive(freshChar);
      return;
    }

    const history = typeof Characters !== 'undefined' ? Characters.getMessages(freshChar.id) : [];
    const lastMsg = history.length > 0 ? history[history.length - 1] : null;
    const isWaitingForReply = lastMsg && lastMsg.type === 'received';

    // 计算连续未被回复的消息数
    let unansweredCount = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].type === 'received') unansweredCount++;
      else break;
    }

    const p = (freshChar.personality || '') + (freshChar.speakingStyle || '') + (freshChar.relationship || '');
    const outgoing = ['活泼','开朗','热情','话多','外向','恋人','暗恋'];
    const cold = ['高冷','傲娇','冷淡','冷漠','酷','毒舌','话少','害羞','内向','安静'];
    const gentle = ['温柔','体贴','善良','暖心'];

    // 人格化停止策略
    let shouldStop = false;
    if (cold.some(k => p.includes(k)) && unansweredCount >= 2) shouldStop = true;   // 高冷型：2次不回复就停止
    if (gentle.some(k => p.includes(k)) && unansweredCount >= 4) shouldStop = true;  // 温柔型：4次不回复后停止
    // 活泼型：不停止，持续递增

    if (shouldStop) {
      delete proactiveTimers[freshChar.id];
      return; // 不再发消息，等用户回来
    }

    let instruction;
    if (!lastMsg) {
      instruction = '这是你第一次主动和我说话，请根据你的人设简短地打个招呼。';
    } else if (isWaitingForReply) {
      if (outgoing.some(k => p.includes(k))) {
        // 递增：次数越多越急切
        const urges = ['可以撒娇、催促、发个表情，或者表达想我了。简短自然，1句话。',
                       '我已经发了'+(unansweredCount+1)+'条消息了还没收到回复，可以更撒娇/更着急一点，表达想念。',
                       '我等了好久了！可以生气、撒娇、委屈，情感更强烈。1-2句话。'];
        instruction = urges[Math.min(unansweredCount, urges.length - 1)];
      } else if (gentle.some(k => p.includes(k))) {
        // 情绪递进：关心→担心→失落→最后温柔
        const phases = ['可以关心地问一句是不是在忙，或者轻轻提醒。1句话。',
                         '可以表达一点担心，语气依然温柔。1句话。',
                         '可以表达一点失落，但说会等你。1句话。',
                         '最后一条温柔的消息了，可以说等你回来，或者发个晚安。1句话。'];
        instruction = phases[Math.min(unansweredCount, phases.length - 1)];
      } else {
        instruction = '我给你发了消息你还没回。根据我的性格自然地提一下，不要开新话题。1句话。';
      }
    } else {
      instruction = '你刚才回了我消息，现在可以根据你的人设接着说点什么。不要开新话题。1句话。';
    }

    const settings = typeof Storage !== 'undefined'
      ? Storage.get('settings_' + username, { aiMode: 'simulate' })
      : { aiMode: 'simulate' };
    let reply;

    if (settings.aiMode === 'real' && settings.apiKey && typeof AIAPI !== 'undefined') {
      try {
        reply = await AIAPI.sendMessage(settings, freshChar, instruction, history.slice(-10));
      } catch (e) {
        if (typeof AI !== 'undefined') reply = AI.generateProactiveReply(freshChar, history, isWaitingForReply);
      }
    } else if (typeof AI !== 'undefined') {
      reply = AI.generateProactiveReply(freshChar, history, isWaitingForReply);
    } else {
      reply = '在吗？';
    }

    if (typeof Characters !== 'undefined') {
      Characters.addMessage(freshChar.id, { content: reply, type: 'received' });
    }
    if (typeof UI !== 'undefined') {
      UI.showNotification(
        getAvatarSrc(freshChar.avatar), freshChar.notes || freshChar.name, reply,
        () => { if (typeof App !== 'undefined' && App.goToChat) App.goToChat(freshChar.id); }
      );
    }
    if (typeof App !== 'undefined' && App.renderCharList) {
      App.renderCharList();
    }
    // 重新调度下一次（递增模式：间隔随未回复次数缩短）
    const nextUnanswered = isWaitingForReply ? unansweredCount + 1 : 0;
    scheduleCharProactive(freshChar, nextUnanswered);
  }

  // ===== 记忆总结 =====
  async function summarizeMemory(username, charId) {
    const char = typeof Characters !== 'undefined' ? Characters.getById(username, charId) : null;
    if (!char) return;
    const messages = typeof Characters !== 'undefined' ? Characters.getMessages(charId) : [];
    if (messages.length < 10) { UI.showToast('消息太少，多聊一会儿再总结吧'); return; }

    // 取最近的聊天样本
    const recent = messages.slice(-40);
    const dialogue = recent.map(m => (m.type === 'sent' ? '对方' : char.name) + '：' + m.content).join('\n');

    const settings = typeof Storage !== 'undefined'
      ? Storage.get('settings_' + username, { aiMode: 'simulate' })
      : { aiMode: 'simulate' };

    let summary;
    if (settings.aiMode === 'real' && settings.apiKey && typeof AIAPI !== 'undefined') {
      try {
        const summarizationPrompt = '请根据以下对话总结记忆。只记录与角色人设相关的关键信息：对方对你的称呼、你们的关系进展、对方的喜好/习惯、重要事件。用2-3句中文简短总结，像日记一样。不要重复角色已有的基础信息。';
        summary = await AIAPI.sendMessage(settings, char,
          summarizationPrompt + '\n\n对话记录：\n' + dialogue, []);
      } catch (e) {
        summary = buildLocalSummary(char, messages);
      }
    } else {
      summary = buildLocalSummary(char, messages);
    }

    if (summary && typeof Characters !== 'undefined') {
      // 累积记忆：旧记忆 + 新总结
      const oldMemory = char.memory || '';
      const newMemory = oldMemory
        ? oldMemory + '\n---\n' + summary
        : summary;
      Characters.update(username, charId, { memory: newMemory });
    }
  }

  // 本地简单总结
  function buildLocalSummary(char, messages) {
    const total = messages.length;
    const lastFew = messages.slice(-5);
    const topics = lastFew.map(m => m.content.slice(0, 15)).join('、');
    return '我们聊了' + total + '条消息，最近在聊关于' + topics + '的话题。';
  }

  // 自动检查是否需要总结（30条→20条间隔）
  function checkAutoSummary() {
    if (!currentUsername || !currentCharacterId) return;
    const messages = typeof Characters !== 'undefined' ? Characters.getMessages(currentCharacterId) : [];
    const count = messages.length;
    const char = typeof Characters !== 'undefined' ? Characters.getById(currentUsername, currentCharacterId) : null;
    const hasMemory = char && char.memory;
    // 首次30条触发，之后每20条
    const threshold = hasMemory ? 20 : 30;
    if (count > 0 && count % threshold === 0) {
      setTimeout(() => summarizeMemory(currentUsername, currentCharacterId), 1000);
    }
  }

  return { init, sendMessage, clearChat, renderMessages, updateChatHeader, setAvatar, reset, getCurrentCharacterId, startProactive, stopProactive, summarizeMemory };
})();
