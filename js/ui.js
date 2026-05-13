// ===== UI 工具模块 =====
const UI = (() => {

  // Toast 提示
  let toastTimer = null;
  function showToast(msg, duration = 1500) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.className = 'toast';
    el.textContent = msg;
    el.style.display = 'block';
    // 强制重启动画
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = '';
    clearTimeout(toastTimer);
    if (duration > 0) {
      toastTimer = setTimeout(() => { el.style.display = 'none'; }, duration);
    }
  }

  // 确认弹窗
  function confirm(msg) {
    return new Promise((resolve) => {
      const result = window.confirm(msg);
      resolve(result);
    });
  }

  // 显示底部菜单弹窗
  function showModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.style.display = 'flex';
    // 强制重启动画
    const sheet = document.getElementById('modal-sheet');
    sheet.style.animation = 'none';
    sheet.offsetHeight;
    sheet.style.animation = '';
    return new Promise((resolve) => {
      const handler = (action) => {
        overlay.style.display = 'none';
        cleanup();
        resolve(action);
      };
      const cleanup = () => {
        document.getElementById('menu-edit-notes').onclick = null;
        document.getElementById('menu-bg-color').onclick = null;
        document.getElementById('menu-bg-upload').onclick = null;
        document.getElementById('menu-summarize').onclick = null;
        document.getElementById('menu-clear-chat').onclick = null;
        document.getElementById('modal-cancel').onclick = null;
        document.getElementById('modal-overlay').onclick = null;
      };
      document.getElementById('menu-edit-notes').onclick = () => handler('edit-notes');
      document.getElementById('menu-bg-color').onclick = () => handler('bg-color');
      document.getElementById('menu-bg-upload').onclick = () => handler('bg-upload');
      document.getElementById('menu-summarize').onclick = () => handler('summarize');
      document.getElementById('menu-clear-chat').onclick = () => handler('clear-chat');
      document.getElementById('modal-cancel').onclick = () => handler('cancel');
      document.getElementById('modal-overlay').onclick = (e) => {
        if (e.target === overlay) handler('cancel');
      };
    });
  }

  // 输入提示弹窗（用于修改备注等）
  function prompt(title, defaultValue = '') {
    return new Promise((resolve) => {
      const value = window.prompt(title, defaultValue);
      resolve(value);
    });
  }

  // 顶部消息通知
  let notifyTimer = null;
  let notifyCallback = null;
  function showNotification(avatar, name, text, onClick) {
    const el = document.getElementById('notify-banner');
    if (!el) return;
    document.getElementById('notify-avatar').src = avatar;
    document.getElementById('notify-name').textContent = name;
    document.getElementById('notify-text').textContent = text;
    el.style.display = 'flex';
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = '';
    clearTimeout(notifyTimer);
    notifyCallback = onClick;
    el.onclick = () => {
      el.style.display = 'none';
      clearTimeout(notifyTimer);
      if (notifyCallback) notifyCallback();
    };
    notifyTimer = setTimeout(() => { el.style.display = 'none'; }, 4000);
  }
  function hideNotification() {
    const el = document.getElementById('notify-banner');
    if (el) { el.style.display = 'none'; clearTimeout(notifyTimer); }
  }

  // 显示/隐藏 loading（带旋转器）
  function showLoading(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.className = 'toast loading';
    el.innerHTML = '<div class="toast-spinner"></div>' + (msg || '加载中...');
    el.style.display = 'block';
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = '';
    clearTimeout(toastTimer);
  }
  function hideLoading() {
    const el = document.getElementById('toast');
    if (el) {
      el.style.display = 'none';
      el.className = 'toast';
      el.textContent = '';
    }
    clearTimeout(toastTimer);
  }

  return { showToast, confirm, showModal, prompt, showLoading, hideLoading, showNotification, hideNotification };
})();
