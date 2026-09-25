/* JELLY LAND API 클라이언트
   - Netlify 배포 시: /api/* 서버리스 함수 사용 (회원 정보는 Netlify Blobs에 저장)
   - 로컬에서 파일만 열었을 때: 브라우저 저장소를 쓰는 "데모 모드"로 자동 전환 */
(function () {
  const TOKEN_KEY = "jl_token";
  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
    del(k) { try { localStorage.removeItem(k); } catch {} },
  };

  let token = ls.get(TOKEN_KEY, null);
  let demo = false;

  // 오류 메시지는 사용자 언어로 (i18n.js 의 e_* 키)
  function mkErr(code, status) {
    const T = window.I18N;
    const msg = T ? T.t("e_" + code) : code;
    const e = new Error(msg && !String(msg).startsWith("e_") ? msg : T ? T.t("err") : code);
    e.status = status; e.code = code; return e;
  }
  async function real(path, opts = {}) {
    let res;
    try {
      res = await fetch("/api/" + path, {
      method: opts.method || "GET",
      headers: { "content-type": "application/json", ...(token ? { authorization: "Bearer " + token } : {}) },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    } catch { throw mkErr("net", 0); }
    let data = {};
    try { data = await res.json(); } catch {}
    if (!res.ok) throw mkErr(data.code || "server", res.status);
    return data;
  }

  // ---------------- 데모 모드 (서버 없이 동작) ----------------
  const sha = async (s) => {
    const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
    return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
  };
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const fail = (code, s = 400) => { throw mkErr(code, s); };
  const pub = (u) => ({ id: u.id, email: u.email, nickname: u.nickname, avatar: u.avatar, lang: u.lang || "ko", role: u.role || "fan", coins: u.coins | 0, inv: u.inv || [], daily: u.lastDaily || null });
  const kstDay = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

  async function mock(path, opts = {}) {
    const b = opts.body || {};
    const users = ls.get("jl_demo_users", {});
    const [route, qs] = path.split("?");
    const q = new URLSearchParams(qs || "");
    if (route === "signup") {
      const email = String(b.email || "").trim().toLowerCase();
      if (!EMAIL_RE.test(email)) fail("email");
      if (String(b.password || "").length < 6) fail("pw6");
      if (users[email]) fail("exists", 409);
      users[email] = { id: "d" + Date.now(), email, pw: await sha(b.password), nickname: "", avatar: null, lang: b.lang || "ko" };
      ls.set("jl_demo_users", users);
      return { token: "demo:" + email, user: pub(users[email]) };
    }
    if (route === "login") {
      const email = String(b.email || "").trim().toLowerCase();
      const u = users[email];
      if (!u || u.pw !== (await sha(b.password || ""))) fail("login", 401);
      return { token: "demo:" + email, user: pub(u) };
    }
    const me = token && users[String(token).slice(5)];
    if (!me) fail("auth", 401);
    if (route === "me") return { user: pub(me) };
    if (route === "avatar") {
      me.nickname = String(b.nickname || "").slice(0, 12); me.avatar = b.avatar;
      ls.set("jl_demo_users", users);
      return { user: pub(me) };
    }
    const save = () => ls.set("jl_demo_users", users);
    if (route === "daily") {
      const gained = {};
      if (!me.welcomed) { me.welcomed = true; me.coins = (me.coins | 0) + 100; gained.welcome = 100; }
      if (me.lastDaily !== kstDay()) { me.lastDaily = kstDay(); me.coins = (me.coins | 0) + 100; gained.daily = 100; }
      save(); return { user: pub(me), gained };
    }
    if (route === "shop/buy") {
      const it = (window.JELLY_SHOP || []).find((x) => x.id === b.item); if (!it) fail("notfound", 404);
      me.inv = me.inv || []; if (me.inv.includes(it.id)) return { user: pub(me) };
      if ((me.coins | 0) < it.price) fail("coins");
      me.coins -= it.price; me.inv.push(it.id); save(); return { user: pub(me) };
    }
    if (route === "game/start") return { run: Date.now() + ".demo" };
    if (route === "game/finish") {
      const coins = Math.min(200, Math.floor((+b.m || 0) / 100) * 5);
      me.coins = (me.coins | 0) + coins; if ((+b.m | 0) > (me.best | 0)) me.best = +b.m | 0; save();
      let top = ls.get("jl_demo_top", []).filter((e) => e.id !== me.id);
      top.push({ id: me.id, name: me.nickname, avatar: me.avatar, role: me.role || "fan", m: me.best | 0, ts: Date.now() });
      top = top.filter((e) => e.m > 0).sort((a, c) => c.m - a.m).slice(0, 10); ls.set("jl_demo_top", top);
      return { user: pub(me), coins, best: me.best | 0, rank: top.findIndex((e) => e.id === me.id) + 1, top };
    }
    if (route === "game/top") return { top: ls.get("jl_demo_top", []), best: me.best | 0 };
    if (route === "settings") { if (b.lang) me.lang = b.lang; ls.set("jl_demo_users", users); return { user: pub(me) }; }
    if (route === "presence") return { others: [], online: 1 };
    if (route === "sync") {
      const room = b.scene || "plaza";
      const all = ls.get("jl_demo_chat_" + room, []);
      return { others: [], online: 1, messages: all.filter((m) => m.ts >= (b.since || 0)).slice(-50), notice: ls.get("jl_demo_notice_" + room, null) };
    }
    if (route === "guestbook") {
      const all = ls.get("jl_demo_gb", []);
      const m = opts.method || "GET";
      if (m === "GET") { const page = +q.get("page") || 0; return { entries: all.slice().reverse().slice(page * 20, page * 20 + 20), total: all.length }; }
      if (m === "POST") {
        const text = String(b.text || "").trim().slice(0, 300); if (!text) fail("msg");
        const e = { id: me.id, name: me.nickname, role: me.role || "fan", avatar: me.avatar, text, ts: Date.now(), key: "g" + Date.now() };
        all.push(e); ls.set("jl_demo_gb", all);
        const d = kstDay(); if (me.gbDay !== d) { me.gbDay = d; me.gbCount = 0; }
        let coins = 0; if ((me.gbCount | 0) < 3) { me.gbCount = (me.gbCount | 0) + 1; me.coins = (me.coins | 0) + 50; coins = 50; }
        save(); return { entry: e, coins, user: pub(me) };
      }
      if (m === "DELETE") { ls.set("jl_demo_gb", all.filter((e) => e.key !== q.get("key"))); return { ok: true }; }
    }
    if (route === "chat") {
      const room = q.get("room") || b.room || "lounge";
      const all = ls.get("jl_demo_chat_" + room, []);
      if ((opts.method || "GET") === "GET") {
        const since = +q.get("since") || 0;
        return { messages: all.filter((m) => m.ts > since).slice(-60), notice: ls.get("jl_demo_notice_" + room, null) };
      }
      if (opts.method === "POST") {
        const text = String(b.text || "").trim().slice(0, 200);
        if (!text) fail("msg");
        const m = { id: me.id, name: me.nickname, role: me.role || "fan", text, ts: Date.now(), key: "k" + Date.now(), ...(await demoTranslate(text)) };
        all.push(m); ls.set("jl_demo_chat_" + room, all.slice(-60));
        return { message: m };
      }
    }
    fail("notfound", 404);
  }

  // 데모 모드: 브라우저에서 무료 번역 API 직접 호출 (실패하면 원문 그대로)
  async function demoTranslate(text) {
    const src = /[\uAC00-\uD7A3\u3131-\u318E]/.test(text) ? "ko" : /[\u3040-\u30FF\u4E00-\u9FFF]/.test(text) ? "ja" : "en";
    const tr = { [src]: text };
    await Promise.all(["ko", "en", "ja"].filter((l) => l !== src).map(async (to) => {
      try {
        const c = new AbortController(); setTimeout(() => c.abort(), 4000);
        const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${src}|${to}`, { signal: c.signal });
        const d = await r.json();
        if (Number(d.responseStatus) === 200 && !/MYMEMORY WARNING/i.test(d.responseData.translatedText)) tr[to] = d.responseData.translatedText;
      } catch {}
    }));
    return { lang: src, tr };
  }

  // 서버가 새 토큰(닉네임·아바타 포함)을 주면 교체
  function keep(d) { if (d && d.token) { token = d.token; ls.set(TOKEN_KEY, token); } return d; }

  async function call(path, opts) { return demo ? mock(path, opts) : real(path, opts); }

  window.JellyAPI = {
    get demo() { return demo; },
    async init() {
      try {
        const r = await fetch("/api/health", { cache: "no-store" });
        const d = await r.json();
        demo = !d.ok;
      } catch { demo = true; }
      if (demo && token && !String(token).startsWith("demo:")) token = null;
      return demo;
    },
    hasToken: () => !!token,
    async signup(email, password, lang) { const d = await call("signup", { method: "POST", body: { email, password, lang } }); token = d.token; ls.set(TOKEN_KEY, token); return d.user; },
    async login(email, password) { const d = await call("login", { method: "POST", body: { email, password } }); token = d.token; ls.set(TOKEN_KEY, token); return d.user; },
    logout() { token = null; ls.del(TOKEN_KEY); },
    async me() { return keep(await call("me")).user; },
    async saveAvatar(nickname, avatar) { return keep(await call("avatar", { method: "POST", body: { nickname, avatar } })).user; },
    async saveSettings(s) { return keep(await call("settings", { method: "POST", body: s })).user; },
    sync: (p) => call("sync", { method: "POST", body: p }),
    presence: (p) => call("presence", { method: "POST", body: p }),
    chatList: (room, since) => call(`chat?room=${room}&since=${since || 0}`),
    chatSend: (room, text, notice) => call("chat", { method: "POST", body: { room, text, notice: !!notice } }),
    gbList: (page) => call("guestbook?page=" + (page || 0)),
    gbWrite: (text) => call("guestbook", { method: "POST", body: { text } }),
    gbDelete: (key) => call("guestbook?key=" + encodeURIComponent(key), { method: "DELETE" }),
    daily: () => call("daily", { method: "POST", body: {} }),
    buy: (item) => call("shop/buy", { method: "POST", body: { item } }),
    gameStart: () => call("game/start", { method: "POST", body: {} }),
    gameTop: () => call("game/top"),
    gameFinish: (run, m) => call("game/finish", { method: "POST", body: { run, m } }),
    chatDelete: (key) => call("chat?key=" + encodeURIComponent(key), { method: "DELETE" }),
  };
})();
