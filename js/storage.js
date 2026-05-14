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
      return defaultValue;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(getKey(key), JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function remove(key) {
    try { localStorage.removeItem(getKey(key)); } catch (e) {}
  }

  function genId(prefix) {
    return (prefix||'') + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,8);
  }

  // 导出
  function exportAll() {
    const data = {};
    for (let i=0;i<localStorage.length;i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) data[k] = JSON.parse(localStorage.getItem(k));
    }
    return data;
  }

  // 导入
  function importAll(data) {
    for (const key in data) {
      if (key.startsWith(PREFIX)) localStorage.setItem(key, JSON.stringify(data[key]));
    }
  }

  // ===== 自动备份（5分钟/5个槽位） =====
  let backupTimer = null, backupIndex = 0;
  const MAX_BACKUPS = 5;

  function startAutoBackup() {
    if (backupTimer) return;
    doBackup();
    backupTimer = setInterval(doBackup, 300000);
  }

  function doBackup() {
    const spinner = document.getElementById('backup-spinner');
    if (spinner) spinner.style.display = 'inline-block';
    const data = {};
    for (let i=0;i<localStorage.length;i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX) && !k.includes('_backup_')) data[k] = localStorage.getItem(k);
    }
    const slot = PREFIX + '_backup_' + (backupIndex % MAX_BACKUPS);
    try { localStorage.setItem(slot, JSON.stringify({ time: Date.now(), data })); } catch(e){}
    backupIndex++;
    localStorage.setItem(PREFIX + '_backup_idx', String(backupIndex % MAX_BACKUPS));
    // 写入到选定的文件夹
    if (window._backupDirHandle) {
      try {
        const blob = new Blob([JSON.stringify({ time: Date.now(), data }, null, 2)], { type: 'application/json' });
        const fname = 'chat-backup-' + new Date().toISOString().slice(0,10) + '.json';
        window._backupDirHandle.requestPermission({ mode: 'readwrite' }).then(() => {
          window._backupDirHandle.getFileHandle(fname, { create: true }).then(fh => {
            fh.createWritable().then(w => { w.write(blob); w.close(); });
          }).catch(()=>{});
        }).catch(()=>{});
      } catch(e){}
    }
    setTimeout(function(){ if(spinner) spinner.style.display = 'none'; }, 800);
  }

  function checkAndRestore(restore) {
    if (restore === undefined) restore = true;
    var hasData = false;
    for (var i=0;i<localStorage.length;i++) {
      var k = localStorage.key(i);
      if (k && k.startsWith(PREFIX) && !k.includes('_backup_')) { hasData=true; break; }
    }
    if (hasData) return false;
    var best=null, bestTime=0;
    for (var j=0;j<MAX_BACKUPS;j++) {
      var raw = localStorage.getItem(PREFIX + '_backup_' + j);
      if (!raw) continue;
      try { var b=JSON.parse(raw); if(b.time>bestTime){bestTime=b.time;best=b;} } catch(e){}
    }
    if (!best) return false;
    if (!restore) return true; // 仅检测
    try { for(var key in best.data) localStorage.setItem(key, best.data[key]); return true; } catch(e){return false;}
  }

  return { get, set, remove, genId, exportAll, importAll, startAutoBackup, checkAndRestore };
})();
