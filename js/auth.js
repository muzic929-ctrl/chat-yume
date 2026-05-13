// ===== 用户认证模块 =====
const Auth = (() => {

  const USERS_KEY = 'users';
  const SESSION_KEY = 'session';

  // 简单哈希（SHA-256 不可用时用替代方案）
  async function hashPassword(password) {
    if (window.crypto && window.crypto.subtle) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'chat_salt_2026');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {
        // fallback
      }
    }
    // 简单回退哈希
    let hash = 0;
    const str = password + 'chat_salt_2026';
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return 'h_' + Math.abs(hash).toString(16);
  }

  async function register(username, password) {
    if (!username || !password) return { ok: false, msg: '用户名和密码不能为空' };
    if (username.length < 2) return { ok: false, msg: '用户名至少2个字符' };
    if (password.length < 3) return { ok: false, msg: '密码至少3位' };

    const users = Storage.get(USERS_KEY, []);
    if (users.find(u => u.username === username)) {
      return { ok: false, msg: '用户名已存在' };
    }

    const passwordHash = await hashPassword(password);
    users.push({
      username,
      passwordHash,
      createdAt: new Date().toISOString()
    });
    Storage.set(USERS_KEY, users);
    return { ok: true };
  }

  async function login(username, password) {
    if (!username || !password) return { ok: false, msg: '请输入用户名和密码' };

    const users = Storage.get(USERS_KEY, []);
    const user = users.find(u => u.username === username);
    if (!user) return { ok: false, msg: '用户不存在' };

    const passwordHash = await hashPassword(password);
    if (user.passwordHash !== passwordHash) return { ok: false, msg: '密码错误' };

    // 保存会话
    Storage.set(SESSION_KEY, { username, loginTime: new Date().toISOString() });
    return { ok: true };
  }

  function logout() {
    Storage.remove(SESSION_KEY);
  }

  function getCurrentUser() {
    const session = Storage.get(SESSION_KEY, null);
    return session ? session.username : null;
  }

  function isLoggedIn() {
    return getCurrentUser() !== null;
  }

  return { register, login, logout, getCurrentUser, isLoggedIn };
})();
