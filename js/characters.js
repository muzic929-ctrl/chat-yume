// ===== 角色管理模块 =====
const Characters = (() => {

  function getStorageKey(username) {
    return 'characters_' + username;
  }

  // 获取当前用户所有角色
  function getAll(username) {
    return Storage.get(getStorageKey(username), []);
  }

  // 获取单个角色
  function getById(username, characterId) {
    const chars = getAll(username);
    return chars.find(c => c.id === characterId) || null;
  }

  // 创建角色
  function create(username, data) {
    const chars = getAll(username);
    const character = {
      id: Storage.genId('c_'),
      name: data.name || '',
      gender: data.gender || '',
      age: parseInt(data.age) || 0,
      height: parseInt(data.height) || 0,
      weight: parseInt(data.weight) || 0,
      personality: data.personality || '',
      notes: data.notes || '',
      avatar: data.avatar || 'preset_1',
      // 选填字段
      bio: data.bio || '',
      occupation: data.occupation || '',
      hometown: data.hometown || '',
      hobbies: data.hobbies || '',
      catchphrase: data.catchphrase || '',
      relationship: data.relationship || '',
      callMe: data.callMe || '',
      chatGoal: data.chatGoal || '',
      speakingStyle: data.speakingStyle || '',
      routine: data.routine || '',
      mbtiZodiac: data.mbtiZodiac || '',
      status: 'new', // new=待添加好友, accepted=已添加
      lastReadTime: new Date().toISOString(),
      bgType: 'color',
      bgValue: '#f5f5f5',
      createdAt: new Date().toISOString()
    };
    chars.push(character);
    Storage.set(getStorageKey(username), chars);
    return character;
  }

  // 更新角色
  function update(username, characterId, data) {
    const chars = getAll(username);
    const index = chars.findIndex(c => c.id === characterId);
    if (index === -1) return null;

    const allowed = ['name', 'gender', 'age', 'height', 'weight', 'personality', 'notes', 'avatar', 'status', 'lastReadTime', 'bgType', 'bgValue', 'bio', 'occupation', 'hometown', 'hobbies', 'catchphrase', 'relationship', 'callMe', 'chatGoal', 'speakingStyle', 'routine', 'mbtiZodiac', 'memory'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        chars[index][key] = data[key];
      }
    }
    Storage.set(getStorageKey(username), chars);
    return chars[index];
  }

  // 删除角色（同时删除聊天记录）
  function remove(username, characterId) {
    const chars = getAll(username);
    const filtered = chars.filter(c => c.id !== characterId);
    Storage.set(getStorageKey(username), filtered);
    // 删除关联聊天记录
    Storage.remove('messages_' + characterId);
  }

  // 获取角色的聊天记录
  function getMessages(characterId) {
    return Storage.get('messages_' + characterId, []);
  }

  // 保存角色的聊天记录
  function saveMessages(characterId, messages) {
    Storage.set('messages_' + characterId, messages);
  }

  // 添加一条消息
  function addMessage(characterId, message) {
    const messages = getMessages(characterId);
    messages.push({
      id: Storage.genId('m_'),
      characterId,
      content: message.content,
      type: message.type,
      timestamp: new Date().toISOString()
    });
    saveMessages(characterId, messages);
    return messages;
  }

  function acceptFriend(username, characterId) {
    return update(username, characterId, { status: 'accepted' });
  }

  function getNewCount(username) {
    return getAll(username).filter(c => c.status === 'new').length;
  }

  function markRead(username, characterId) {
    return update(username, characterId, { lastReadTime: new Date().toISOString() });
  }

  return { getAll, getById, create, update, remove, getMessages, saveMessages, addMessage, acceptFriend, getNewCount, markRead };
})();
