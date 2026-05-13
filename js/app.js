// ===== 应用主控模块 =====
const App = (() => {

  let editingCharacterId = null;
  let currentAvatar = 'preset_1';
  let particlesAnimId = null;
  let lockY = 0, lockStartY = 0, lockDragging = false;

  // ===== 锁屏滑动解锁 =====
  function initLockScreen() {
    const ls = document.getElementById('lock-screen');
    const loginPage = document.getElementById('page-login');
    if (!ls) return;

    function startDrag() {
      lockDragging = true; lockY = 0;
      ls.style.transition = 'none';
      if (loginPage) loginPage.style.display = 'flex';
    }
    function doDrag(clientY) {
      if (!lockDragging) return;
      lockY = clientY - lockStartY;
      if (lockY < -300) lockY = -300;
      if (lockY > 0) lockY = 0;
      ls.style.transform = 'translateY(' + lockY + 'px)';
    }
    function endDrag() {
      if (!lockDragging) return;
      lockDragging = false;
      ls.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease';
      if (lockY < -80) {
        ls.style.transform = 'translateY(-100%)';
        ls.classList.add('unlocked');
        setTimeout(() => triggerLoginAnimations(), 300);
      } else {
        ls.style.transform = 'translateY(0)';
        ls.classList.remove('unlocked');
        if (loginPage) loginPage.style.display = 'none';
      }
      lockY = 0;
    }

    ls.addEventListener('touchstart', (e) => { lockStartY = e.touches[0].clientY; startDrag(); }, { passive: true });
    ls.addEventListener('touchmove', (e) => { doDrag(e.touches[0].clientY); }, { passive: true });
    ls.addEventListener('touchend', endDrag);
    ls.addEventListener('mousedown', (e) => { lockStartY = e.clientY; startDrag(); });
    window.addEventListener('mousemove', (e) => { doDrag(e.clientY); });
    window.addEventListener('mouseup', endDrag);
  }

  function resetLockScreen() {
    const ls = document.getElementById('lock-screen');
    if (!ls) return;
    ls.classList.remove('unlocked');
    ls.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease';
    ls.style.transform = 'translateY(0)';
  }

  // ===== 壁纸管理 =====
  function initWallpaper() {
    const saved = Storage.get('wallpaper', '');
    if (saved) applyWallpaper(saved);
    const btnUp = document.getElementById('btn-wallpaper-upload');
    const btnRst = document.getElementById('btn-wallpaper-reset');
    const input = document.getElementById('input-wallpaper');
    if (btnUp) btnUp.addEventListener('click', () => input && input.click());
    if (input) input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        applyWallpaper(ev.target.result);
        Storage.set('wallpaper', ev.target.result);
        UI.showToast('壁纸已更新');
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    });
    if (btnRst) btnRst.addEventListener('click', () => {
      Storage.remove('wallpaper');
      document.getElementById('wallpaper-bg').style.display = 'none';
      document.getElementById('wallpaper-bg').style.backgroundImage = '';
      UI.showToast('已恢复默认');
    });
  }

  function applyWallpaper(base64) {
    const bg = document.getElementById('wallpaper-bg');
    bg.style.backgroundImage = 'url(' + base64 + ')';
    bg.style.display = 'block';
  }

  // ===== 登录/注册页 =====
  function initLoginPage() {
    // 登录
    document.getElementById('btn-login').addEventListener('click', async () => {
      if (!Auth.isReady()) { UI.showToast('正在连接服务，请稍后...'); return; }
      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;
      if (!username || !password) { UI.showToast('请填写用户名和密码'); return; }
      const result = await Auth.login(username, password);
      if (result.ok) { stopParticles(); enterApp(); }
      else UI.showToast(result.msg);
    });

    // 注册
    document.getElementById('btn-register').addEventListener('click', async () => {
      if (!Auth.isReady()) { UI.showToast('正在连接服务，请稍后...'); return; }
      const username = document.getElementById('reg-username').value.trim();
      const password = document.getElementById('reg-password').value;
      const password2 = document.getElementById('reg-password2').value;
      if (!username || !password || !password2) { UI.showToast('请填写所有字段'); return; }
      if (password.length < 6) { UI.showToast('密码至少需要6位'); return; }
      if (password !== password2) { UI.showToast('两次密码不一致'); return; }
      const result = await Auth.register(username, password);
      if (result.ok) { UI.showToast('注册成功，请登录'); showLoginForm(); }
      else UI.showToast(result.msg);
    });

    // 切换表单
    document.getElementById('btn-show-register').addEventListener('click', showRegisterForm);
    document.getElementById('btn-show-login').addEventListener('click', showLoginForm);

    // 等待 Firebase 就绪，更新提示文字
    const descEl = document.getElementById('login-desc-anim');
    if (!Auth.isReady()) {
      if (descEl) descEl.textContent = '正在连接服务...';
      const check = setInterval(() => {
        if (Auth.isReady()) {
          clearInterval(check);
          if (descEl) descEl.textContent = '创建你的 AI 角色，开始聊天吧';
        }
      }, 500);
      setTimeout(() => {
        clearInterval(check);
        if (descEl && !Auth.isReady()) descEl.textContent = '网络较慢，请稍后再试';
      }, 8000);
    }
  }

  function showRegisterForm() {
    document.getElementById('login-form-anim').style.display = 'none';
    document.getElementById('register-form-anim').style.display = 'block';
    document.getElementById('register-form-anim').classList.add('text-anim');
    document.getElementById('login-desc-anim').textContent = '注册账号，开启你的梦世界之旅';
  }

  function showLoginForm() {
    document.getElementById('register-form-anim').style.display = 'none';
    document.getElementById('login-form-anim').style.display = 'block';
    document.getElementById('login-desc-anim').textContent = '创建你的 AI 角色，开始聊天吧';
    document.getElementById('reg-username').value = '';
    document.getElementById('reg-password').value = '';
    document.getElementById('reg-password2').value = '';
  }

  function triggerLoginAnimations() {
    setTimeout(() => { const el = document.getElementById('login-logo-anim'); if (el) el.classList.add('logo-anim'); }, 100);
    setTimeout(() => { const el = document.getElementById('login-desc-anim'); if (el) { el.classList.add('text-anim'); el.style.animationDelay = '0.15s'; } }, 350);
    setTimeout(() => { const el = document.getElementById('login-form-anim'); if (el) { el.classList.add('text-anim'); el.style.animationDelay = '0.3s'; } }, 500);
  }

  function enterApp() {
    document.getElementById('page-login').style.display = 'none';
    document.getElementById('lock-screen').style.display = 'none';
    document.getElementById('app-shell').style.display = 'flex';
    updateStatusClock();
    renderCharList();
    Chat.startProactive();
  }

  function logoutApp() {
    Chat.stopProactive();
    document.getElementById('app-shell').style.display = 'none';
    document.getElementById('page-login').style.display = 'none';
    document.getElementById('lock-screen').style.display = 'block';
    closeAllSubPages();
    resetLockScreen();
    startParticles();
    updateClock();
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
  }

  let chatListTab = 'chats'; // chats | friends

  // ===== 桌面 App 打开/关闭 =====
  function initHomeScreen() {
    // 桌面图标点击
    document.querySelectorAll('.app-icon-wrapper[data-app]').forEach(icon => {
      icon.addEventListener('click', () => {
        const app = icon.dataset.app;
        openApp(app);
      });
    });

    // 聊天页 Dock 切换
    document.querySelectorAll('.chat-dock-item').forEach(item => {
      item.addEventListener('click', () => {
        chatListTab = item.dataset.tab;
        document.querySelectorAll('.chat-dock-item').forEach(d => d.classList.toggle('active', d.dataset.tab === chatListTab));
        document.getElementById('chatlist-title').textContent = chatListTab === 'chats' ? '聊天' : '添加好友';
        renderCharList();
      });
    });

    // 聊天列表返回
    document.getElementById('btn-chatlist-back').addEventListener('click', () => closeApp('page-chat-list'));
    // 设置返回
    document.getElementById('btn-settings-back').addEventListener('click', () => closeApp('page-settings'));
    // 表单返回
    document.getElementById('btn-form-back').addEventListener('click', () => closeApp('page-form'));
    // 聊天返回
    document.getElementById('btn-chat-back').addEventListener('click', () => {
      document.getElementById('page-chat').style.display = 'none';
      Chat.reset();
      renderCharList();
    });
  }

  function openApp(app) {
    closeAllSubPages();
    switch (app) {
      case 'chat':
        document.getElementById('page-chat-list').style.display = 'flex';
        chatListTab = 'chats';
        document.querySelectorAll('.chat-dock-item').forEach(d => d.classList.toggle('active', d.dataset.tab === 'chats'));
        document.getElementById('chatlist-title').textContent = '聊天';
        renderCharList();
        break;
      case 'create':
        editingCharacterId = null;
        resetForm();
        document.getElementById('form-title').textContent = '角色卡';
        document.getElementById('btn-delete-char').style.display = 'none';
        document.getElementById('page-form').style.display = 'flex';
        break;
      case 'settings':
        loadSettings();
        document.getElementById('page-settings').style.display = 'flex';
        break;
    }
  }

  function closeApp(pageId) {
    document.getElementById(pageId).style.display = 'none';
    if (pageId === 'page-form' || pageId === 'page-chat-list') renderCharList();
  }

  function closeAllSubPages() {
    ['page-chat-list', 'page-form', 'page-chat', 'page-settings'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }

  // ===== 状态栏时钟 =====
  function updateStatusClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const days = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
    const el = document.getElementById('status-time');
    if (el) el.textContent = h + ':' + m;
    const wel = document.getElementById('widget-time');
    if (wel) wel.textContent = h + ':' + m;
    const wd = document.getElementById('widget-date');
    if (wd) wd.textContent = (now.getMonth()+1)+'月'+now.getDate()+'日 '+days[now.getDay()];
  }

  // ===== 粒子 =====
  function startParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h;
    function resize() {
      const app = document.getElementById('app');
      w = canvas.width = app ? app.offsetWidth : window.innerWidth;
      h = canvas.height = app ? app.offsetHeight : window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
    const particles = [];
    for (let i = 0; i < 40; i++) {
      particles.push({ x: Math.random()*w, y: Math.random()*h, r: Math.random()*2.5+1, vx: (Math.random()-0.5)*0.3, vy: (Math.random()-0.5)*0.3-0.2, opacity: Math.random()*0.5+0.2 });
    }
    function draw() {
      const bg = document.getElementById('wallpaper-bg');
      if (bg && bg.style.display === 'block') { ctx.clearRect(0,0,w,h); particlesAnimId = requestAnimationFrame(draw); return; }
      ctx.clearRect(0,0,w,h);
      const grad = ctx.createLinearGradient(0,0,w,h);
      grad.addColorStop(0,'#1a1a3e'); grad.addColorStop(0.5,'#1e1e40'); grad.addColorStop(1,'#0f0f2a');
      ctx.fillStyle = grad; ctx.fillRect(0,0,w,h);
      particles.forEach(p => {
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0)p.x=w; if(p.x>w)p.x=0; if(p.y<0)p.y=h; if(p.y>h)p.y=0;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle='rgba(255,255,255,'+p.opacity+')'; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r*3,0,Math.PI*2);
        ctx.fillStyle='rgba(255,255,255,'+(p.opacity*0.15)+')'; ctx.fill();
      });
      particlesAnimId=requestAnimationFrame(draw);
    }
    draw();
  }

  function stopParticles() { if(particlesAnimId){cancelAnimationFrame(particlesAnimId); particlesAnimId=null;} }

  // ===== 锁屏时钟 =====
  function updateClock() {
    const now = new Date();
    const timeEl = document.getElementById('lockscreen-time');
    if (timeEl) timeEl.textContent = String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
    const days = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
    const dateEl = document.getElementById('lockscreen-date');
    if (dateEl) dateEl.textContent = (now.getMonth()+1)+'月'+now.getDate()+'日 '+days[now.getDay()];
  }

  // ===== 角色列表 =====
  function renderCharList() {
    const username = Auth.getCurrentUser();
    if (!username) return;
    const allChars = Characters.getAll(username);
    const acceptedChars = allChars.filter(c => c.status === 'accepted');
    const newChars = allChars.filter(c => c.status === 'new');

    // 更新桌面红点
    updateBadges(newChars.length);

    const charContainer = document.getElementById('char-list');
    const charEmpty = document.getElementById('empty-state');
    const friendContainer = document.getElementById('friend-list');
    const friendEmpty = document.getElementById('friend-empty');

    // 聊天 tab
    if (chatListTab === 'chats') {
      if (friendContainer) friendContainer.style.display = 'none';
      if (friendEmpty) friendEmpty.style.display = 'none';
      if (charContainer) charContainer.style.display = 'block';
      if (acceptedChars.length === 0) {
        if (charContainer) charContainer.innerHTML = '';
        if (charEmpty) charEmpty.style.display = 'block';
      } else {
        if (charEmpty) charEmpty.style.display = 'none';
        let html = '';
        acceptedChars.forEach(char => {
          const messages = Characters.getMessages(char.id);
          const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
          const lastMsgText = lastMsg ? (lastMsg.type === 'sent' ? '你：' : '') + lastMsg.content : '点击开始聊天';
          // 未读数
          const unreadCount = messages.filter(m => m.type === 'received' && m.timestamp > (char.lastReadTime || '')).length;
          html += '<div class="char-card" data-id="'+char.id+'">';
          html += '<img class="char-card-avatar" src="'+getAvatarSrc(char.avatar)+'" alt="" onerror="this.src=\x27img/default-avatar.svg\x27">';
          if (unreadCount > 0) html += '<span class="unread-badge">'+(unreadCount > 99 ? '99+' : unreadCount)+'</span>';
          html += '<div class="char-card-info">';
          html += '<div class="char-card-name">'+esc(char.notes||char.name)+'</div>';
          html += '<div class="char-card-desc">'+esc(lastMsgText)+'</div>';
          html += '</div></div>';
        });
        if (charContainer) charContainer.innerHTML = html;
      }
    } else {
      // 添加好友 tab
      if (charContainer) charContainer.style.display = 'none';
      if (charEmpty) charEmpty.style.display = 'none';
      if (friendContainer) friendContainer.style.display = 'block';
      if (newChars.length === 0) {
        if (friendContainer) friendContainer.innerHTML = '';
        if (friendEmpty) friendEmpty.style.display = 'block';
      } else {
        if (friendEmpty) friendEmpty.style.display = 'none';
        let html = '';
        newChars.forEach(char => {
          html += '<div class="char-card" data-fid="'+char.id+'">';
          html += '<img class="char-card-avatar" src="'+getAvatarSrc(char.avatar)+'" alt="" onerror="this.src=\x27img/default-avatar.svg\x27">';
          html += '<div class="char-card-info">';
          html += '<div class="char-card-name">'+esc(char.notes||char.name)+'</div>';
          html += '<div class="char-card-desc">'+esc(char.personality||'')+'</div>';
          html += '</div>';
          html += '<button class="friend-action" data-accept="'+char.id+'">添加</button>';
          html += '</div>';
        });
        if (friendContainer) friendContainer.innerHTML = html;
        // 绑定添加按钮
        friendContainer.querySelectorAll('.friend-action').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const charId = btn.dataset.accept;
            const char = Characters.getById(username, charId);
            Characters.acceptFriend(username, charId);
            // 根据角色人设决定是否主动开场
            if (char && AI.shouldStartConversation(char)) {
              const settings = Storage.get('settings_' + username, { aiMode: 'simulate' });
              let opening;
              if (settings.aiMode === 'real' && settings.apiKey) {
                // 真 AI 开场白
                try {
                  opening = await AIAPI.sendMessage(settings, char,
                    '（这是我们的第一次对话，请根据你的人设主动和我打招呼，说一句开场白）', []);
                } catch (e) {
                  // 真AI失败时回退到模拟开场白
                  opening = AI.generateOpening(char);
                }
              } else {
                opening = AI.generateOpening(char);
              }
              Characters.addMessage(charId, { content: opening, type: 'received' });
              UI.showToast('已添加好友，TA 发来了消息');
            } else {
              UI.showToast('已添加好友');
            }
            renderCharList();
          });
        });
      }
    }
  }

  function updateBadges(newFriendCount) {
    // 计算未读消息数
    const username = Auth.getCurrentUser();
    let unreadCount = 0;
    if (username) {
      const accepted = Characters.getAll(username).filter(c => c.status === 'accepted');
      accepted.forEach(char => {
        const msgs = Characters.getMessages(char.id);
        const unread = msgs.filter(m => m.type === 'received' && m.timestamp > (char.lastReadTime || '')).length;
        unreadCount += unread;
      });
    }

    // App 桌面图标：综合（未读消息 + 新好友）
    const total = unreadCount + newFriendCount;
    const appBadge = document.getElementById('app-badge');
    if (appBadge) {
      if (total > 0) { appBadge.style.display = 'flex'; appBadge.textContent = total > 99 ? '99+' : total; }
      else appBadge.style.display = 'none';
    }

    // Dock 聊天标签：显示总未读消息数
    const chatBadge = document.getElementById('chat-badge');
    if (chatBadge) {
      if (unreadCount > 0) { chatBadge.style.display = 'flex'; chatBadge.textContent = unreadCount > 99 ? '99+' : unreadCount; }
      else chatBadge.style.display = 'none';
    }
    // Dock 添加好友标签：只显示新好友数
    const dockBadge = document.getElementById('dock-badge');
    if (dockBadge) {
      if (newFriendCount > 0) { dockBadge.style.display = 'flex'; dockBadge.textContent = newFriendCount > 99 ? '99+' : newFriendCount; }
      else dockBadge.style.display = 'none';
    }
  }

  function getAvatarSrc(avatar) {
    if(!avatar) return 'img/default-avatar.svg';
    if(avatar.startsWith('data:')) return avatar;
    if(avatar.startsWith('preset_')) return 'img/preset/'+avatar.replace('preset_','')+'.svg';
    return 'img/default-avatar.svg';
  }
  function esc(t) { const d=document.createElement('div'); d.textContent=t||''; return d.innerHTML; }

  // ===== 角色表单 =====
  function initFormPage() {
    document.getElementById('avatar-preview').addEventListener('click', () => document.getElementById('input-avatar').click());
    document.getElementById('btn-upload-avatar').addEventListener('click', () => document.getElementById('input-avatar').click());
    document.getElementById('input-avatar').addEventListener('change', (e) => {
      const file = e.target.files[0]; if(!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const size = Math.min(img.width,img.height);
          const canvas = document.createElement('canvas'); canvas.width=200; canvas.height=200;
          canvas.getContext('2d').drawImage(img,(img.width-size)/2,(img.height-size)/2,size,size,0,0,200,200);
          setAvatarPreview(canvas.toDataURL('image/jpeg',0.8));
          document.querySelectorAll('.preset-avatar').forEach(el=>el.classList.remove('selected'));
        };
        img.src=ev.target.result;
      };
      reader.readAsDataURL(file);
    });
    document.getElementById('btn-save-char').addEventListener('click', saveCharacter);
    document.getElementById('btn-delete-char').addEventListener('click', async () => {
      if(await UI.confirm('确定删除该角色？')) { Characters.remove(Auth.getCurrentUser(),editingCharacterId); UI.showToast('已删除'); closeApp('page-form'); }
    });
    document.getElementById('preset-avatars').addEventListener('click', (e) => {
      const preset = e.target.closest('.preset-avatar'); if(!preset) return;
      document.querySelectorAll('.preset-avatar').forEach(el=>el.classList.remove('selected'));
      preset.classList.add('selected'); currentAvatar=preset.dataset.avatar;
      document.getElementById('avatar-preview').classList.add('has-img');
      document.getElementById('avatar-img').src=preset.src;
    });
  }

  function resetForm() {
    ['form-name','form-gender','form-age','form-height','form-weight','form-personality','form-notes','form-bio','form-occupation','form-hometown','form-hobbies','form-catchphrase','form-callme','form-mbti-zodiac'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    ['form-relationship','form-chat-goal','form-speaking-style','form-routine'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    document.getElementById('avatar-preview').classList.remove('has-img');
    document.getElementById('avatar-img').src=''; currentAvatar='preset_1';
    document.querySelectorAll('.preset-avatar').forEach(el=>el.classList.remove('selected'));
    const first=document.querySelector('.preset-avatar');
    if(first){first.classList.add('selected');document.getElementById('avatar-img').src=first.src;document.getElementById('avatar-preview').classList.add('has-img');}
  }

  function saveCharacter() {
    const username=Auth.getCurrentUser();
    const gv=id=>(document.getElementById(id)||{}).value||'';
    const name=gv('form-name').trim(), gender=gv('form-gender'), age=gv('form-age'), height=gv('form-height'), weight=gv('form-weight'), personality=gv('form-personality').trim();
    if(!name||!gender||!age||!height||!weight||!personality){UI.showToast('请填写所有必填字段');return;}
    const data={name,gender,age,height,weight,personality,notes:gv('form-notes').trim(),avatar:currentAvatar,bio:gv('form-bio').trim(),occupation:gv('form-occupation').trim(),hometown:gv('form-hometown').trim(),hobbies:gv('form-hobbies').trim(),catchphrase:gv('form-catchphrase').trim(),relationship:gv('form-relationship'),callMe:gv('form-callme').trim(),chatGoal:gv('form-chat-goal'),speakingStyle:gv('form-speaking-style'),routine:gv('form-routine'),mbtiZodiac:gv('form-mbti-zodiac').trim()};
    if(editingCharacterId){Characters.update(username,editingCharacterId,data);UI.showToast('角色已更新');}
    else{Characters.create(username,data);UI.showToast('角色创建成功');}
    closeApp('page-form');
  }

  // ===== 聊天页 =====
  function initChatPage() {
    document.getElementById('char-list').addEventListener('click', (e) => {
      const card = e.target.closest('.char-card'); if(!card) return;
      goToChat(card.dataset.id);
    });
    document.getElementById('btn-send').addEventListener('click', () => Chat.sendMessage(document.getElementById('chat-input').value));
    document.getElementById('chat-input').addEventListener('keydown', (e) => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();Chat.sendMessage(document.getElementById('chat-input').value);} });
    document.getElementById('btn-chat-menu').addEventListener('click', async () => { await handleChatMenu(await UI.showModal()); });
    // 点击聊天头像修改头像
    document.getElementById('chat-avatar').addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*';
      input.onchange = (ev) => {
        const file = ev.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (re) => {
          const img = new Image();
          img.onload = () => {
            const size = Math.min(img.width, img.height);
            const canvas = document.createElement('canvas'); canvas.width = 200; canvas.height = 200;
            canvas.getContext('2d').drawImage(img, (img.width-size)/2, (img.height-size)/2, size, size, 0, 0, 200, 200);
            const base64 = canvas.toDataURL('image/jpeg', 0.8);
            const charId = Chat.getCurrentCharacterId();
            Characters.update(Auth.getCurrentUser(), charId, { avatar: base64 });
            Chat.setAvatar('chat-avatar', base64);
            UI.showToast('头像已更新');
          };
          img.src = re.target.result;
        };
        reader.readAsDataURL(file);
      };
      input.click();
    });
    document.getElementById('input-bg').addEventListener('change', (e) => {
      const file=e.target.files[0]; if(!file)return;
      const reader=new FileReader();
      reader.onload=(ev)=>{
        const img=new Image();
        img.onload=()=>{
          let w=img.width,h=img.height; if(w>800){h=h*800/w;w=800;}
          const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
          canvas.getContext('2d').drawImage(img,0,0,w,h);
          const base64=canvas.toDataURL('image/jpeg',0.7);
          const char=Characters.getById(Auth.getCurrentUser(),Chat.getCurrentCharacterId());
          if(!char)return;
          Characters.update(Auth.getCurrentUser(),char.id,{bgType:'image',bgValue:base64});
          document.getElementById('page-chat').style.backgroundImage='url('+base64+')';
          document.getElementById('page-chat').style.backgroundSize='cover';
          document.getElementById('page-chat').style.backgroundPosition='center';
          UI.showToast('背景图已更新');
        }; img.src=ev.target.result;
      }; reader.readAsDataURL(file); e.target.value='';
    });
  }

  async function handleChatMenu(action) {
    const username=Auth.getCurrentUser(), charId=Chat.getCurrentCharacterId();
    if(action==='edit-notes'){
      const char=Characters.getById(username,charId); if(!char)return;
      const newNotes=await UI.prompt('修改备注',char.notes||char.name);
      if(newNotes!==null&&newNotes.trim()){Characters.update(username,char.id,{notes:newNotes.trim()});Chat.updateChatHeader();UI.showToast('备注已更新');}
    }else if(action==='bg-color'){
      const colors=['#f5f5f5','#e8f4fd','#fdf5e6','#f0fff0','#fff0f5','#f5f0ff','#f0f5ff','#faf0e6','#ffffff'];
      const char=Characters.getById(username,charId); if(!char)return;
      const c=colors[Math.floor(Math.random()*colors.length)];
      Characters.update(username,char.id,{bgType:'color',bgValue:c});
      document.getElementById('page-chat').style.backgroundImage='none';
      document.getElementById('page-chat').style.backgroundColor=c; UI.showToast('背景色已更换');
    }else if(action==='bg-upload'){document.getElementById('input-bg').click();}
    else if(action==='clear-chat'){if(await UI.confirm('确定清空聊天记录？')){Chat.clearChat();UI.showToast('已清空');}}
    else if(action==='summarize'){
      UI.showToast('正在总结记忆...', 3000);
      await Chat.summarizeMemory(username, charId);
      UI.showToast('记忆已更新');
    }
  }

  function goToChat(charId) {
    const char=Characters.getById(Auth.getCurrentUser(),charId); if(!char)return;
    Characters.markRead(Auth.getCurrentUser(), charId);
    Chat.init(Auth.getCurrentUser(),charId);
    const cp=document.getElementById('page-chat');
    if(char.bgType==='image'&&char.bgValue){cp.style.backgroundImage='url('+char.bgValue+')';cp.style.backgroundSize='cover';cp.style.backgroundPosition='center';}
    else{cp.style.backgroundImage='none';cp.style.backgroundColor=char.bgValue||'#f5f5f5';}
    document.getElementById('page-chat').style.display='flex';
  }

  // ===== 设置页 =====
  function initSettingsPage() {
    document.getElementById('btn-logout').addEventListener('click', async () => {
      if(await UI.confirm('确定退出登录？')){Auth.logout();logoutApp();}
    });
    document.getElementById('toggle-ai-mode').addEventListener('change', function(){
      document.getElementById('real-ai-settings').style.display=this.checked?'block':'none';
      document.getElementById('ai-mode-hint').textContent=this.checked?'当前：真 AI 模式（需配置 API Key）':'当前：使用免费模拟 AI，无需任何配置';
      saveSettings();
    });
    document.getElementById('settings-provider').addEventListener('change', function(){
      const g=document.getElementById('apiurl-group'), m=document.getElementById('settings-model');
      if(this.value==='custom'){g.style.display='block';document.getElementById('settings-apiurl').value='';}
      else{g.style.display='none';document.getElementById('settings-apiurl').value=AIAPI.DEFAULT_URLS[this.value]||'';m.value=AIAPI.DEFAULT_MODELS[this.value]||'';}
      const h=document.getElementById('gemini-hint'); if(h)h.style.display=this.value==='gemini'?'block':'none';
      saveSettings();
    });
    ['settings-apikey','settings-apiurl','settings-model'].forEach(id=>{document.getElementById(id).addEventListener('change',saveSettings);document.getElementById(id).addEventListener('blur',saveSettings);});
    document.getElementById('btn-test-api').addEventListener('click', async () => {
      const s=getSettings(); if(!s.apiKey){UI.showToast('请填入API Key');return;}
      UI.showToast('测试中...',2000);
      try{await AIAPI.testConnection(s);UI.showToast('连接成功！');}catch(e){UI.showToast('失败：'+e.message,2500);}
    });
  }

  function getSettings(){
    const p=document.getElementById('settings-provider').value;
    return {aiMode:document.getElementById('toggle-ai-mode').checked?'real':'simulate',provider:p,apiKey:document.getElementById('settings-apikey').value.trim(),apiUrl:document.getElementById('settings-apiurl').value.trim()||AIAPI.DEFAULT_URLS[p],model:document.getElementById('settings-model').value.trim()||AIAPI.DEFAULT_MODELS[p]};
  }
  function saveSettings(){const u=Auth.getCurrentUser();if(u)Storage.set('settings_'+u,getSettings());}
  function loadSettings(){
    const u=Auth.getCurrentUser();if(!u)return;
    const s=Storage.get('settings_'+u,{aiMode:'simulate'});
    document.getElementById('toggle-ai-mode').checked=s.aiMode==='real';
    document.getElementById('settings-provider').value=s.provider||'openai';
    document.getElementById('settings-apikey').value=s.apiKey||'';
    document.getElementById('settings-apiurl').value=s.apiUrl||'';
    document.getElementById('settings-model').value=s.model||'';
    document.getElementById('real-ai-settings').style.display=s.aiMode==='real'?'block':'none';
    document.getElementById('ai-mode-hint').textContent=s.aiMode==='real'?'当前：真 AI 模式（需配置 API Key）':'当前：使用免费模拟 AI，无需任何配置';
    if(s.provider==='custom')document.getElementById('apiurl-group').style.display='block';
    const h=document.getElementById('gemini-hint');if(h)h.style.display=s.provider==='gemini'?'block':'none';
  }

  function setAvatarPreview(src){document.getElementById('avatar-preview').classList.add('has-img');document.getElementById('avatar-img').src=src;currentAvatar=src;}

  function generatePresetAvatars(){
    const c=document.getElementById('preset-avatars');if(!c)return;
    let h='';for(let i=1;i<=8;i++)h+='<img class="preset-avatar'+(i===1?' selected':'')+'" data-avatar="preset_'+i+'" src="img/preset/'+i+'.svg" alt="">';
    c.innerHTML=h;
    const f=c.querySelector('.preset-avatar');
    if(f){document.getElementById('avatar-img').src='img/preset/1.svg';document.getElementById('avatar-preview').classList.add('has-img');}
  }

  // ===== 初始化 =====
  function init(){
    generatePresetAvatars();
    initLockScreen();
    initWallpaper();
    initLoginPage();
    initHomeScreen();
    initFormPage();
    initChatPage();
    initSettingsPage();
    updateClock();
    setInterval(updateClock,10000);
    startParticles();

    // 等待 Firebase Auth 就绪（跨设备登录核心）
    Auth.onAuthReady((loggedIn) => {
      if(loggedIn){
        stopParticles();
        document.getElementById('page-login').style.display='none';
        document.getElementById('lock-screen').style.display='none';
        document.getElementById('app-shell').style.display='flex';
        updateStatusClock();
        setInterval(updateStatusClock,30000);
        renderCharList();
        Chat.startProactive();
      }else{
        document.getElementById('page-login').style.display='none';
        document.getElementById('lock-screen').style.display='block';
        document.getElementById('app-shell').style.display='none';
      }
    });
  }

  return { init, renderCharList, goToChat };
})();
document.addEventListener('DOMContentLoaded',()=>{App.init();});
