// ===== Firebase 动态加载 =====
window._firebaseReady = false;

(function loadFirebase() {
  const appScript = document.createElement('script');
  appScript.src = 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js';
  appScript.onload = () => {
    const authScript = document.createElement('script');
    authScript.src = 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js';
    authScript.onload = () => {
      try {
        firebase.initializeApp({
          apiKey: "AIzaSyCUTmsWYk0SjnoLwEGFaQtGBRx7nDxwe1w",
          authDomain: "chat-yume.firebaseapp.com",
          projectId: "chat-yume",
          storageBucket: "chat-yume.firebasestorage.app",
          messagingSenderId: "133573451290",
          appId: "1:133573451290:web:466edb635af72e7d447ba3"
        });
        window.FBAuth = firebase.auth();
        window.FBAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        window._firebaseReady = true;
      } catch (e) {
        console.warn('Firebase init failed:', e);
      }
    };
    document.head.appendChild(authScript);
  };
  // 超时：5秒后放弃等待
  setTimeout(() => { if (!window._firebaseReady) console.warn('Firebase load timeout'); }, 5000);
  document.head.appendChild(appScript);
})();
