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
      users[email] = { id: "d" + Date.now(), email, pw: await sha(b.password), nickname: "", avatar: null, lang: b.lang || "ko", role: email.startsWith("admin") ? "admin" : "fan" }; // 데모: admin 으로 시작하는 메일은 관리자
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
    if (route === "game/start") return { run: Date.now() + ".demo" + (b.game === "up" ? ".up" : ""), dayLeft: me.gameDay === kstDay() ? Math.max(0, 600 - (me.gameCoins | 0)) : 600 };
    if (route === "game/finish") {
      if (me.gameDay !== kstDay()) { me.gameDay = kstDay(); me.gameCoins = 0; }
      const coins = Math.min(200, 600 - (me.gameCoins | 0), Math.floor((+b.m || 0) / 100) * 5); me.gameCoins = (me.gameCoins | 0) + coins;
      const up = String(b.run || "").endsWith(".up"), bk = up ? "bestUp" : "best", tk = up ? "jl_demo_top_up" : "jl_demo_top";
      me.coins = (me.coins | 0) + coins; if ((+b.m | 0) > (me[bk] | 0)) me[bk] = +b.m | 0; save();
      let top = ls.get(tk, []).filter((e) => e.id !== me.id);
      top.push({ id: me.id, name: me.nickname, avatar: me.avatar, role: me.role || "fan", m: me[bk] | 0, ts: Date.now() });
      top = top.filter((e) => e.m > 0).sort((a, c) => c.m - a.m).slice(0, 10); ls.set(tk, top);
      return { user: pub(me), coins, best: me[bk] | 0, rank: top.findIndex((e) => e.id === me.id) + 1, top, dayLeft: 600 - me.gameCoins };
    }
    if (route === "slot/spin") {
      if ((me.coins | 0) < 20) fail("coins");
      const r = Math.floor(Math.random() * 100000), O = ["grape", "bell", "note", "candy", "clover", "lemon"], pk = (a) => a[Math.floor(Math.random() * a.length)];
      let reels, outcome, mult;
      if (r < 333) { outcome = "jackpot"; mult = 100; reels = ["jelly", "jelly", "jelly"]; }
      else if (r < 1333) { outcome = "jelly2"; mult = 10; reels = ["jelly", "jelly", pk(O)].sort(() => Math.random() - 0.5); }
      else if (r < 5333) { outcome = "apple"; mult = 3; reels = ["apple", "apple", "apple"]; }
      else if (r < 9333) { outcome = "heart"; mult = 3; reels = ["heart", "heart", "heart"]; }
      else if (r < 39333) { outcome = "star"; mult = 1; reels = ["star", pk(O), pk(["apple", "heart", ...O])].sort(() => Math.random() - 0.5); }
      else { outcome = "lose"; mult = 0; do { reels = [0, 1, 2].map(() => pk(["jelly", "apple", "heart", ...O])); } while (reels.filter((x) => x === "jelly").length >= 2 || (reels[0] === reels[1] && reels[1] === reels[2])); }
      me.coins = (me.coins | 0) - 20 + 20 * mult; save();
      return { reels, outcome, payout: 20 * mult, bet: 20, user: pub(me) };
    }
    if (route === "rec") {
      const all = ls.get("jl_demo_rec", []), m = opts.method || "GET";
      const left = () => (me.recDay === kstDay() ? Math.max(0, 3 - (me.recCount | 0)) : 3);
      if (m === "GET") { const page = +q.get("page") || 0; return { entries: all.slice().reverse().slice(page * 15, page * 15 + 15), total: all.length, left: left() }; }
      if (m === "POST") {
        if (me.recDay !== kstDay()) { me.recDay = kstDay(); me.recCount = 0; }
        if ((me.recCount | 0) >= 3) fail("recDaily", 429);
        if (!b.notes || !b.notes.length) fail("recEmpty");
        const e = { id: me.id, name: me.nickname, role: me.role || "fan", avatar: me.avatar, title: String(b.title || "").slice(0, 30), notes: b.notes, len: Math.max(...b.notes.map((n) => n[0])), ts: Date.now(), key: "r" + Date.now() };
        all.push(e); ls.set("jl_demo_rec", all); me.recCount = (me.recCount | 0) + 1; save();
        return { entry: e, left: left() };
      }
      if (m === "DELETE") { ls.set("jl_demo_rec", all.filter((e) => e.key !== q.get("key"))); return { ok: true }; }
    }
    if (route === "mail") {
      const box = ls.get("jl_demo_mail_" + me.id, []);
      if ((opts.method || "GET") === "DELETE") { const nb = box.filter((m) => m.ts !== +q.get("ts")); ls.set("jl_demo_mail_" + me.id, nb); return { box: nb, unread: nb.filter((m) => !m.read).length }; }
      return { box, unread: box.filter((m) => !m.read).length };
    }
    if (route === "mail/read") { ls.set("jl_demo_mail_" + me.id, ls.get("jl_demo_mail_" + me.id, []).map((m) => ({ ...m, read: true }))); return { ok: true }; }
    if (route === "admin/users") return { users: Object.values(users).map((u) => ({ id: u.id, email: u.email, nickname: u.nickname, avatar: u.avatar, role: u.role || "fan", coins: u.coins | 0, createdAt: +String(u.id).slice(1) || 0, best: u.best | 0 })) };
    if (route === "admin/mail") {
      const m = { ts: Date.now(), from: me.nickname, fromRole: me.role || "admin", text: b.text, read: false, all: b.to === "all" };
      const ids = b.to === "all" ? Object.values(users).map((u) => u.id) : [b.to];
      ids.forEach((id) => { const k = "jl_demo_mail_" + id; ls.set(k, [m, ...ls.get(k, [])]); });
      return { ok: true, sent: ids.length };
    }
    if (route === "admin/delete") { const e = Object.keys(users).find((k) => users[k].id === b.id); if (e) delete users[e]; save(); return { ok: true }; }
    if (route === "game/top") {
      if (q.get("game") === "all") return { jump: ls.get("jl_demo_top", [])[0] || null, up: ls.get("jl_demo_top_up", [])[0] || null };
      const up = q.get("game") === "up";
      return { top: ls.get(up ? "jl_demo_top_up" : "jl_demo_top", []), best: me[up ? "bestUp" : "best"] | 0 };
    }
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
        if (me.gbDay === kstDay() && me.role !== "admin" && me.role !== "artist") fail("gbDaily", 429);
        const e = { id: me.id, name: me.nickname, role: me.role || "fan", avatar: me.avatar, text, ts: Date.now(), key: "g" + Date.now() };
        all.push(e); ls.set("jl_demo_gb", all);
        const d = kstDay(); if (me.gbDay !== d) { me.gbDay = d; me.gbCount = 0; }
        let coins = 0; if ((me.gbCount | 0) < 1) { me.gbCount = 1; me.coins = (me.coins | 0) + 50; coins = 50; }
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
    gameStart: (game) => call("game/start", { method: "POST", body: { game: game || "jump" } }),
    slotSpin: () => call("slot/spin", { method: "POST", body: {} }),
    gameTop: (game) => call("game/top?game=" + (game || "jump")),
    mail: () => call("mail"),
    recList: (page) => call("rec?page=" + (page || 0)),
    recPost: (notes, title) => call("rec", { method: "POST", body: { notes, title } }),
    recDelete: (key) => call("rec?key=" + encodeURIComponent(key), { method: "DELETE" }),
    mailRead: () => call("mail/read", { method: "POST", body: {} }),
    mailDelete: (ts) => call("mail?ts=" + ts, { method: "DELETE" }),
    adminUsers: () => call("admin/users"),
    adminMail: (to, text) => call("admin/mail", { method: "POST", body: { to, text } }),
    adminDelete: (id) => call("admin/delete", { method: "POST", body: { id } }),
    gameFinish: (run, m) => call("game/finish", { method: "POST", body: { run, m } }),
    chatDelete: (key) => call("chat?key=" + encodeURIComponent(key), { method: "DELETE" }),
  };
})();
