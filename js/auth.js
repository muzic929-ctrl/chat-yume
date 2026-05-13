// ===== 用户认证模块（Firebase Auth） =====
const Auth = (() => {

  function isReady() {
    return !!(window._firebaseReady && window.FBAuth);
  }

  // 注册
  async function register(username, password) {
    if (!username || !password) return { ok: false, msg: '用户名和密码不能为空' };
    if (username.length < 2) return { ok: false, msg: '用户名至少2个字符' };
    if (password.length < 6) return { ok: false, msg: '密码至少6位' };
    if (!isReady()) return { ok: false, msg: '服务未就绪，请稍后重试' };

    const email = username + '@chat-yume.app';
    try {
      const result = await window.FBAuth.createUserWithEmailAndPassword(email, password);
      await result.user.updateProfile({ displayName: username });
      return { ok: true };
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') return { ok: false, msg: '用户名已存在' };
      return { ok: false, msg: '注册失败：' + e.message };
    }
  }

  // 登录
  async function login(username, password) {
    if (!username || !password) return { ok: false, msg: '请输入用户名和密码' };
    if (!isReady()) return { ok: false, msg: '服务未就绪，请稍后重试' };

    const email = username + '@chat-yume.app';
    try {
      await window.FBAuth.signInWithEmailAndPassword(email, password);
      return { ok: true };
    } catch (e) {
      if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') return { ok: false, msg: '用户名或密码错误' };
      if (e.code === 'auth/wrong-password') return { ok: false, msg: '密码错误' };
      return { ok: false, msg: '登录失败：' + e.message };
    }
  }

  // 退出
  async function logout() {
    if (isReady()) { try { await window.FBAuth.signOut(); } catch (e) {} }
  }

  function getCurrentUser() {
    if (!isReady()) return null;
    const user = window.FBAuth.currentUser;
    return user ? (user.displayName || (user.email ? user.email.split('@')[0] : null)) : null;
  }

  function isLoggedIn() {
    return isReady() && !!window.FBAuth.currentUser;
  }

  // 不等待 Firebase，立即执行回调
  function onAuthReady(callback) {
    if (!isReady()) {
      // Firebase 还没加载 → 先展示锁屏
      callback(false);
      // 等 Firebase 加载后再检查一次
      const check = setInterval(() => {
        if (isReady()) {
          clearInterval(check);
          callback(!!window.FBAuth.currentUser);
        }
      }, 500);
      // 10秒后放弃等待
      setTimeout(() => clearInterval(check), 10000);
      return;
    }
    const unsubscribe = window.FBAuth.onAuthStateChanged(user => {
      unsubscribe();
      callback(!!user);
    });
  }

  return { register, login, logout, getCurrentUser, isLoggedIn, onAuthReady };
})();
