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
  const pub = (u) => ({ id: u.id, email: u.email, nickname: u.nickname, avatar: u.avatar, lang: u.lang || "ko", role: u.role || "fan" });

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
    if (route === "settings") { if (b.lang) me.lang = b.lang; ls.set("jl_demo_users", users); return { user: pub(me) }; }
    if (route === "presence") return { others: [], online: 1 };
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
    async me() { return (await call("me")).user; },
    async saveAvatar(nickname, avatar) { return (await call("avatar", { method: "POST", body: { nickname, avatar } })).user; },
    async saveSettings(s) { return (await call("settings", { method: "POST", body: s })).user; },
    presence: (p) => call("presence", { method: "POST", body: p }),
    chatList: (room, since) => call(`chat?room=${room}&since=${since || 0}`),
    chatSend: (room, text, notice) => call("chat", { method: "POST", body: { room, text, notice: !!notice } }),
    chatDelete: (key) => call("chat?key=" + encodeURIComponent(key), { method: "DELETE" }),
  };
})();
