// JELLY LAND API — Netlify Functions (v2) + Netlify Blobs
// 경로: /api/*
//   POST /api/signup    {email, password}
//   POST /api/login     {email, password}
//   GET  /api/me
//   POST /api/avatar    {nickname, avatar}
//   POST /api/presence  {scene, x, y, dir, moving}
//   GET  /api/chat?room=lounge&since=0
//   POST /api/chat      {room, text, notice?}
//   DELETE /api/chat?key=...        (아티스트 전용)
import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

const store = (name) => getStore({ name, consistency: "strong" });
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
const err = (msg, status = 400) => json({ error: msg }, status);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const b64u = (buf) => Buffer.from(buf).toString("base64url");

// ---- 서명 키: 환경변수 JWT_SECRET 우선, 없으면 Blobs에 자동 생성·저장 ----
let cachedSecret = null;
async function getSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (cachedSecret) return cachedSecret;
  const cfg = store("jl-config");
  let s = await cfg.get("secret");
  if (!s) {
    s = crypto.randomBytes(48).toString("hex");
    await cfg.set("secret", s);
  }
  cachedSecret = s;
  return s;
}

async function signToken(payload) {
  const body = b64u(JSON.stringify({ ...payload, exp: Date.now() + 1000 * 60 * 60 * 24 * 14 }));
  const sig = crypto.createHmac("sha256", await getSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}
async function verifyToken(token) {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expect = crypto.createHmac("sha256", await getSecret()).update(body).digest("base64url");
  if (sig.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    return p.exp > Date.now() ? p : null;
  } catch { return null; }
}

function hashPassword(pw, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(pw, salt, 64).toString("hex");
  return { salt, hash };
}
function checkPassword(pw, salt, hash) {
  const h = crypto.scryptSync(pw, salt, 64);
  return crypto.timingSafeEqual(h, Buffer.from(hash, "hex"));
}

const artistEmails = () =>
  (process.env.ARTIST_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

const userKey = (email) => "u/" + crypto.createHash("sha256").update(email).digest("hex");
const publicUser = (u) => ({
  id: u.id,
  email: u.email,
  nickname: u.nickname || "",
  avatar: u.avatar || null,
  role: artistEmails().includes(u.email) ? "artist" : "fan",
});

async function auth(req) {
  const h = req.headers.get("authorization") || "";
  const p = await verifyToken(h.replace(/^Bearer\s+/i, ""));
  if (!p) return null;
  const u = await store("jl-users").get(userKey(p.email), { type: "json" });
  return u || null;
}

const clean = (s, n) => String(s ?? "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, n);

export default async (req) => {
  const url = new URL(req.url);
  const route = url.pathname.replace(/^\/api\/?/, "").replace(/\/$/, "");
  const method = req.method;
  let body = {};
  if (method === "POST") {
    try { body = await req.json(); } catch { body = {}; }
  }

  try {
    if (route === "health") return json({ ok: true });

    // ---------- 회원가입 ----------
    if (route === "signup" && method === "POST") {
      const email = clean(body.email, 120).toLowerCase();
      const password = String(body.password || "");
      if (!EMAIL_RE.test(email)) return err("올바른 이메일 주소를 입력해주세요.");
      if (password.length < 6) return err("비밀번호는 6자 이상이어야 해요.");
      const users = store("jl-users");
      const key = userKey(email);
      if (await users.get(key)) return err("이미 가입된 이메일이에요. 로그인해주세요.", 409);
      const { salt, hash } = hashPassword(password);
      const user = { id: crypto.randomUUID(), email, salt, hash, nickname: "", avatar: null, createdAt: Date.now() };
      await users.setJSON(key, user);
      return json({ token: await signToken({ email, id: user.id }), user: publicUser(user) });
    }

    // ---------- 로그인 ----------
    if (route === "login" && method === "POST") {
      const email = clean(body.email, 120).toLowerCase();
      const password = String(body.password || "");
      const user = await store("jl-users").get(userKey(email), { type: "json" });
      if (!user || !checkPassword(password, user.salt, user.hash))
        return err("이메일 또는 비밀번호가 올바르지 않아요.", 401);
      return json({ token: await signToken({ email, id: user.id }), user: publicUser(user) });
    }

    // ---------- 이하 로그인 필요 ----------
    const user = await auth(req);
    if (!user) return err("로그인이 필요해요.", 401);
    const me = publicUser(user);

    if (route === "me") return json({ user: me });

    if (route === "avatar" && method === "POST") {
      const nickname = clean(body.nickname, 12);
      if (nickname.length < 1) return err("닉네임을 입력해주세요.");
      const a = body.avatar || {};
      user.nickname = nickname;
      user.avatar = {
        gender: a.gender === "m" ? "m" : "f",
        hair: Math.max(0, Math.min(9, a.hair | 0)),
        hairColor: Math.max(0, Math.min(9, a.hairColor | 0)),
        skin: Math.max(0, Math.min(9, a.skin | 0)),
        outfit: Math.max(0, Math.min(9, a.outfit | 0)),
      };
      await store("jl-users").setJSON(userKey(user.email), user);
      return json({ user: publicUser(user) });
    }

    // ---------- 접속자 위치 공유 ----------
    if (route === "presence" && method === "POST") {
      const ps = store("jl-presence");
      const scene = clean(body.scene, 20) || "plaza";
      const now = Date.now();
      await ps.setJSON("p/" + user.id, {
        id: user.id, name: me.nickname, avatar: me.avatar, role: me.role, scene,
        x: +body.x || 0, y: +body.y || 0, dir: clean(body.dir, 5), moving: !!body.moving, ts: now,
      });
      const { blobs } = await ps.list({ prefix: "p/" });
      const all = await Promise.all(blobs.map((b) => ps.get(b.key, { type: "json" }).then((v) => [b.key, v])));
      const others = [];
      for (const [key, p] of all) {
        if (!p) continue;
        if (now - p.ts > 60000) { ps.delete(key).catch(() => {}); continue; }
        if (now - p.ts < 12000 && p.id !== user.id && p.scene === scene) others.push(p);
      }
      const online = all.filter(([, p]) => p && now - p.ts < 12000).length;
      return json({ others, online });
    }

    // ---------- 커뮤니티 채팅 ----------
    if (route === "chat") {
      const cs = store("jl-chat");
      const room = clean(url.searchParams.get("room") || body.room, 20) || "lounge";
      if (method === "GET") {
        const since = +url.searchParams.get("since") || 0;
        const { blobs } = await cs.list({ prefix: `m/${room}/` });
        const keys = blobs.map((b) => b.key).sort().slice(-60);
        const msgs = (await Promise.all(keys.map((k) => cs.get(k, { type: "json" }).then((m) => m && { ...m, key: k }))))
          .filter((m) => m && m.ts > since);
        const notice = await cs.get(`notice/${room}`, { type: "json" });
        return json({ messages: msgs, notice: notice || null });
      }
      if (method === "POST") {
        const text = clean(body.text, 200);
        if (!text) return err("메시지를 입력해주세요.");
        if (body.notice) {
          if (me.role !== "artist") return err("공지는 조젤리만 작성할 수 있어요.", 403);
          const n = { text, ts: Date.now(), name: me.nickname };
          await cs.setJSON(`notice/${room}`, n);
          return json({ notice: n });
        }
        const ts = Date.now();
        const key = `m/${room}/${String(ts).padStart(15, "0")}-${crypto.randomBytes(3).toString("hex")}`;
        const m = { id: user.id, name: me.nickname || "익명", role: me.role, text, ts };
        await cs.setJSON(key, m);
        return json({ message: { ...m, key } });
      }
      if (method === "DELETE") {
        if (me.role !== "artist") return err("권한이 없어요.", 403);
        const key = url.searchParams.get("key") || "";
        if (!key.startsWith(`m/`)) return err("잘못된 요청");
        await cs.delete(key);
        return json({ ok: true });
      }
    }

    return err("Not found", 404);
  } catch (e) {
    console.error(e);
    return err("서버 오류가 발생했어요. 잠시 후 다시 시도해주세요.", 500);
  }
};

export const config = { path: "/api/*" };
