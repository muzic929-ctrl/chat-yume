// ===== Firebase 配置 =====
const firebaseConfig = {
  apiKey: "AIzaSyCUTmsWYk0SjnoLwEGFaQtGBRx7nDxwe1w",
  authDomain: "chat-yume.firebaseapp.com",
  projectId: "chat-yume",
  storageBucket: "chat-yume.firebasestorage.app",
  messagingSenderId: "133573451290",
  appId: "1:133573451290:web:466edb635af72e7d447ba3"
};
firebase.initializeApp(firebaseConfig);
const FBAuth = firebase.auth();
FBAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
