/* Авторизация PhysLab. Гейт только на лабораториях, остальные страницы открыты.
   Есть серверный вход (Flask) и локальный (localStorage), если сервер недоступен. */

let ME = null;
let API_ONLINE = null;   // null = ещё не проверяли
let GOOGLE_READY = false;
let GSI_READY = false;
let GSI_RENDERED = false;
const GOOGLE_CLIENT_ID = (window.PHYSLAB_CONFIG && window.PHYSLAB_CONFIG.GOOGLE_CLIENT_ID) || '';
let authMode = 'register';
window.__authed = false;

async function api(path, opts) {
  try {
    const r = await fetch(path, Object.assign({
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' }
    }, opts || {}));
    let data = null;
    try { data = await r.json(); } catch (e) {
      markOffline();
      return null;
    }
    API_ONLINE = true;
    return { status: r.status, ok: r.ok, data: data };
  } catch (e) {
    markOffline();
    return null;
  }
}

/* Баннер «нет связи с сервером»: работаем в локальном режиме */
function markOffline() {
  if (API_ONLINE === false) return;
  API_ONLINE = false;
  if (document.getElementById('connWarn')) return;
  const b = document.createElement('div');
  b.id = 'connWarn';
  b.innerHTML = 'Сервер недоступен — избранное и прогресс сохраняются локально. Работает вход через Google. <button id="connWarnX" aria-label="Закрыть">✕</button>';
  document.body.appendChild(b);
  b.querySelector('#connWarnX').onclick = () => b.remove();
}

/* Валидация на клиенте (зеркалит серверную) */
const SQLI_RE = /(\bunion\b|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bcreate\b|\balter\b|\bexec\b|--|\/\*|\*\/|;|'|"|`|<|>|\\|\bor\b\s+['"\d]|\band\b\s+['"\d]|\d\s*=\s*\d|\bsleep\b|\bbenchmark\b)/i;
function looksDangerous(s) { return SQLI_RE.test(String(s)); }
const LOGIN_RE = /^[A-Za-z0-9_]{3,24}$/;
const NAME_RE = /^[A-Za-zА-Яа-яЁё \-]{2,24}$/;

/* Если сервер недоступен — локальный режим (localStorage).
   Пароли хешируются SHA-256 с уникальной солью на пользователя. */
function localDB() { try { return JSON.parse(localStorage.getItem('physlab_db') || '{}'); } catch (e) { return {}; } }
function setLocalDB(d) { localStorage.setItem('physlab_db', JSON.stringify(d)); }
function randSalt() { const a = new Uint8Array(16); crypto.getRandomValues(a); return Array.from(a, b => b.toString(16).padStart(2, '0')).join(''); }
async function hashPass(p, salt) {
  const data = new TextEncoder().encode(salt + ':' + p);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
}

/* Модалка входа/регистрации */
function paintAuth() {
  const reg = authMode === 'register';
  $('authTitle').textContent = reg ? 'Регистрация' : 'Вход';
  $('authSub').textContent = reg ? 'Создай аккаунт, чтобы открывать лаборатории.' : 'Войди в свой аккаунт.';
  $('nameField').style.display = reg ? '' : 'none';
  $('authSubmit').textContent = reg ? 'Создать аккаунт' : 'Войти';
  $('authSwitchText').textContent = reg ? 'Уже есть аккаунт?' : 'Ещё нет аккаунта?';
  $('authSwitch').textContent = reg ? 'Войти' : 'Создать';
  $('authErr').textContent = '';
}
function openAuth(mode) {
  authMode = mode || 'register';
  paintAuth();
  $('authModal').classList.add('open');
  const first = authMode === 'register' ? $('fName') : $('fLogin');
  first && first.focus();
  setTimeout(initGoogle, 30);
}
function closeAuth() { $('authModal').classList.remove('open'); $('authErr').textContent = ''; }

$('authSwitch').onclick = () => { authMode = authMode === 'register' ? 'login' : 'register'; paintAuth(); $('fLogin').focus(); };

$('authForm').onsubmit = async (e) => {
  e.preventDefault();
  const err = $('authErr');
  const login = $('fLogin').value.trim();
  const name = $('fName').value.trim();
  const pass = $('fPass').value;

  if ([login, name, pass].some(looksDangerous)) { err.textContent = '⛔ Ввод содержит запрещённые символы (защита от инъекций).'; return; }
  if (!LOGIN_RE.test(login)) { err.textContent = 'Логин: 3–24 символа, только латиница, цифры и _'; return; }
  if (pass.length < 8) { err.textContent = 'Пароль: минимум 8 символов'; return; }
  if (authMode === 'register' && !NAME_RE.test(name)) { err.textContent = 'Имя: 2–24 символа (буквы, пробел, дефис)'; return; }

  const path = authMode === 'register' ? '/api/register' : '/api/login';
  const body = authMode === 'register' ? { login, name, password: pass } : { login, password: pass };
  const r = await api(path, { method: 'POST', body: JSON.stringify(body) });

  if (r === null) { return localAuth(login, name, pass, err); }   // сервер недоступен
  if (!r.data || !r.data.ok) { err.textContent = (r.data && r.data.error) || 'Не удалось выполнить вход'; return; }

  ME = r.data.user;
  window.__authed = true;
  await afterLogin('Добро пожаловать, ' + ME.name + '!');
};

async function localAuth(login, name, pass, err) {
  const db = localDB();
  if (authMode === 'register') {
    if (db[login]) { err.textContent = 'Такой логин уже занят'; return; }
    const salt = randSalt();
    db[login] = { name: name, salt: salt, pass: await hashPass(pass, salt) };
    setLocalDB(db);
    ME = { login: login, name: name };
  } else {
    const u = db[login];
    if (!u || !u.salt || await hashPass(pass, u.salt) !== u.pass) { err.textContent = 'Неверный логин или пароль'; return; }
    ME = { login: login, name: u.name };
  }
  localStorage.setItem('physlab_user', JSON.stringify(ME));
  window.__authed = true;
  afterLogin('Вход выполнен (локальный режим)');
}

async function afterLogin(msg) {
  closeAuth();
  applyAuth();
  await Promise.all([loadFavs(), loadProgress()]);
  toast(msg);
  beep(720); setTimeout(() => beep(1080), 120);
}

/* Google OAuth 2.0, работает без сервера */
function googleLogin() {
  if (!GOOGLE_CLIENT_ID) { toast('Google-вход не настроен'); return; }
  if (!GSI_READY) { toast('Google ещё загружается'); return; }
  initGoogle();
}

function decodeJwt(token) {
  const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(
    atob(b64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
  );
  return JSON.parse(json);
}

async function onGoogleCredential(resp) {
  try {
    const server = await api('/api/google', {
      method: 'POST',
      body: JSON.stringify({ credential: resp.credential })
    });
    if (server && server.data && server.data.ok && server.data.user) {
      ME = server.data.user;
      window.__authed = true;
      localStorage.setItem('physlab_user', JSON.stringify(ME));
      await afterLogin('Добро пожаловать, ' + ME.name + '!');
      return;
    }
    if (server) {
      toast((server.data && server.data.error) || 'Не удалось подтвердить вход через Google');
      return;
    }
    toast('Сервер авторизации недоступен. Попробуй позже.');
  } catch (e) {
    toast('Не удалось выполнить вход через Google');
  }
}

function initGoogle() {
  if (!GOOGLE_CLIENT_ID || !(window.google && google.accounts && google.accounts.id)) return;
  if (GSI_RENDERED) return;
  google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: onGoogleCredential });
  const box = $('gsiButton');
  if (!box) return;
  google.accounts.id.renderButton(box, {
    theme: 'filled_black', size: 'large', shape: 'pill',
    text: 'continue_with', logo_alignment: 'left', width: 300
  });
  GSI_RENDERED = true;
  GSI_READY = true;
  GOOGLE_READY = true;
  box.style.display = '';
  const b = $('googleBtn'); if (b) b.style.display = 'none';
}

/* Ждём загрузку скрипта Google */
function waitForGoogle(tries) {
  if (GSI_RENDERED) return;
  if (window.google && google.accounts && google.accounts.id) { initGoogle(); return; }
  if (tries > 40) return;   // 40 * 200мс = 8с
  setTimeout(() => waitForGoogle(tries + 1), 200);
}

function applyAuth() {
  const pb = $('profileBtn'), pn = $('profileName');
  if (ME) { pb.classList.add('on'); pn.textContent = ME.name; }
  else { pb.classList.remove('on'); pn.textContent = 'Войти'; }
}
function openProfile() {
  if (!ME) { openAuth('login'); return; }
  $('profName').textContent = ME.name;
  $('profLogin').textContent = '@' + ME.login;
  $('profAva').textContent = ME.name.slice(0, 1).toUpperCase();
  const done = doneSet().size, fav = favSet().size, tot = (typeof ALL_IDS !== 'undefined' ? ALL_IDS.length : 27);
  $('profDone').textContent = done;
  $('profFav').textContent = fav;
  $('profBar').style.width = Math.min(100, done / tot * 100) + '%';
  $('eName').value = ME.name;
  $('eCur').value = '';
  $('eNew').value = '';
  $('editErr').textContent = '';
  $('saveBtn').disabled = false;
  $('profileModal').classList.add('open');
}
function closeProfile() { $('profileModal').classList.remove('open'); }

$('profileBtn').onclick = () => { ME ? openProfile() : openAuth('login'); };
$('logoutBtn').onclick = async () => {
  try { await api('/api/logout', { method: 'POST' }); } catch(e) {}
  localStorage.removeItem('physlab_user');
  ME = null; window.__authed = false;
  closeProfile(); applyAuth();
  toast('Вы вышли из аккаунта');
  go('home');
};
$('saveBtn') && ($('saveBtn').onclick = async () => {
  const err = $('editErr'), btn = $('saveBtn');
  const name = $('eName').value.trim();
  const cur = $('eCur').value, np = $('eNew').value;
  err.textContent = '';
  if (name.length < 2) { err.textContent = 'Введите имя (минимум 2 символа)'; return; }
  if (np && np.length < 8) { err.textContent = 'Новый пароль: минимум 8 символов'; return; }
  btn.disabled = true;
  const res = await api('/api/profile', {
    method: 'POST',
    body: JSON.stringify({ name, current_password: cur, new_password: np })
  });
  btn.disabled = false;
  if (res && res.status === 200 && res.data && res.data.ok) {
    ME = res.data.user;
    localStorage.setItem('physlab_user', JSON.stringify(res.data.user));
    $('eCur').value = ''; $('eNew').value = '';
    openProfile();
    toast('Изменения сохранены ✓');
  } else {
    err.textContent = (res && res.data && res.data.error) || 'Не удалось сохранить изменения';
  }
});
$('expBtn') && ($('expBtn').onclick = () => {
  const data = { app: 'PhysLab', v: 1, exported: new Date().toISOString(), fav: [...favSet()], done: [...doneSet()], user: ME || null };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = 'physlab-backup.json'; a.click();
  toast('Резервная копия скачана ✓');
});
$('impBtn') && ($('impBtn').onclick = () => $('impFile').click());
$('impFile') && ($('impFile').onchange = (e) => {
  const f = e.target.files[0]; if (!f) return;
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const d = JSON.parse(rd.result);
      if (Array.isArray(d.fav)) localStorage.setItem('physlab_fav', JSON.stringify(d.fav));
      if (Array.isArray(d.done)) localStorage.setItem('physlab_done', JSON.stringify(d.done));
      if (d.user) localStorage.setItem('physlab_user', JSON.stringify(d.user));
      toast('Данные загружены ✓');
      setTimeout(() => location.reload(), 600);
    } catch (err) { toast('Не удалось прочитать файл'); }
  };
  rd.readAsText(f);
  e.target.value = '';
});

/* Синхронизация избранного и прогресса */
function doneSet() { return new Set(JSON.parse(localStorage.getItem('physlab_done') || '[]')); }

async function pushFav(id, on) {
  if (!window.__authed || API_ONLINE === false) return;
  await api('/api/favorites', { method: 'POST', body: JSON.stringify({ lab_id: id, on: on }) });
}
async function loadFavs() {
  const r = await api('/api/favorites');
  if (!r || !r.data || !r.data.ok) return;
  const server = r.data.favorites || [];
  const merged = new Set([...favSet(), ...server]);
  localStorage.setItem('physlab_fav', JSON.stringify([...merged]));
  for (const id of merged) if (!server.includes(id)) await pushFav(id, true);
  paintFav(); applyFilters();
}
async function clearFavsServer() {
  if (!window.__authed || API_ONLINE === false) return;
  const r = await api('/api/favorites');
  if (r && r.data && r.data.ok) for (const id of (r.data.favorites || [])) await pushFav(id, false);
}

async function markProgress(id) {
  const s = doneSet(); if (!s.has(id)) { s.add(id); localStorage.setItem('physlab_done', JSON.stringify([...s])); }
  if (!window.__authed || API_ONLINE === false) return;
  await api('/api/progress', { method: 'POST', body: JSON.stringify({ lab_id: id }) });
}
async function loadProgress() {
  const r = await api('/api/progress');
  if (!r || !r.data || !r.data.ok) return;
  const merged = new Set([...doneSet(), ...(r.data.progress || [])]);
  localStorage.setItem('physlab_done', JSON.stringify([...merged]));
}

/* Старт */
async function boot() {
  try { ME = JSON.parse(localStorage.getItem('physlab_user') || 'null'); } catch (e) { ME = null; }

  const me = await api('/api/me', { method: 'GET' });
  if (me && me.data && me.data.user) { ME = me.data.user; }
  else if (me && me.data && me.data.ok === false) { ME = null; localStorage.removeItem('physlab_user'); }

  window.__authed = !!ME;
  applyAuth();

  if (API_ONLINE !== false && ME) await Promise.all([loadFavs(), loadProgress()]);

  if (!GOOGLE_CLIENT_ID) { const b = $('googleBtn'); if (b) b.style.display = 'none'; }
  else waitForGoogle(0);

  const p = new URLSearchParams(location.search);
  const msgs = {
    notconfigured: 'вход не настроен', denied: 'вход отменён', token: 'ошибка авторизации',
    state: 'ошибка безопасности (state)', profile: 'не удалось получить профиль'
  };
  const g = p.get('google');
  if (g) {
    toast('Google: ' + (msgs[g] || 'ошибка входа'));
    history.replaceState(null, '', location.pathname + location.hash);
  }

  const h = location.hash.slice(1);
  if (['proj', 'pend', 'ohm', 'lab'].includes(h) || h.startsWith('lab-')) {
    if (window.__authed) {
      if (h === 'proj' || h === 'pend' || h === 'ohm') go(h);
      else if (h.startsWith('lab-') && typeof openLabById === 'function') openLabById(h.slice(4));
    } else {
      go('home'); openAuth('login');
    }
  }
}

boot();
