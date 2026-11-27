const SESSION_DAYS = 30;
// Cloudflare Workers WebCrypto currently supports at most 100,000 PBKDF2 iterations.
const PBKDF2_ITERATIONS = 100000;
const LOGIN_RE = /^[A-Za-z0-9_]{3,24}$/;
const NAME_RE = /^[A-Za-zА-Яа-яЁё -]{2,24}$/;

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers }
  });
}
function cookie(name, value, maxAge) {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
function clearCookie() {
  return "physlab_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
}
function randomToken(bytes = 32) {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(data, b => b.toString(16).padStart(2, "0")).join("");
}
async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}
async function passwordHash(password, saltHex) {
  const salt = Uint8Array.from(saltHex.match(/.{2}/g), x => parseInt(x, 16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" }, key, 256);
  return Array.from(new Uint8Array(bits), b => b.toString(16).padStart(2, "0")).join("");
}
function safeUser(row) {
  return { login: row.login, name: row.name, ...(row.email ? { email: row.email } : {}) };
}
function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}
async function readJson(request, maxBytes = 12000) {
  const type = request.headers.get("content-type") || "";
  if (!type.includes("application/json")) throw new Error("Ожидается JSON");
  const text = await request.text();
  if (text.length > maxBytes) throw new Error("Слишком большой запрос");
  return JSON.parse(text || "{}");
}
async function currentUser(request, env) {
  const raw = request.headers.get("Cookie") || "";
  const match = raw.match(/(?:^|;\s*)physlab_session=([a-f0-9]{64})(?:;|$)/);
  if (!match) return null;
  const tokenHash = await sha256(match[1]);
  const row = await env.DB.prepare(
    "SELECT u.login,u.name,u.email FROM sessions s JOIN users u ON u.login=s.user_login WHERE s.token_hash=? AND s.expires_at>?"
  ).bind(tokenHash, Math.floor(Date.now() / 1000)).first();
  return row || null;
}
async function createSession(user, env) {
  const token = randomToken();
  const expires = Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400;
  await env.DB.prepare("INSERT INTO sessions(token_hash,user_login,expires_at,created_at) VALUES(?,?,?,?)")
    .bind(await sha256(token), user.login, expires, Math.floor(Date.now() / 1000)).run();
  return token;
}
async function rateLimit(request, env, key) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const id = await sha256(ip + ":" + key);
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare("INSERT INTO rate_limits(id,window_start,count) VALUES(?,?,1) ON CONFLICT(id) DO UPDATE SET count=CASE WHEN window_start<? THEN 1 ELSE count+1 END, window_start=CASE WHEN window_start<? THEN excluded.window_start ELSE window_start END")
    .bind(id, now, now - 900, now - 900).run();
  const row = await env.DB.prepare("SELECT count,window_start FROM rate_limits WHERE id=?").bind(id).first();
  return !!row && row.window_start >= now - 900 && row.count > 12;
}
async function api(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  if (!env.DB) return json({ ok: false, error: "База данных не подключена (binding DB)." }, 503);
  if (method !== "GET" && !sameOrigin(request)) return json({ ok: false, error: "Недопустимый источник запроса" }, 403);

  if (path === "/api/register" && method === "POST") {
    if (await rateLimit(request, env, "register")) return json({ ok: false, error: "Слишком много попыток. Попробуй позже." }, 429);
    let body; try { body = await readJson(request); } catch (e) { return json({ ok: false, error: "Некорректный запрос" }, 400); }
    const login = String(body.login || "").trim();
    const name = String(body.name || "").trim();
    const password = String(body.password || "");
    if (!LOGIN_RE.test(login) || !NAME_RE.test(name) || password.length < 8 || password.length > 128)
      return json({ ok: false, error: "Проверь логин, имя и пароль (пароль — минимум 8 символов)." }, 400);
    const salt = randomToken(16);
    const hash = await passwordHash(password, salt);
    try {
      await env.DB.prepare("INSERT INTO users(login,name,password_salt,password_hash,created_at) VALUES(?,?,?,?,?)")
        .bind(login, name, salt, hash, Math.floor(Date.now() / 1000)).run();
    } catch (e) { return json({ ok: false, error: "Такой логин уже занят" }, 409); }
    const user = { login, name };
    const token = await createSession(user, env);
    return json({ ok: true, user }, 201, { "set-cookie": cookie("physlab_session", token, SESSION_DAYS * 86400) });
  }

  if (path === "/api/login" && method === "POST") {
    if (await rateLimit(request, env, "login")) return json({ ok: false, error: "Слишком много попыток. Попробуй через 15 минут." }, 429);
    let body; try { body = await readJson(request); } catch (e) { return json({ ok: false, error: "Некорректный запрос" }, 400); }
    const login = String(body.login || "").trim();
    const password = String(body.password || "");
    const user = await env.DB.prepare("SELECT login,name,email,password_salt,password_hash FROM users WHERE login=?").bind(login).first();
    if (!user || !user.password_salt || !user.password_hash || await passwordHash(password, user.password_salt) !== user.password_hash)
      return json({ ok: false, error: "Неверный логин или пароль" }, 401);
    const token = await createSession(user, env);
    return json({ ok: true, user: safeUser(user) }, 200, { "set-cookie": cookie("physlab_session", token, SESSION_DAYS * 86400) });
  }

  if (path === "/api/google" && method === "POST") {
    let body; try { body = await readJson(request); } catch (e) { return json({ ok: false, error: "Некорректный запрос" }, 400); }
    if (!env.GOOGLE_CLIENT_ID) return json({ ok: false, error: "Google-вход не настроен на сервере" }, 503);
    const credential = String(body.credential || "");
    if (!credential || credential.length > 10000) return json({ ok: false, error: "Нет Google-токена" }, 400);
    const verify = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(credential));
    if (!verify.ok) return json({ ok: false, error: "Google не подтвердил вход" }, 401);
    const claims = await verify.json();
    if (claims.aud !== env.GOOGLE_CLIENT_ID || claims.email_verified !== "true" || !claims.sub)
      return json({ ok: false, error: "Недействительный Google-токен" }, 401);
    const sub = String(claims.sub);
    let user = await env.DB.prepare("SELECT login,name,email FROM users WHERE google_sub=?").bind(sub).first();
    if (!user) {
      const login = "g_" + sub;
      const name = String(claims.name || claims.email || "Пользователь").slice(0, 24);
      await env.DB.prepare("INSERT INTO users(login,name,email,google_sub,created_at) VALUES(?,?,?,?,?)")
        .bind(login, name, claims.email || null, sub, Math.floor(Date.now() / 1000)).run();
      user = { login, name, email: claims.email || null };
    }
    const token = await createSession(user, env);
    return json({ ok: true, user: safeUser(user) }, 200, { "set-cookie": cookie("physlab_session", token, SESSION_DAYS * 86400) });
  }

  if (path === "/api/logout" && method === "POST") {
    const raw = request.headers.get("Cookie") || "";
    const match = raw.match(/(?:^|;\s*)physlab_session=([a-f0-9]{64})(?:;|$)/);
    if (match) await env.DB.prepare("DELETE FROM sessions WHERE token_hash=?").bind(await sha256(match[1])).run();
    return json({ ok: true }, 200, { "set-cookie": clearCookie() });
  }

  if (path === "/api/me" && method === "GET") {
    const user = await currentUser(request, env);
    return json({ ok: true, user: user ? safeUser(user) : null });
  }

  const user = await currentUser(request, env);
  if (!user) return json({ ok: false, error: "Требуется вход в аккаунт" }, 401);

  if (path === "/api/exam-state" && method === "GET") {
    const row = await env.DB.prepare("SELECT state_json,updated_at FROM user_exam_state WHERE user_login=?").bind(user.login).first();
    let state = null;
    if (row && row.state_json) { try { state = JSON.parse(row.state_json); } catch (_) { state = null; } }
    return json({ ok: true, state, updated_at: row ? row.updated_at : null });
  }
  if (path === "/api/exam-state" && method === "PUT") {
    let body; try { body = await readJson(request, 200000); } catch (e) { return json({ ok: false, error: "Некорректный запрос" }, 400); }
    const state = body.state;
    if (!state || typeof state !== "object" || Array.isArray(state)) return json({ ok: false, error: "Некорректные данные прогресса" }, 400);
    const answers = Array.isArray(state.answers) ? state.answers.slice(-5000) : [];
    const variants = Array.isArray(state.variants) ? state.variants.slice(-500) : [];
    const safeState = { answers, variants, topics: state.topics && typeof state.topics === "object" ? state.topics : {}, history: Array.isArray(state.history) ? state.history.slice(0,100) : [], today: state.today || {}, streak: Number(state.streak)||0, lastDay: String(state.lastDay||"") };
    const encoded = JSON.stringify(safeState);
    if (encoded.length > 180000) return json({ ok: false, error: "История слишком большая для синхронизации" }, 413);
    const total = answers.length;
    const correct = answers.filter(x => x && x.correct === true).length;
    const best = variants.reduce((m,x) => Math.max(m, Math.min(100, Math.max(0, Number(x && x.points)||0))), 0);
    const now = Math.floor(Date.now()/1000);
    await env.DB.prepare("INSERT INTO user_exam_state(user_login,state_json,answers_total,correct_total,variants_total,best_points,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(user_login) DO UPDATE SET state_json=excluded.state_json,answers_total=excluded.answers_total,correct_total=excluded.correct_total,variants_total=excluded.variants_total,best_points=excluded.best_points,updated_at=excluded.updated_at")
      .bind(user.login, encoded, total, correct, variants.length, best, now).run();
    return json({ ok: true, updated_at: now, answers_total: total });
  }
  if (path === "/api/leaderboard" && method === "GET") {
    const rows = await env.DB.prepare("SELECT u.name,s.answers_total,s.correct_total,s.variants_total,s.best_points FROM user_exam_state s JOIN users u ON u.login=s.user_login WHERE s.leaderboard_public=1 ORDER BY s.best_points DESC,s.correct_total DESC,s.answers_total DESC LIMIT 50").all();
    return json({ ok: true, leaderboard: (rows.results||[]).map((x,i)=>({ rank:i+1,name:x.name,answers:x.answers_total,correct:x.correct_total,accuracy:x.answers_total?Math.round(x.correct_total/x.answers_total*100):0,variants:x.variants_total,best_points:x.best_points })) });
  }
  if (path === "/api/leaderboard-optin-state" && method === "GET") {
    const row = await env.DB.prepare("SELECT leaderboard_public FROM user_exam_state WHERE user_login=?").bind(user.login).first();
    return json({ ok:true, enabled:!!(row && row.leaderboard_public) });
  }
  if (path === "/api/leaderboard-optin" && method === "POST") {
    let body; try { body = await readJson(request); } catch (e) { return json({ ok: false, error: "Некорректный запрос" }, 400); }
    await env.DB.prepare("UPDATE user_exam_state SET leaderboard_public=? WHERE user_login=?").bind(body.enabled ? 1 : 0,user.login).run();
    return json({ ok: true, enabled: !!body.enabled });
  }
  if (path === "/api/admin/overview" && method === "GET") {
    const admins = String(env.ADMIN_LOGINS||"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);
    if (!admins.includes(user.login.toLowerCase())) return json({ ok:false,error:"Нет доступа к административной панели" },403);
    const [users,active,stats,top] = await Promise.all([
      env.DB.prepare("SELECT COUNT(*) AS total FROM users").first(),
      env.DB.prepare("SELECT COUNT(*) AS total FROM user_exam_state WHERE updated_at>=?").bind(Math.floor(Date.now()/1000)-30*86400).first(),
      env.DB.prepare("SELECT COALESCE(SUM(answers_total),0) AS answers,COALESCE(SUM(variants_total),0) AS variants,COALESCE(AVG(CASE WHEN answers_total>0 THEN 1.0*correct_total/answers_total END),0) AS avg_accuracy FROM user_exam_state").first(),
      env.DB.prepare("SELECT u.name,s.answers_total,s.best_points FROM user_exam_state s JOIN users u ON u.login=s.user_login ORDER BY s.answers_total DESC LIMIT 10").all()
    ]);
    return json({ok:true,users:users.total||0,active30:active.total||0,answers:stats.answers||0,variants:stats.variants||0,avgAccuracy:Math.round((stats.avg_accuracy||0)*100),top:(top.results||[])});
  }
  if (path === "/api/favorites" && method === "GET") {
    const rows = await env.DB.prepare("SELECT lab_id FROM favorites WHERE user_login=?").bind(user.login).all();
    return json({ ok: true, favorites: (rows.results || []).map(x => x.lab_id) });
  }
  if (path === "/api/favorites" && method === "POST") {
    let body; try { body = await readJson(request); } catch (e) { return json({ ok: false, error: "Некорректный запрос" }, 400); }
    const id = String(body.lab_id || "");
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id)) return json({ ok: false, error: "Некорректный ID лаборатории" }, 400);
    if (body.on) await env.DB.prepare("INSERT OR IGNORE INTO favorites(user_login,lab_id,created_at) VALUES(?,?,?)").bind(user.login, id, Math.floor(Date.now()/1000)).run();
    else await env.DB.prepare("DELETE FROM favorites WHERE user_login=? AND lab_id=?").bind(user.login, id).run();
    return json({ ok: true });
  }
  if (path === "/api/progress" && method === "GET") {
    const rows = await env.DB.prepare("SELECT lab_id FROM progress WHERE user_login=?").bind(user.login).all();
    return json({ ok: true, progress: (rows.results || []).map(x => x.lab_id) });
  }
  if (path === "/api/progress" && method === "POST") {
    let body; try { body = await readJson(request); } catch (e) { return json({ ok: false, error: "Некорректный запрос" }, 400); }
    const id = String(body.lab_id || "");
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id)) return json({ ok: false, error: "Некорректный ID лаборатории" }, 400);
    await env.DB.prepare("INSERT OR IGNORE INTO progress(user_login,lab_id,completed_at) VALUES(?,?,?)").bind(user.login, id, Math.floor(Date.now()/1000)).run();
    return json({ ok: true });
  }
  if (path === "/api/profile" && method === "POST") {
    let body; try { body = await readJson(request); } catch (e) { return json({ ok: false, error: "Некорректный запрос" }, 400); }
    const name = String(body.name || "").trim();
    if (!NAME_RE.test(name)) return json({ ok: false, error: "Некорректное имя" }, 400);
    const stored = await env.DB.prepare("SELECT password_salt,password_hash FROM users WHERE login=?").bind(user.login).first();
    if (body.new_password) {
      if (!stored.password_hash || !body.current_password || await passwordHash(String(body.current_password), stored.password_salt) !== stored.password_hash)
        return json({ ok: false, error: "Текущий пароль указан неверно" }, 400);
      if (String(body.new_password).length < 8 || String(body.new_password).length > 128) return json({ ok: false, error: "Новый пароль должен содержать минимум 8 символов" }, 400);
      const salt = randomToken(16);
      const hash = await passwordHash(String(body.new_password), salt);
      await env.DB.prepare("UPDATE users SET name=?,password_salt=?,password_hash=? WHERE login=?").bind(name, salt, hash, user.login).run();
    } else {
      await env.DB.prepare("UPDATE users SET name=? WHERE login=?").bind(name, user.login).run();
    }
    return json({ ok: true, user: { login: user.login, name, ...(user.email ? { email: user.email } : {}) } });
  }
  return json({ ok: false, error: "API-маршрут не найден" }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      try { return await api(request, env); }
      catch (error) {
        console.error("PhysLab API error", error);
        return json({ ok: false, error: "Внутренняя ошибка сервера" }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
