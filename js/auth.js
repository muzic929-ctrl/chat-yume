// ===== 用户认证模块（Firebase Auth） =====
const Auth = (() => {

  // 注册
  async function register(username, password) {
    if (!username || !password) return { ok: false, msg: '用户名和密码不能为空' };
    if (username.length < 2) return { ok: false, msg: '用户名至少2个字符' };
    if (password.length < 3) return { ok: false, msg: '密码至少3位' };

    // Firebase Auth 用邮箱格式，我们拼接一个虚拟邮箱
    const email = username + '@chat-yume.app';
    try {
      const result = await FBAuth.createUserWithEmailAndPassword(email, password);
      // 更新显示名
      await result.user.updateProfile({ displayName: username });
      return { ok: true };
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') return { ok: false, msg: '用户名已存在' };
      if (e.code === 'auth/weak-password') return { ok: false, msg: '密码太短，至少6位' };
      return { ok: false, msg: '注册失败：' + e.message };
    }
  }

  // 登录
  async function login(username, password) {
    if (!username || !password) return { ok: false, msg: '请输入用户名和密码' };
    const email = username + '@chat-yume.app';
    try {
      await FBAuth.signInWithEmailAndPassword(email, password);
      return { ok: true };
    } catch (e) {
      if (e.code === 'auth/user-not-found') return { ok: false, msg: '用户不存在' };
      if (e.code === 'auth/wrong-password') return { ok: false, msg: '密码错误' };
      if (e.code === 'auth/invalid-credential') return { ok: false, msg: '用户名或密码错误' };
      return { ok: false, msg: '登录失败：' + e.message };
    }
  }

  // 退出
  async function logout() {
    try { await FBAuth.signOut(); } catch (e) {}
  }

  // 获取当前用户标识（用于 localStorge key）
  function getCurrentUser() {
    const user = FBAuth.currentUser;
    return user ? user.displayName || user.email.split('@')[0] : null;
  }

  function getCurrentUid() {
    const user = FBAuth.currentUser;
    return user ? user.uid : null;
  }

  function isLoggedIn() {
    return FBAuth.currentUser !== null;
  }

  // 等待认证状态恢复
  function onAuthReady(callback) {
    const unsubscribe = FBAuth.onAuthStateChanged(user => {
      unsubscribe();
      callback(!!user);
    });
  }

  return { register, login, logout, getCurrentUser, getCurrentUid, isLoggedIn, onAuthReady };
})();
