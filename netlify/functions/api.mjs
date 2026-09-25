// JELLY LAND API — Netlify Functions (v2) + Netlify Blobs
// 경로: /api/*
//   POST /api/signup    {email, password, lang}
//   POST /api/login     {email, password}
//   GET  /api/me
//   POST /api/avatar    {nickname, avatar}
//   POST /api/settings  {lang}
//   POST /api/sync      {scene, x, y, dir, since}  ← 위치 + 새 채팅 + 공지를 한 번에 (빠르고 저렴)
//   GET  /api/chat?room=plaza|lounge&since=0
//   POST /api/chat      {room, text, notice?}   ← 보낼 때 한/영/일 3개 언어로 자동 번역해 저장
//   DELETE /api/chat?key=...        (아티스트 전용)
import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

const store = (name) => getStore({ name, consistency: "strong" });
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
// code는 화면에서 사용자 언어로 바꿔 보여주기 위한 키
const err = (code, status = 400) => json({ error: code, code }, status);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LANGS = ["ko", "en", "ja"];
const ROOMS = ["plaza", "lounge"];
const CHAT_TTL = 5 * 60 * 1000; // 채팅은 5분 뒤 사라짐
const HOST_OUTFITS = [1, 7, 8, 9]; // 호스트(조젤리) 전용 의상 번호 — public/js/avatar.js 의 host: true 와 같아야 함
const keyTs = (k) => +k.split("/")[2].split("-")[0];
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
  const body = b64u(JSON.stringify({ ...payload, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 }));
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
  return { salt, hash: crypto.scryptSync(pw, salt, 64).toString("hex") };
}
function checkPassword(pw, salt, hash) {
  return crypto.timingSafeEqual(crypto.scryptSync(pw, salt, 64), Buffer.from(hash, "hex"));
}

const artistEmails = () =>
  (process.env.ARTIST_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const userKey = (email) => "u/" + crypto.createHash("sha256").update(email).digest("hex");
const publicUser = (u) => ({
  id: u.id,
  email: u.email,
  nickname: u.nickname || "",
  avatar: u.avatar || null,
  lang: LANGS.includes(u.lang) ? u.lang : "ko",
  role: artistEmails().includes(u.email) ? "artist" : "fan",
});

// 토큰에 닉네임/아바타를 담아 두면 /sync 때 회원 정보를 읽지 않아도 돼서 빠르고 저렴해요
const tokenFor = (u) => signToken({ email: u.email, id: u.id, n: u.nickname || "", a: u.avatar || null });
async function tokenPayload(req) {
  return verifyToken((req.headers.get("authorization") || "").replace(/^Bearer\s+/i, ""));
}
async function auth(req) {
  const p = await verifyToken((req.headers.get("authorization") || "").replace(/^Bearer\s+/i, ""));
  if (!p) return null;
  return (await store("jl-users").get(userKey(p.email), { type: "json" })) || null;
}
const clean = (s, n) => String(s ?? "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, n);

// ================= 번역 =================
// 1) 환경변수 DEEPL_API_KEY 가 있으면 DeepL (무료 플랜: 월 50만 자)
// 2) 없으면 MyMemory 무료 API (키 불필요, 하루 사용량 제한 있음 — MYMEMORY_EMAIL 설정 시 한도 증가)
function detectLang(text) {
  if (/[가-힣ㄱ-ㆎ]/.test(text)) return "ko";
  if (/[぀-ヿㇰ-ㇿ一-鿿]/.test(text)) return "ja";
  return "en";
}
const withTimeout = (ms) => { const c = new AbortController(); setTimeout(() => c.abort(), ms); return c.signal; };

async function translateDeepL(text, from, to) {
  const key = process.env.DEEPL_API_KEY;
  const host = key.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com";
  const target = { ko: "KO", en: "EN-US", ja: "JA" }[to];
  const r = await fetch(`https://${host}/v2/translate`, {
    method: "POST",
    headers: { authorization: `DeepL-Auth-Key ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ text: [text], source_lang: from.toUpperCase(), target_lang: target }),
    signal: withTimeout(5000),
  });
  if (!r.ok) throw new Error("deepl " + r.status);
  const d = await r.json();
  return d.translations?.[0]?.text || null;
}
async function translateMyMemory(text, from, to) {
  const email = process.env.MYMEMORY_EMAIL ? `&de=${encodeURIComponent(process.env.MYMEMORY_EMAIL)}` : "";
  const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}${email}`, { signal: withTimeout(5000) });
  if (!r.ok) throw new Error("mymemory " + r.status);
  const d = await r.json();
  const out = d?.responseData?.translatedText;
  if (Number(d?.responseStatus) !== 200 || !out || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(out)) throw new Error("mymemory quota");
  return out;
}
async function translateAll(text) {
  const src = detectLang(text);
  const tr = { [src]: text };
  // 이모지·숫자·기호만 있는 메시지는 번역하지 않음
  if (!/[\p{L}]/u.test(text)) { for (const l of LANGS) tr[l] = text; return { lang: src, tr }; }
  await Promise.all(LANGS.filter((l) => l !== src).map(async (to) => {
    try {
      tr[to] = process.env.DEEPL_API_KEY ? await translateDeepL(text, src, to) : await translateMyMemory(text, src, to);
    } catch (e) {
      console.warn("translate failed", src, to, e.message);
    }
  }));
  return { lang: src, tr };
}

// ================= 라우터 =================
export default async (req) => {
  const url = new URL(req.url);
  const route = url.pathname.replace(/^\/api\/?/, "").replace(/\/$/, "");
  const method = req.method;
  let body = {};
  if (method === "POST") { try { body = await req.json(); } catch { body = {}; } }

  try {
    if (route === "health") return json({ ok: true, translator: process.env.DEEPL_API_KEY ? "deepl" : "mymemory" });

    if (route === "signup" && method === "POST") {
      const email = clean(body.email, 120).toLowerCase();
      const password = String(body.password || "");
      if (!EMAIL_RE.test(email)) return err("email");
      if (password.length < 6) return err("pw6");
      const users = store("jl-users");
      const key = userKey(email);
      if (await users.get(key)) return err("exists", 409);
      const { salt, hash } = hashPassword(password);
      const user = {
        id: crypto.randomUUID(), email, salt, hash, nickname: "", avatar: null,
        lang: LANGS.includes(body.lang) ? body.lang : "ko", createdAt: Date.now(),
      };
      await users.setJSON(key, user);
      return json({ token: await tokenFor(user), user: publicUser(user) });
    }

    if (route === "login" && method === "POST") {
      const email = clean(body.email, 120).toLowerCase();
      const user = await store("jl-users").get(userKey(email), { type: "json" });
      if (!user || !checkPassword(String(body.password || ""), user.salt, user.hash)) return err("login", 401);
      return json({ token: await tokenFor(user), user: publicUser(user) });
    }

    // ---------- 실시간 동기화: 위치 + 새 채팅 + 공지 (한 번의 요청) ----------
    if (route === "sync" && method === "POST") {
      const tp = await tokenPayload(req);
      if (!tp) return err("auth", 401);
      if (tp.n === undefined) return err("auth", 401); // 예전 토큰 → 다시 로그인
      const role = artistEmails().includes(tp.email) ? "artist" : "fan";
      const scene = ROOMS.includes(body.scene) ? body.scene : "plaza";
      const other = scene === "plaza" ? "lounge" : "plaza";
      const ps = store("jl-presence");
      const cs = store("jl-chat");
      const now = Date.now();
      const since = +body.since || 0;
      const [cur, oth, last] = await Promise.all([
        ps.get("room/" + scene, { type: "json" }).then((v) => v || {}),
        ps.get("room/" + other, { type: "json" }).then((v) => v || {}),
        cs.get("last/" + scene, { type: "json" }).then((v) => v || { ts: 0, notice: null }),
      ]);
      const mine = cur[tp.id];
      const entry = {
        id: tp.id, name: tp.n, avatar: tp.a, role,
        x: Math.round(+body.x || 0), y: Math.round(+body.y || 0), dir: clean(body.dir, 5), seat: clean(body.seat, 12) || null, ts: now,
      };
      // 위치가 그대로이고 최근에 저장했다면 쓰기를 건너뜀 (비용 절약)
      const unchanged = mine && mine.x === entry.x && mine.y === entry.y && mine.dir === entry.dir && mine.seat === entry.seat && mine.name === entry.name &&
        JSON.stringify(mine.avatar) === JSON.stringify(entry.avatar) && now - mine.ts < 8000;
      const writes = [];
      for (const k of Object.keys(cur)) if (now - cur[k].ts > 15000) { delete cur[k]; }
      if (!unchanged) { cur[tp.id] = entry; writes.push(ps.setJSON("room/" + scene, cur)); }
      if (oth[tp.id]) { delete oth[tp.id]; writes.push(ps.setJSON("room/" + other, oth)); }
      let messages = [];
      if (last.ts > since) {
        const { blobs } = await cs.list({ prefix: `m/${scene}/` });
        const fresh = blobs.map((b) => b.key).sort().slice(-50).filter((k) => keyTs(k) >= since && keyTs(k) > now - CHAT_TTL);
        messages = (await Promise.all(fresh.map((k) => cs.get(k, { type: "json" }).then((m) => m && { ...m, key: k })))).filter(Boolean);
      }
      await Promise.all(writes);
      const fresh = (o) => Object.values(o).filter((p) => now - p.ts < 12000);
      return json({
        others: fresh(cur).filter((p) => p.id !== tp.id),
        online: fresh(cur).length + fresh(oth).filter((p) => p.id !== tp.id).length + (cur[tp.id] ? 0 : 1),
        messages, notice: last.notice || null, lastTs: last.ts, now,
      });
    }

    // ---------- 이하 로그인 필요 ----------
    const user = await auth(req);
    if (!user) return err("auth", 401);
    const me = publicUser(user);
    const saveUser = () => store("jl-users").setJSON(userKey(user.email), user);

    if (route === "me") return json({ user: me, token: await tokenFor(user) });

    if (route === "avatar" && method === "POST") {
      const nickname = clean(body.nickname, 12);
      if (!nickname) return err("nick");
      const a = body.avatar || {};
      const n = (v) => Math.max(0, Math.min(9, v | 0));
      user.nickname = nickname;
      let outfit = n(a.outfit);
      if (HOST_OUTFITS.includes(outfit) && me.role !== "artist") outfit = 0; // 호스트 전용 의상은 호스트만
      user.avatar = { gender: a.gender === "m" ? "m" : "f", hair: n(a.hair), hairColor: n(a.hairColor), skin: n(a.skin), outfit, eye: n(a.eye) };
      await saveUser();
      return json({ user: publicUser(user), token: await tokenFor(user) });
    }

    if (route === "settings" && method === "POST") {
      if (LANGS.includes(body.lang)) user.lang = body.lang;
      await saveUser();
      return json({ user: publicUser(user), token: await tokenFor(user) });
    }

    // ---------- 접속자 위치 공유 ----------
    if (route === "presence" && method === "POST") {
      const ps = store("jl-presence");
      const scene = ROOMS.includes(body.scene) ? body.scene : "plaza";
      const now = Date.now();
      await ps.setJSON("p/" + user.id, {
        id: user.id, name: me.nickname, avatar: me.avatar, role: me.role, lang: me.lang, scene,
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

    // ---------- 방명록 (팬 라운지) ----------
    if (route === "guestbook") {
      const gs = store("jl-guestbook");
      if (method === "GET") {
        const { blobs } = await gs.list({ prefix: "g/" });
        const keys = blobs.map((b) => b.key).sort().reverse();
        const page = Math.max(0, +url.searchParams.get("page") || 0);
        const slice = keys.slice(page * 20, page * 20 + 20);
        const entries = (await Promise.all(slice.map((k) => gs.get(k, { type: "json" }).then((e) => e && { ...e, key: k })))).filter(Boolean);
        return json({ entries, total: keys.length });
      }
      if (method === "POST") {
        const text = String(body.text || "").replace(/\r/g, "").replace(/[\u0000-\u0009\u000b-\u001f]/g, "").trim().slice(0, 300).replace(/\n{3,}/g, "\n\n");
        if (!text) return err("msg");
        const lastKey = "u/" + user.id;
        const last = +(await gs.get(lastKey)) || 0;
        if (Date.now() - last < 30000) return err("slow", 429); // 30초에 한 번
        const ts = Date.now();
        const key = `g/${String(ts).padStart(15, "0")}-${crypto.randomBytes(3).toString("hex")}`;
        const e = { id: user.id, name: me.nickname || "?", role: me.role, avatar: me.avatar, text, ts };
        await Promise.all([gs.setJSON(key, e), gs.set(lastKey, String(ts))]);
        return json({ entry: { ...e, key } });
      }
      if (method === "DELETE") {
        const key = url.searchParams.get("key") || "";
        if (!key.startsWith("g/")) return err("forbidden", 400);
        const e = await gs.get(key, { type: "json" });
        if (!e) return json({ ok: true });
        if (me.role !== "artist" && e.id !== user.id) return err("forbidden", 403); // 본인 글 또는 호스트만 삭제
        await gs.delete(key);
        return json({ ok: true });
      }
    }

    // ---------- 채팅 (광장 / 팬 라운지) ----------
    if (route === "chat") {
      const cs = store("jl-chat");
      const room = ROOMS.includes(url.searchParams.get("room") || body.room) ? (url.searchParams.get("room") || body.room) : "lounge";
      if (method === "GET") {
        const since = +url.searchParams.get("since") || 0;
        const { blobs } = await cs.list({ prefix: `m/${room}/` });
        const keys = blobs.map((b) => b.key).sort().slice(-50);
        // since 이후 메시지만 가져옴 (키에 시간이 들어 있음)
        const fresh = keys.filter((k) => keyTs(k) >= since && keyTs(k) > Date.now() - CHAT_TTL); // 5분 지난 메시지는 제외
        const msgs = (await Promise.all(fresh.map((k) => cs.get(k, { type: "json" }).then((m) => m && { ...m, key: k })))).filter(Boolean);
        const notice = await cs.get(`notice/${room}`, { type: "json" });
        return json({ messages: msgs, notice: notice || null });
      }
      if (method === "POST") {
        const text = clean(body.text, 200);
        if (!text) return err("msg");
        const { lang, tr } = await translateAll(text);
        if (body.notice) {
          if (me.role !== "artist") return err("notice", 403);
          const n = { text, lang, tr, ts: Date.now(), name: me.nickname };
          await cs.setJSON(`notice/${room}`, n);
          const lst = (await cs.get("last/" + room, { type: "json" })) || {};
          await cs.setJSON("last/" + room, { ts: Math.max(lst.ts || 0, n.ts), notice: n });
          return json({ notice: n });
        }
        const ts = Date.now();
        const key = `m/${room}/${String(ts).padStart(15, "0")}-${crypto.randomBytes(3).toString("hex")}`;
        const m = { id: user.id, name: me.nickname || "?", role: me.role, text, lang, tr, ts };
        await cs.setJSON(key, m);
        // 5분 지난 메시지 정리 (저장 공간 절약)
        try {
          const { blobs } = await cs.list({ prefix: `m/${room}/` });
          const old = blobs.map((b) => b.key).filter((k) => keyTs(k) < ts - CHAT_TTL).slice(0, 30);
          await Promise.all(old.map((k) => cs.delete(k)));
        } catch {}
        const lst = (await cs.get("last/" + room, { type: "json" })) || {};
        await cs.setJSON("last/" + room, { ts, notice: lst.notice || null });
        return json({ message: { ...m, key } });
      }
      if (method === "DELETE") {
        if (me.role !== "artist") return err("forbidden", 403);
        const key = url.searchParams.get("key") || "";
        if (key.startsWith("notice/")) {
          await cs.delete(key);
          const r = key.split("/")[1];
          const lst = (await cs.get("last/" + r, { type: "json" })) || {};
          await cs.setJSON("last/" + r, { ts: lst.ts || 0, notice: null });
          return json({ ok: true });
        }
        if (!key.startsWith("m/")) return err("forbidden", 400);
        await cs.delete(key);
        return json({ ok: true });
      }
    }
    return err("notfound", 404);
  } catch (e) {
    console.error(e);
    return err("server", 500);
  }
};

export const config = { path: "/api/*" };
