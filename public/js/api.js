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

  async function real(path, opts = {}) {
    const res = await fetch("/api/" + path, {
      method: opts.method || "GET",
      headers: { "content-type": "application/json", ...(token ? { authorization: "Bearer " + token } : {}) },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    let data = {};
    try { data = await res.json(); } catch {}
    if (!res.ok) { const e = new Error(data.error || "요청에 실패했어요."); e.status = res.status; throw e; }
    return data;
  }

  // ---------------- 데모 모드 (서버 없이 동작) ----------------
  const sha = async (s) => {
    const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
    return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
  };
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const fail = (m, s = 400) => { const e = new Error(m); e.status = s; throw e; };
  const pub = (u) => ({ id: u.id, email: u.email, nickname: u.nickname, avatar: u.avatar, role: u.role || "fan" });

  async function mock(path, opts = {}) {
    const b = opts.body || {};
    const users = ls.get("jl_demo_users", {});
    const [route, qs] = path.split("?");
    const q = new URLSearchParams(qs || "");
    if (route === "signup") {
      const email = String(b.email || "").trim().toLowerCase();
      if (!EMAIL_RE.test(email)) fail("올바른 이메일 주소를 입력해주세요.");
      if (String(b.password || "").length < 6) fail("비밀번호는 6자 이상이어야 해요.");
      if (users[email]) fail("이미 가입된 이메일이에요. 로그인해주세요.", 409);
      users[email] = { id: "d" + Date.now(), email, pw: await sha(b.password), nickname: "", avatar: null };
      ls.set("jl_demo_users", users);
      return { token: "demo:" + email, user: pub(users[email]) };
    }
    if (route === "login") {
      const email = String(b.email || "").trim().toLowerCase();
      const u = users[email];
      if (!u || u.pw !== (await sha(b.password || ""))) fail("이메일 또는 비밀번호가 올바르지 않아요.", 401);
      return { token: "demo:" + email, user: pub(u) };
    }
    const me = token && users[String(token).slice(5)];
    if (!me) fail("로그인이 필요해요.", 401);
    if (route === "me") return { user: pub(me) };
    if (route === "avatar") {
      me.nickname = String(b.nickname || "").slice(0, 12); me.avatar = b.avatar;
      ls.set("jl_demo_users", users);
      return { user: pub(me) };
    }
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
        if (!text) fail("메시지를 입력해주세요.");
        const m = { id: me.id, name: me.nickname, role: me.role || "fan", text, ts: Date.now(), key: "k" + Date.now() };
        all.push(m); ls.set("jl_demo_chat_" + room, all.slice(-60));
        return { message: m };
      }
    }
    fail("Not found", 404);
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
    async signup(email, password) { const d = await call("signup", { method: "POST", body: { email, password } }); token = d.token; ls.set(TOKEN_KEY, token); return d.user; },
    async login(email, password) { const d = await call("login", { method: "POST", body: { email, password } }); token = d.token; ls.set(TOKEN_KEY, token); return d.user; },
    logout() { token = null; ls.del(TOKEN_KEY); },
    async me() { return (await call("me")).user; },
    async saveAvatar(nickname, avatar) { return (await call("avatar", { method: "POST", body: { nickname, avatar } })).user; },
    presence: (p) => call("presence", { method: "POST", body: p }),
    chatList: (room, since) => call(`chat?room=${room}&since=${since || 0}`),
    chatSend: (room, text, notice) => call("chat", { method: "POST", body: { room, text, notice: !!notice } }),
    chatDelete: (key) => call("chat?key=" + encodeURIComponent(key), { method: "DELETE" }),
  };
})();
