// ===== 本地存储模块 =====
const Storage = (() => {

  const PREFIX = 'chat_';

  function getKey(key) {
    return PREFIX + key;
  }

  function get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(getKey(key));
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch (e) {
      console.error('Storage get error:', e);
      return defaultValue;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(getKey(key), JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage set error:', e);
      return false;
    }
  }

  function remove(key) {
    try {
      localStorage.removeItem(getKey(key));
    } catch (e) {
      console.error('Storage remove error:', e);
    }
  }

  // 生成唯一 ID
  function genId(prefix = '') {
    return prefix + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  // 导出所有数据
  function exportAll(deviceId) {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX)) {
        data[key] = JSON.parse(localStorage.getItem(key));
      }
    }
    return data;
  }

  // 导入数据（覆盖）
  function importAll(deviceId, data) {
    for (const key in data) {
      if (key.startsWith(PREFIX)) {
        localStorage.setItem(key, JSON.stringify(data[key]));
      }
    }
  }

  return { get, set, remove, genId, exportAll, importAll };
})();
