// JELLY LAND 실시간 위치 서버
// - 접속: wss://<주소>/ws?room=plaza|lounge  → 첫 메시지 {t:"auth", token}
// - 위치: {t:"p", x, y, d, m}  → 같은 방의 다른 사람에게 {t:"p", id, ts, x, y, d, m}
// - 시계: {t:"ping", c} → {t:"pong", c, s}
// 이름·아바타·채팅 등은 그대로 Netlify 서버가 담당하고, 여기서는 "위치"만 빠르게 전달해요.
const ROOMS = ["plaza", "lounge"];
const OK_ORIGIN = /^(https:\/\/([a-z0-9-]+--)?jellyland\.netlify\.app|http:\/\/localhost(:\d+)?|http:\/\/127\.0\.0\.1(:\d+)?)$/;

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === "/" || url.pathname === "/health") return new Response("JELLY LAND realtime ok");
    if (url.pathname !== "/ws") return new Response("not found", { status: 404 });
    if ((req.headers.get("Upgrade") || "").toLowerCase() !== "websocket") return new Response("websocket only", { status: 426 });
    if (!OK_ORIGIN.test(req.headers.get("Origin") || "")) return new Response("forbidden", { status: 403 });
    const room = ROOMS.includes(url.searchParams.get("room")) ? url.searchParams.get("room") : "plaza";
    return env.ROOM.get(env.ROOM.idFromName(room)).fetch(req);
  },
};

const clampInt = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(+v || 0)));
const DIRS = ["up", "down", "left", "right"];

export class Room {
  constructor(state, env) {
    this.state = state; this.env = env;
    this.rate = new Map(); // 소켓별 초당 메시지 수 (도배 방지)
  }
  async fetch(req) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.state.acceptWebSocket(server); // 쉬는 동안은 잠들어서 요금이 거의 안 나옴 (Hibernation)
    server.serializeAttachment({ id: null, at: Date.now() });
    return new Response(null, { status: 101, webSocket: client });
  }
  broadcast(from, text) {
    for (const o of this.state.getWebSockets()) {
      if (o === from) continue;
      const a = o.deserializeAttachment();
      if (!a || !a.id) continue;
      try { o.send(text); } catch {}
    }
  }
  async webSocketMessage(ws, raw) {
    if (typeof raw !== "string" || raw.length > 2000) return;
    let m; try { m = JSON.parse(raw); } catch { return; }
    const now = Date.now();
    if (m.t === "ping") { ws.send(JSON.stringify({ t: "pong", c: m.c, s: now })); return; }
    const a = ws.deserializeAttachment() || {};
    if (m.t === "auth") {
      if (a.id) return;
      let id = null;
      try {
        const r = await fetch(this.env.API_ORIGIN + "/api/rt/verify", { method: "POST", headers: { authorization: "Bearer " + String(m.token || "").slice(0, 1500), "content-type": "application/json" }, body: "{}" });
        if (r.ok) id = (await r.json()).id || null;
      } catch {}
      if (!id) { try { ws.send(JSON.stringify({ t: "no" })); ws.close(4001, "auth"); } catch {} return; }
      ws.serializeAttachment({ id, at: now });
      ws.send(JSON.stringify({ t: "ok", id, s: now }));
      return;
    }
    if (!a.id) return;
    // 초당 30개까지만
    const r = this.rate.get(ws) || { s: 0, n: 0 }; const sec = Math.floor(now / 1000);
    if (r.s !== sec) { r.s = sec; r.n = 0; } r.n++; this.rate.set(ws, r);
    if (r.n > 30) return;
    if (m.t === "p") {
      // c: 보낸 기기가 이 서버 시계로 맞춘 "움직인 시각" (보내는 길의 흔들림까지 고르게 재생하려고)
      const ts = Number.isFinite(+m.c) && +m.c > 0 ? Math.max(now - 1500, Math.min(now, Math.round(+m.c))) : now;
      const out = { t: "p", id: a.id, ts, x: clampInt(m.x, -100, 5000), y: clampInt(m.y, -100, 5000), d: DIRS.includes(m.d) ? m.d : "down", m: m.m ? 1 : 0 };
      this.broadcast(ws, JSON.stringify(out));
    }
  }
  async webSocketClose(ws) { this.bye(ws); try { ws.close(1000, "bye"); } catch {} }
  async webSocketError(ws) { this.bye(ws); }
  bye(ws) {
    this.rate.delete(ws);
    const a = ws.deserializeAttachment();
    if (!a || !a.id) return;
    // 같은 사람이 다른 창으로 아직 접속해 있으면 알리지 않음
    for (const o of this.state.getWebSockets()) if (o !== ws) { const b = o.deserializeAttachment(); if (b && b.id === a.id) return; }
    this.broadcast(ws, JSON.stringify({ t: "bye", id: a.id }));
  }
}
