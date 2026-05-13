// ===== 本地用户标识（无需登录） =====
const Auth = (() => {

  function getDeviceId() {
    let id = localStorage.getItem('_device_id');
    if (!id) {
      id = 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('_device_id', id);
    }
    return id;
  }

  function getCurrentUser() {
    return getDeviceId();
  }

  return { getCurrentUser };
})();
