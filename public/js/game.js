/* JELLY LAND — 메인 게임 */
(function () {
  const CFG = window.JELLY_CONFIG;
  const API = window.JellyAPI;
  const I = window.I18N;
  const t = (k, v) => I.t(k, v);
  const L = (v) => I.L(v);
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const FONT = "'Galmuri11', 'Galmuri9', 'Apple SD Gothic Neo', 'Hiragino Sans', 'Noto Sans JP', sans-serif";
  const ARTIST_LOOK = { gender: "f", hair: 1, hairColor: 0, skin: 0, outfit: 6 }; // 긴 웨이브 흑발 + 블랙 재킷
  const IS_TOUCH = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  if (IS_TOUCH) document.body.classList.add("touch");
  if (/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) document.body.classList.add("ios");

  const canvas = $("#game");
  const ctx = canvas.getContext("2d");
  let dpr = 1, S = 3, VW = 0, VH = 0;

  const G = {
    mode: "title", // title | creator | world
    user: null,
    scene: null, worlds: {},
    player: { x: 640, y: 840, dir: "up", moving: false, t: 0 },
    others: new Map(),
    npcs: [],
    cam: { x: 0, y: 0 },
    keys: new Set(),
    joy: { x: 0, y: 0 },
    target: null, pendingZone: null,
    zone: null,
    bubbles: new Map(), // userId -> {m, until}
    chat: { since: 0, seen: new Set(), msgs: [], notice: null, unread: 0 },
    online: 1,
    modalOpen: false,
    t: 0,
  };

  // ---------------- 화면 크기 / 모바일 대응 ----------------
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    VW = window.innerWidth; VH = window.innerHeight;
    canvas.width = Math.round(VW * dpr); canvas.height = Math.round(VH * dpr);
    S = Math.max(1.5, Math.min(4, Math.floor(Math.min(VW / 470, VH / 300) * 2) / 2));
    ctx.imageSmoothingEnabled = false;
    document.documentElement.style.setProperty("--vh", VH + "px");
  }
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", () => setTimeout(resize, 250));
  resize();
  // 모바일 키보드가 올라오면 채팅창을 키보드 위로 올림 (특히 iPhone)
  if (window.visualViewport) {
    const vv = window.visualViewport;
    const onVV = () => {
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty("--kb", kb + "px");
      document.body.classList.toggle("kb-open", kb > 80);
    };
    vv.addEventListener("resize", onVV); vv.addEventListener("scroll", onVV);
  }
  // iOS 핀치 확대·더블탭 확대 방지 (입력창 제외)
  document.addEventListener("gesturestart", (e) => e.preventDefault());
  let lastTouch = 0;
  document.addEventListener("touchend", (e) => {
    const now = Date.now();
    if (now - lastTouch < 300 && !/^(INPUT|TEXTAREA|A|BUTTON|SELECT|LABEL)$/.test(e.target.tagName)) e.preventDefault();
    lastTouch = now;
  }, { passive: false });
  document.addEventListener("focusout", () => { if (IS_TOUCH) setTimeout(() => window.scrollTo(0, 0), 50); });

  // ---------------- 토스트 / 페이드 ----------------
  let toastT;
  function toast(msg) { const el = $("#toast"); el.textContent = msg; el.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(() => (el.style.opacity = 0), 2200); }
  const fade = (on) => new Promise((r) => { $("#fade").classList.toggle("on", on); setTimeout(r, 360); });

  // ---------------- 월드 ----------------
  function buildWorlds() {
    G.worlds.plaza = World.buildPlaza();
    G.worlds.lounge = World.buildLounge();
  }
  function scene() { return G.worlds[G.scene]; }
  function setScene(id, pos) {
    G.scene = id;
    const w = scene();
    const p = pos || w.spawn;
    G.player.x = p.x; G.player.y = p.y; G.player.dir = pos && pos.dir ? pos.dir : "up";
    G.target = null; G.pendingZone = null; G.others.clear(); G.zone = null;
    $("#prompt").classList.add("hidden");
    buildMinimap();
    updateSceneLabels();
    resetChat();
    sendPresence();
  }
  function updateSceneLabels() {
    if (!G.scene) return;
    $("#mm-label").textContent = G.scene === "plaza" ? t("mapPlaza") : t("mapLounge");
    $("#chat-title").textContent = G.scene === "plaza" ? t("chatPlaza") : t("chatLounge");
  }

  function blocked(x, y) {
    const w = scene();
    if (!w.walkable(x, y)) return true;
    for (const [a, b, cw, ch] of w.colliders) if (x > a && x < a + cw && y > b && y < b + ch) return true;
    return false;
  }
  const blockedFeet = (x, y) => blocked(x - 4, y) || blocked(x + 4, y) || blocked(x, y - 3) || blocked(x, y + 1);

  // 주민 NPC (분위기용)
  function makeNPCs() {
    G.npcs = [0, 1, 2].map((i) => ({ i, av: Avatar.random(), x: 560 + i * 60, y: 640 + (i % 2) * 40, tx: 0, ty: 0, dir: "down", moving: false, wait: 1 + i, t: 0 }));
  }
  function updateNPCs(dt) {
    if (G.scene !== "plaza") return;
    for (const n of G.npcs) {
      n.t += dt;
      if (n.wait > 0) { n.wait -= dt; n.moving = false; if (n.wait <= 0) { n.tx = n.x + (Math.random() - 0.5) * 220; n.ty = n.y + (Math.random() - 0.5) * 160; } continue; }
      const dx = n.tx - n.x, dy = n.ty - n.y, d = Math.hypot(dx, dy);
      if (d < 3) { n.wait = 1.5 + Math.random() * 3; continue; }
      const sp = 40 * dt, nx = n.x + (dx / d) * sp, ny = n.y + (dy / d) * sp;
      if (blockedFeet(nx, ny)) { n.wait = 0.8; continue; }
      n.x = nx; n.y = ny; n.moving = true;
      n.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
    }
  }

  // ---------------- 입력 ----------------
  const KEYMAP = { ArrowUp: "u", KeyW: "u", ArrowDown: "d", KeyS: "d", ArrowLeft: "l", KeyA: "l", ArrowRight: "r", KeyD: "r" };
  window.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT") { if (e.key === "Escape") e.target.blur(); return; }
    if (G.modalOpen) { if (e.key === "Escape") closeModal(); return; }
    if (G.mode !== "world") return;
    if (KEYMAP[e.code]) { G.keys.add(KEYMAP[e.code]); G.target = null; e.preventDefault(); }
    if (e.code === "KeyE" || e.code === "Space") { interact(); e.preventDefault(); }
    if (e.code === "Enter") { openChat(); $("#chat-input").focus(); e.preventDefault(); }
  });
  window.addEventListener("keyup", (e) => { if (KEYMAP[e.code]) G.keys.delete(KEYMAP[e.code]); });
  window.addEventListener("blur", () => G.keys.clear());

  const toWorld = (sx, sy) => ({ x: sx / S + G.cam.x, y: sy / S + G.cam.y });
  canvas.addEventListener("pointerdown", (e) => {
    if (G.mode !== "world" || G.modalOpen) return;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    const p = toWorld(e.clientX, e.clientY);
    const w = scene();
    // 건물 클릭 → 문 앞으로 이동 후 입장
    if (w.buildings) for (const b of w.buildings) if (p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h + 6) { G.target = { x: b.door.x, y: b.door.y + 6 }; G.pendingZone = b.id; return; }
    if (w.artist && Math.hypot(p.x - w.artist.x, p.y - 12 - w.artist.y) < 18) { G.target = { x: w.artist.x + 10, y: w.artist.y + 26 }; G.pendingZone = "profile"; return; }
    G.target = p; G.pendingZone = null;
  });

  // 가상 조이스틱 (안드로이드 / 아이폰)
  (function joystick() {
    const joy = $("#joy"), knob = joy.querySelector(".knob");
    let id = null, cx = 0, cy = 0;
    joy.addEventListener("pointerdown", (e) => { e.preventDefault(); id = e.pointerId; const r = joy.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; try { joy.setPointerCapture(id); } catch {} move(e); G.target = null; });
    joy.addEventListener("pointermove", (e) => { if (e.pointerId === id) { e.preventDefault(); move(e); } });
    const end = () => { id = null; G.joy.x = G.joy.y = 0; knob.style.transform = ""; };
    joy.addEventListener("pointerup", end); joy.addEventListener("pointercancel", end); joy.addEventListener("lostpointercapture", end);
    function move(e) {
      let dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy), m = 44;
      if (d > m) { dx = (dx / d) * m; dy = (dy / d) * m; }
      knob.style.transform = `translate(${dx}px,${dy}px)`;
      G.joy.x = d > 8 ? dx / m : 0; G.joy.y = d > 8 ? dy / m : 0;
    }
  })();
  $("#act").addEventListener("click", interact);
  $("#prompt").addEventListener("click", interact);

  // ---------------- 업데이트 ----------------
  function update(dt) {
    G.t += dt * 1000;
    const p = G.player;
    let vx = 0, vy = 0;
    if (G.mode === "world" && !G.modalOpen) {
      if (G.keys.has("u")) vy -= 1; if (G.keys.has("d")) vy += 1; if (G.keys.has("l")) vx -= 1; if (G.keys.has("r")) vx += 1;
      if (G.joy.x || G.joy.y) { vx = G.joy.x; vy = G.joy.y; }
      if (!vx && !vy && G.target) {
        const dx = G.target.x - p.x, dy = G.target.y - p.y, d = Math.hypot(dx, dy);
        if (d < 3) { G.target = null; if (G.pendingZone) { const z = G.pendingZone; G.pendingZone = null; runZone(z); } }
        else { vx = dx / d; vy = dy / d; }
      }
    }
    const len = Math.hypot(vx, vy);
    p.moving = len > 0.05;
    if (p.moving) {
      if (len > 1) { vx /= len; vy /= len; }
      const sp = 92 * dt;
      const nx = p.x + vx * sp, ny = p.y + vy * sp;
      const ox = p.x, oy = p.y;
      if (!blockedFeet(nx, p.y)) p.x = nx;
      if (!blockedFeet(p.x, ny)) p.y = ny;
      p.dir = Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? "right" : "left") : vy > 0 ? "down" : "up";
      p.t += dt;
      if (G.target && Math.hypot(p.x - ox, p.y - oy) < 0.01) { p.stuck = (p.stuck || 0) + dt; if (p.stuck > 0.35) { G.target = null; G.pendingZone = null; p.stuck = 0; } } else p.stuck = 0;
    }
    for (const o of G.others.values()) {
      const k = Math.min(1, dt * 8);
      const dx = o.x - o.rx, dy = o.y - o.ry;
      o.rx += dx * k; o.ry += dy * k;
      o.walking = Math.hypot(dx, dy) > 0.6;
      if (o.walking) o.t = (o.t || 0) + dt;
    }
    updateNPCs(dt);
    const w = scene();
    let zone = null;
    if (G.mode === "world") for (const z of w.zones) if (p.x > z.x && p.x < z.x + z.w && p.y > z.y && p.y < z.y + z.h) { zone = z; break; }
    if (zone !== G.zone) { G.zone = zone; renderPrompt(); }
    // 카메라
    const vw = VW / S, vh = VH / S;
    let cx = p.x - vw / 2, cy = p.y - 12 - vh / 2;
    // 모바일에서 채팅창이 열려 있으면 캐릭터가 가려지지 않게 카메라를 옮김
    if (IS_TOUCH && G.mode === "world") {
      if (!G.chatRectT || G.t - G.chatRectT > 400) { G.chatRectT = G.t; const c = $("#chat"); G.chatRect = c.classList.contains("collapsed") ? null : c.getBoundingClientRect(); G.hudBottom = $(".hud-top").getBoundingClientRect().bottom; }
      const r = G.chatRect;
      if (r) {
        if (r.width > VW * 0.6) cy = p.y - 12 - (G.hudBottom + r.top) / 2 / S; // 세로 화면: 상단 메뉴와 채팅창 사이 가운데
        else if (r.left > VW * 0.3) cx = p.x - r.left / 2 / S; // 가로 화면: 채팅창 왼쪽 공간 가운데
      }
    }
    if (G.mode === "title") { cx = 640 - vw / 2 + Math.sin(G.t / 9000) * 260; cy = 470 - vh / 2 + Math.cos(G.t / 11000) * 160; }
    if (w.W > vw) cx = Math.max(0, Math.min(w.W - vw, cx)); else cx = (w.W - vw) / 2;
    const chatUp = IS_TOUCH && G.mode === "world" && G.chatRect && G.chatRect.width > VW * 0.6;
    if (chatUp) cy = Math.max(Math.min(0, (w.H - vh) / 2), Math.min(w.H - G.chatRect.top / S + 30, cy)); // 채팅창 위로 맵 끝까지 보이게
    else if (w.H > vh) cy = Math.max(0, Math.min(w.H - vh, cy)); else cy = (w.H - vh) / 2;
    G.cam.x = Math.round(cx * S) / S; G.cam.y = Math.round(cy * S) / S;
  }
  function renderPrompt() {
    const pr = $("#prompt"), z = G.zone;
    if (!z) return pr.classList.add("hidden");
    const act = z.id === "exit" ? "" : z.id === "profile" || z.id === "guide" ? t("actView") : t("actEnter");
    pr.innerHTML = `<kbd>E</kbd>${esc(z.label)} ${esc(act)}`;
    pr.classList.remove("hidden");
  }

  // ---------------- 렌더 ----------------
  const frameOf = (moving, tt) => (moving ? [1, 0, 3, 0][Math.floor(tt * 8) % 4] : 0);
  const msgText = (m) => (m.tr && m.tr[I.lang]) || m.text;
  function render() {
    const w = scene();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = w.id === "plaza" ? "#3f7f3a" : "#2a2230";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const k = S * dpr;
    ctx.setTransform(k, 0, 0, k, -G.cam.x * k, -G.cam.y * k);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(w.ground, 0, 0);

    const vx0 = G.cam.x - 60, vx1 = G.cam.x + VW / S + 60, vy0 = G.cam.y - 20, vy1 = G.cam.y + VH / S + 80;
    const list = [];
    for (const o of w.objects) if (o.y > vy0 && o.y < vy1 + 120 && o.x > vx0 - 200 && o.x < vx1) list.push(o);
    const chars = [];
    if (w.artist) chars.push({ y: w.artist.y, x: w.artist.x, name: L(CFG.artist.name) + " ♪", av: ARTIST_LOOK, dir: "down", frame: 0, crown: true, artist: true, bobby: true });
    if (G.scene === "plaza") for (const n of G.npcs) chars.push({ x: n.x, y: n.y, name: t("npc")[n.i], av: n.av, dir: n.dir, frame: frameOf(n.moving, n.t), npc: true });
    for (const o of G.others.values()) chars.push({ x: o.rx, y: o.ry, name: o.name, av: o.avatar, dir: o.dir || "down", frame: frameOf(o.walking, o.t || 0), crown: o.role === "artist", id: o.id, artist: o.role === "artist" });
    if (G.mode === "world") chars.push({ x: G.player.x, y: G.player.y, name: G.user.nickname, av: G.user.avatar, dir: G.player.dir, frame: frameOf(G.player.moving, G.player.t), crown: G.user.role === "artist", me: true, id: G.user.id, artist: G.user.role === "artist" });
    for (const c of chars) list.push({ y: c.y, char: c });
    list.sort((a, b) => a.y - b.y);
    for (const o of list) {
      if (o.char) {
        const c = o.char;
        Avatar.draw(ctx, c.av, c.x, c.y, c.dir, c.bobby ? Math.floor(G.t / 500) % 2 : c.frame, { crown: c.crown });
      } else o.draw(ctx, G.t);
    }
    if (G.target) { ctx.fillStyle = "rgba(255,127,174,.8)"; const r = 3 + (Math.floor(G.t / 150) % 2); ctx.fillRect(G.target.x - r, G.target.y - 1, r * 2, 2); ctx.fillRect(G.target.x - 1, G.target.y - r, 2, r * 2); }

    // ---- 화면 해상도 오버레이 (이름표, 말풍선, 아이콘) ----
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sx = (x) => (x - G.cam.x) * S, sy = (y) => (y - G.cam.y) * S;
    for (const ic of w.icons) {
      const X = sx(ic.x), Y = sy(ic.y) - 16 - Math.sin(G.t / 300) * 4;
      ctx.fillStyle = "#3a2530"; ctx.beginPath(); ctx.arc(X, Y, 17, 0, 7); ctx.fill();
      ctx.fillStyle = "#fff8ea"; ctx.beginPath(); ctx.arc(X, Y, 14, 0, 7); ctx.fill();
      ctx.font = `16px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(ic.icon, X, Y + 1);
    }
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const now = Date.now();
    for (const c of chars) {
      const X = sx(c.x), Y = sy(c.y - 27 - (c.crown ? 3 : 0));
      ctx.font = `${c.me || c.artist ? "bold " : ""}12px ${FONT}`;
      const tw = ctx.measureText(c.name).width + 10;
      ctx.fillStyle = c.artist ? "rgba(224,88,140,.92)" : c.me ? "rgba(58,37,48,.85)" : c.npc ? "rgba(79,195,176,.85)" : "rgba(58,37,48,.6)";
      ctx.fillRect(X - tw / 2, Y - 9, tw, 17);
      ctx.fillStyle = "#fff"; ctx.fillText(c.name, X, Y);
      const b = c.id && G.bubbles.get(c.id);
      if (b && b.until > now) drawBubble(X, Y - 14, msgText(b.m));
      if (c.artist && !c.id && G.scene === "plaza" && Math.floor(G.t / 4000) % 3 === 0) drawBubble(X, Y - 14, t("artistHello"));
    }
    if (G.mode === "world") drawMinimapFrame();
  }
  function drawBubble(X, Y, text) {
    ctx.font = `12px ${FONT}`;
    const lines = wrapPx(text, 150).slice(0, 3);
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 16, h = lines.length * 16 + 8;
    const x = X - w / 2, y = Y - h;
    ctx.fillStyle = "#3a2530"; ctx.fillRect(x - 2, y - 2, w + 4, h + 4); ctx.fillRect(X - 4, Y, 8, 6);
    ctx.fillStyle = "#fff"; ctx.fillRect(x, y, w, h); ctx.fillRect(X - 2, Y, 4, 4);
    ctx.fillStyle = "#3a2530"; lines.forEach((l, i) => ctx.fillText(l, X, y + 12 + i * 16));
  }
  // 말풍선 줄바꿈 (영어는 단어 단위, 한/일은 글자 단위)
  function wrapPx(text, maxW) {
    const out = []; let line = "";
    const tokens = String(text).match(/\S+\s*|\s+/g) || [];
    const push = (tok) => {
      if (ctx.measureText(line + tok).width <= maxW) { line += tok; return; }
      if (line) { out.push(line.trim()); line = ""; }
      if (ctx.measureText(tok).width <= maxW) { line = tok; return; }
      for (const ch of tok) { if (ctx.measureText(line + ch).width > maxW) { out.push(line); line = ""; } line += ch; }
    };
    tokens.forEach(push);
    if (line.trim()) out.push(line.trim());
    if (out.length > 3) out[2] = out[2].slice(0, -1) + "…";
    return out.length ? out : [""];
  }

  // ---------------- 미니맵 ----------------
  let mmBase = null;
  function buildMinimap() {
    const w = scene();
    const mm = $("#minimap");
    const sc = w.id === "plaza" ? 0.25 : 0.4;
    mm.width = Math.round(w.W * sc); mm.height = Math.round(w.H * sc);
    const c = document.createElement("canvas");
    c.width = w.W; c.height = w.H;
    const cx = c.getContext("2d"); cx.imageSmoothingEnabled = false;
    cx.drawImage(w.ground, 0, 0);
    [...w.objects].sort((a, b) => a.y - b.y).forEach((o) => o.draw(cx, 0));
    mmBase = { c, sc };
  }
  function drawMinimapFrame() {
    const mm = $("#minimap"), m = mm.getContext("2d"), w = scene();
    if (!mmBase) return;
    m.imageSmoothingEnabled = true;
    m.drawImage(mmBase.c, 0, 0, mm.width, mm.height);
    const sc = mmBase.sc;
    for (const ic of w.icons) { m.font = "13px sans-serif"; m.textAlign = "center"; m.textBaseline = "middle"; m.fillStyle = "#fff8ea"; m.beginPath(); m.arc(ic.x * sc, ic.y * sc + 10, 9, 0, 7); m.fill(); m.fillText(ic.icon, ic.x * sc, ic.y * sc + 11); }
    const dot = (x, y, col, r) => { m.fillStyle = "#3a2530"; m.beginPath(); m.arc(x * sc, y * sc, r + 1.5, 0, 7); m.fill(); m.fillStyle = col; m.beginPath(); m.arc(x * sc, y * sc, r, 0, 7); m.fill(); };
    for (const o of G.others.values()) dot(o.rx, o.ry, "#9d7cf0", 2.5);
    if (w.artist) dot(w.artist.x, w.artist.y, "#ffd34d", 3);
    if (Math.floor(G.t / 400) % 2 === 0 || G.player.moving) dot(G.player.x, G.player.y, "#e0304e", 3.5);
    m.strokeStyle = "rgba(255,255,255,.8)"; m.lineWidth = 1.5;
    m.strokeRect(G.cam.x * sc, G.cam.y * sc, (VW / S) * sc, (VH / S) * sc);
  }
  $("#minimap-wrap").addEventListener("click", () => $("#minimap-wrap").classList.toggle("big"));

  // ---------------- 상호작용 ----------------
  function interact() {
    if (G.mode !== "world" || G.modalOpen) return;
    if (G.zone) runZone(G.zone.id);
  }
  async function runZone(id) {
    if (id === "gallery") return openGallery();
    if (id === "albums") return openAlbums();
    if (id === "cinema") return openCinema();
    if (id === "profile") return openProfile();
    if (id === "guide") return openGuide();
    if (id === "lounge") { await fade(true); setScene("lounge"); await fade(false); toast(t("enteredLounge")); return; }
    if (id === "exit") { const b = G.worlds.plaza.buildings.find((x) => x.id === "lounge"); await fade(true); setScene("plaza", { x: b.door.x, y: b.door.y + 22, dir: "down" }); await fade(false); }
  }

  // ---------------- 모달 콘텐츠 ----------------
  function openModal(title, html, onMount) {
    $("#modal-title").textContent = title;
    $("#modal-body").innerHTML = html;
    $("#modal").classList.remove("hidden");
    $("#modal-body").scrollTop = 0;
    G.modalOpen = true; G.keys.clear(); G.joy.x = G.joy.y = 0;
    onMount && onMount($("#modal-body"));
  }
  function closeModal() { $("#modal").classList.add("hidden"); $("#modal-body").innerHTML = ""; G.modalOpen = false; }
  $("#modal-close").addEventListener("click", closeModal);
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });

  function openGallery() {
    const html = `<p style="margin-top:0">${esc(t("galleryIntro"))}</p>
      <div class="gallery">${CFG.photos.map((p, i) => `<div class="polaroid" data-i="${i}"><img src="${esc(p.src)}" alt="${esc(L(p.caption))}" loading="lazy"><p>${esc(L(p.caption))}</p></div>`).join("")}</div>`;
    openModal("📷 " + t("bGallery"), html, (el) => el.querySelectorAll(".polaroid").forEach((d) => d.addEventListener("click", () => {
      const i = +d.dataset.i, p = CFG.photos[i], n = CFG.photos.length;
      openModal("📷 " + t("bGallery"), `<div class="lightbox"><img src="${esc(p.src)}" alt=""><p>${esc(L(p.caption))} <small>(${i + 1}/${n})</small></p>
        <p class="lb-nav"><button class="btn sm" id="prev">◀</button><button class="btn sm" id="back">${esc(t("back"))}</button><button class="btn sm" id="next">▶</button></p></div>`, (e2) => {
        e2.querySelector("#back").addEventListener("click", openGallery);
        const go = (j) => openGalleryAt((j + n) % n);
        e2.querySelector("#prev").addEventListener("click", () => go(i - 1));
        e2.querySelector("#next").addEventListener("click", () => go(i + 1));
      });
    })));
  }
  function openGalleryAt(i) { openGallery(); $("#modal-body").querySelector(`.polaroid[data-i="${i}"]`).click(); }
  function openAlbums() {
    const html = `<p style="margin-top:0">${esc(t("albumsIntro"))}</p>` + CFG.albums.map((a) => `
      <div class="album"><img src="${esc(a.cover)}" alt=""><div>
        <span class="tag">${esc(L(a.type))}</span>
        <h3>${esc(L(a.title))}</h3><p style="margin:0;line-height:1.6">${esc(L(a.desc))}</p>
        ${a.tracks && a.tracks.length ? `<ol>${a.tracks.map((tr) => `<li>${esc(L(tr))}</li>`).join("")}</ol>` : ""}
        ${a.link ? `<p><a class="btn sm pink" href="${esc(a.link)}" target="_blank" rel="noopener">${esc(t("listen"))}</a></p>` : ""}
      </div><div class="yr">${esc(a.year)}</div></div>`).join("");
    openModal("💿 " + t("bAlbums"), html);
  }
  function openCinema(idx = 0) {
    const vs = CFG.videos;
    if (!vs.length) return openModal("🎬 " + t("bCinema"), `<p>${esc(t("noVideo"))}</p>`);
    const v = vs[idx];
    const yt = CFG.artist.links.find((l) => l.label === "YouTube");
    const html = `<div class="player"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.id)}?rel=0&playsinline=1" title="${esc(L(v.title))}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe></div>
      <h3 style="margin:12px 0 0">${esc(L(v.title))}</h3>
      <div class="vlist">${vs.map((x, i) => `<div class="vitem ${i === idx ? "on" : ""}" data-i="${i}"><img src="https://i.ytimg.com/vi/${encodeURIComponent(x.id)}/hqdefault.jpg" alt="" loading="lazy"><p>${esc(L(x.title))}</p></div>`).join("")}</div>
      ${yt ? `<p style="text-align:center"><a class="btn sm" href="${esc(yt.url)}" target="_blank" rel="noopener">${esc(t("ytChannel"))}</a></p>` : ""}`;
    openModal("🎬 " + t("bCinema"), html, (el) => el.querySelectorAll(".vitem").forEach((d) => d.addEventListener("click", () => openCinema(+d.dataset.i))));
  }
  function openProfile() {
    const a = CFG.artist;
    const html = `<div class="profile"><img src="${esc(a.photo)}" alt="${esc(L(a.name))}"><div>
      <h2>${esc(L(a.name))} <span class="en">${esc(L(a.nameEn))}</span></h2><div class="role">🎹 ${esc(L(a.title))}</div>
      ${a.bio.map((b) => `<p>${esc(L(b))}</p>`).join("")}
      <div class="links">${a.links.map((l) => `<a class="btn sm ${l.label === "YouTube" ? "pink" : l.label === "Instagram" ? "grape" : "mint"}" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(L(l.label))} ↗</a>`).join("")}</div>
      <div class="links"><button class="btn sm" data-go="gallery">${esc(t("gGallery"))}</button><button class="btn sm" data-go="albums">${esc(t("gAlbums"))}</button><button class="btn sm" data-go="cinema">${esc(t("gVideo"))}</button></div>
    </div></div>`;
    openModal("🎹 " + t("zProfile"), html, (el) => el.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => runZone(b.dataset.go))));
  }
  function openGuide() {
    openModal(t("guideTitle"), `<ul class="guide">${t("guide").map((g) => `<li>${g}</li>`).join("")}</ul>`);
  }
  $("#btn-help").addEventListener("click", openGuide);

  // ---------------- 언어 ----------------
  function langButtons(el, current, onPick) {
    el.innerHTML = I.LANGS.map((l) => `<button type="button" class="chip ${l.code === current ? "on" : ""}" data-l="${l.code}">${l.label}</button>`).join("");
    el.querySelectorAll("[data-l]").forEach((b) => b.addEventListener("click", () => onPick(b.dataset.l)));
  }
  // 언어가 바뀌면 화면의 모든 글자 + 건물 간판을 다시 그림
  function applyLang(l) {
    if (l && l !== I.lang) {
      I.set(l);
      if (G.worlds.plaza) {
        const keep = { x: G.player.x, y: G.player.y, dir: G.player.dir };
        buildWorlds();
        if (G.scene) { buildMinimap(); if (G.mode === "world") { G.player.x = keep.x; G.player.y = keep.y; } }
      }
    } else I.apply();
    renderTitleLang();
    updateSceneLabels();
    renderPrompt();
    if (G.user) refreshMe();
    rerenderChat();
    if (!$("#creator").classList.contains("hidden")) renderCreator();
    $("#btn-enter").textContent = $("#btn-cancel").classList.contains("hidden") ? t("enterBang") : t("save");
    if (G.user && !$("#auth-continue").classList.contains("hidden")) $("#cont-name").textContent = t("welcomeBack", { name: G.user.nickname || G.user.email });
  }
  let signupLang = I.lang;
  function renderTitleLang() {
    langButtons($("#lang-top"), I.lang, (l) => { signupLang = l; applyLang(l); });
    langButtons($("#lang-pick"), signupLang, (l) => { signupLang = l; applyLang(l); });
  }
  $("#btn-lang").addEventListener("click", () => {
    openModal(t("langTitle"), `<div class="lang-pick big" id="lang-modal"></div>`, (el) => {
      langButtons(el.querySelector("#lang-modal"), I.lang, async (l) => {
        applyLang(l);
        closeModal();
        toast(t("langChanged"));
        try { G.user = await API.saveSettings({ lang: l }); } catch {}
      });
    });
  });

  // ---------------- 네트워크: 접속자 ----------------
  let presBusy = false;
  async function sendPresence() {
    if (G.mode !== "world" || API.demo || presBusy || document.hidden) return;
    presBusy = true;
    try {
      const r = await API.presence({ scene: G.scene, x: Math.round(G.player.x), y: Math.round(G.player.y), dir: G.player.dir, moving: G.player.moving });
      const seen = new Set();
      for (const o of r.others) {
        seen.add(o.id);
        const ex = G.others.get(o.id);
        if (ex) Object.assign(ex, { x: o.x, y: o.y, dir: o.dir, name: o.name, avatar: o.avatar, role: o.role });
        else G.others.set(o.id, { ...o, rx: o.x, ry: o.y });
      }
      for (const id of [...G.others.keys()]) if (!seen.has(id)) G.others.delete(id);
      G.online = r.online || 1;
      $("#online").textContent = t("online", { n: G.online });
    } catch (e) { if (e.status === 401) return logout(); }
    finally { presBusy = false; }
  }
  setInterval(sendPresence, 1500);

  // ---------------- 채팅 (광장 / 팬 라운지, 자동 번역) ----------------
  function resetChat() {
    G.chat = { since: 0, seen: new Set(), msgs: [], notice: null, unread: 0 };
    $("#chat-log").innerHTML = "";
    $("#notice").classList.add("hidden");
    updateBadge();
    pollChat();
  }
  let chatBusy = false;
  async function pollChat() {
    if (G.mode !== "world" || chatBusy || document.hidden) return;
    chatBusy = true;
    const room = G.scene;
    try {
      const r = await API.chatList(room, G.chat.since);
      if (room !== G.scene) return;
      const log = $("#chat-log");
      const atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 40;
      const first = G.chat.since === 0;
      for (const m of r.messages) {
        if (G.chat.seen.has(m.key)) continue;
        G.chat.seen.add(m.key);
        G.chat.since = Math.max(G.chat.since, m.ts);
        G.chat.msgs.push(m);
        addChatLine(m);
        if (!first || Date.now() - m.ts < 8000) G.bubbles.set(m.id, { m, until: Date.now() + 6500 });
        if (!first && m.id !== G.user.id && $("#chat").classList.contains("collapsed")) G.chat.unread++;
      }
      if (G.chat.since === 0) G.chat.since = 1;
      if (atBottom || first) log.scrollTop = log.scrollHeight;
      G.chat.notice = r.notice;
      renderNotice();
      updateBadge();
    } catch (e) { if (e.status === 401) logout(); }
    finally { chatBusy = false; }
  }
  setInterval(pollChat, 2500);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { sendPresence(); pollChat(); } });

  function renderNotice() {
    const n = $("#notice"), no = G.chat.notice;
    if (!no) return n.classList.add("hidden");
    n.innerHTML = `📢 <b>${esc(t("noticeLabel"))}</b> ${esc(msgText(no))}${G.user.role === "artist" ? ` <span class="del" id="notice-del">✕</span>` : ""}`;
    n.classList.remove("hidden");
    const d = $("#notice-del");
    if (d) d.addEventListener("click", async () => { try { await API.chatDelete("notice/" + G.scene); G.chat.notice = null; renderNotice(); } catch (e) { toast(e.message); } });
  }
  function addChatLine(m) {
    const d = document.createElement("div");
    d.className = "msg" + (m.role === "artist" ? " artist" : "") + (m.id === G.user.id ? " mine" : "");
    const time = new Date(m.ts).toLocaleTimeString(I.lang === "en" ? "en-US" : I.lang === "ja" ? "ja-JP" : "ko-KR", { hour: "2-digit", minute: "2-digit" });
    const shown = msgText(m);
    const isTr = shown !== m.text;
    d.innerHTML = `<b>${esc(m.name)}</b> <span class="txt">${esc(shown)}</span>${isTr ? `<span class="tr" title="${esc(m.text)}">🌐</span>` : ""}<span class="t">${time}</span>${G.user.role === "artist" ? `<span class="del">✕</span>` : ""}`;
    if (isTr) {
      let orig = false;
      d.querySelector(".tr").addEventListener("click", () => { orig = !orig; d.querySelector(".txt").textContent = orig ? m.text : shown; d.querySelector(".tr").classList.toggle("on", orig); });
    }
    const del = d.querySelector(".del");
    if (del) del.addEventListener("click", async () => { try { await API.chatDelete(m.key); d.remove(); } catch (e) { toast(e.message); } });
    $("#chat-log").appendChild(d);
  }
  function rerenderChat() {
    if (G.mode !== "world") return;
    $("#chat-log").innerHTML = "";
    G.chat.msgs.forEach(addChatLine);
    $("#chat-log").scrollTop = $("#chat-log").scrollHeight;
    renderNotice();
  }
  function updateBadge() {
    const b = $("#chat-badge");
    b.textContent = G.chat.unread > 99 ? "99+" : G.chat.unread;
    b.classList.toggle("hidden", !G.chat.unread);
  }
  function openChat() { $("#chat").classList.remove("collapsed"); $("#chat-toggle").textContent = "_"; G.chat.unread = 0; updateBadge(); $("#chat-log").scrollTop = $("#chat-log").scrollHeight; }
  function toggleChat() {
    if ($("#chat").classList.contains("collapsed")) openChat();
    else { $("#chat").classList.add("collapsed"); $("#chat-toggle").textContent = "▲"; }
  }
  $("#chat-head").addEventListener("click", toggleChat);
  let sending = false;
  $("#chat-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const inp = $("#chat-input"), text = inp.value.trim();
    if (!text) { if (!IS_TOUCH) inp.blur(); return; }
    if (sending) return;
    sending = true;
    inp.value = "";
    const notice = $("#chat-notice").checked;
    try {
      await API.chatSend(G.scene, text, notice);
      if (notice) { $("#chat-notice").checked = false; toast(t("noticeDone")); }
      pollChat();
    } catch (err) { toast(err.message); inp.value = text; }
    finally { sending = false; }
  });

  // ---------------- 캐릭터 만들기 ----------------
  const draft = { nickname: "", avatar: Avatar.random() };
  function chipRow(id, items, key, render) {
    const el = $("#o-" + id);
    el.innerHTML = "";
    items.forEach((it, i) => {
      const v = key === "gender" ? it.v : i;
      const b = document.createElement("button");
      b.type = "button";
      b.className = render === "sw" ? "sw" : "chip";
      if (render === "sw") { b.style.background = it.c; b.title = it.name; b.setAttribute("aria-label", it.name); }
      else b.innerHTML = (it.col ? `<i style="background:${it.col}"></i>` : "") + esc(it.name);
      if (draft.avatar[key] === v) b.classList.add("on");
      b.addEventListener("click", () => { draft.avatar[key] = v; renderCreator(); });
      el.appendChild(b);
    });
  }
  function renderCreator() {
    chipRow("gender", [{ v: "f", name: t("female") }, { v: "m", name: t("male") }], "gender");
    chipRow("hair", t("hairs").map((n) => ({ name: n })), "hair");
    chipRow("hairColor", Avatar.HAIR_COLORS.map((c, i) => ({ ...c, name: t("hairColors")[i] })), "hairColor", "sw");
    chipRow("skin", Avatar.SKINS.map((c, i) => ({ ...c, name: t("skins")[i] })), "skin", "sw");
    chipRow("outfit", Avatar.OUTFITS.map((o, i) => ({ name: t("outfits")[i] || o.name, col: o.top === "#f7f4ff" || o.top === "#fff3f6" ? o.bot : o.top })), "outfit");
  }
  const DIRS = ["down", "right", "up", "left"];
  function drawPreview() {
    const c = $("#preview"), x = c.getContext("2d");
    x.clearRect(0, 0, 32, 40);
    const now = performance.now();
    Avatar.draw(x, draft.avatar, 16, 34, DIRS[Math.floor(now / 1400) % 4], [1, 0, 3, 0][Math.floor(now / 160) % 4]);
  }
  function openCreator(editing) {
    if (G.mode !== "world") G.mode = "creator";
    draft.nickname = G.user.nickname || "";
    draft.avatar = G.user.avatar ? { ...G.user.avatar } : Avatar.random();
    $("#nick").value = draft.nickname;
    $("#c-err").textContent = "";
    $("#btn-cancel").classList.toggle("hidden", !editing);
    $("#btn-enter").textContent = editing ? t("save") : t("enterBang");
    renderCreator();
    $("#title").classList.add("hidden");
    $("#creator").classList.remove("hidden");
    G.modalOpen = !!editing;
  }
  $("#btn-rand").addEventListener("click", () => { draft.avatar = Avatar.random(); renderCreator(); });
  $("#btn-cancel").addEventListener("click", () => { $("#creator").classList.add("hidden"); G.modalOpen = false; });
  $("#btn-enter").addEventListener("click", async () => {
    const nick = $("#nick").value.trim();
    if (!nick) { $("#c-err").textContent = t("needNick"); $("#nick").focus(); return; }
    const btn = $("#btn-enter"); btn.disabled = true;
    try {
      G.user = await API.saveAvatar(nick, draft.avatar);
      $("#creator").classList.add("hidden");
      G.modalOpen = false;
      if (G.mode !== "world") enterWorld(); else { refreshMe(); toast(t("saved")); }
    } catch (e) { $("#c-err").textContent = e.message; }
    finally { btn.disabled = false; }
  });
  $("#btn-edit").addEventListener("click", () => openCreator(true));

  // ---------------- 로그인 / 회원가입 ----------------
  document.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll(".tabs button").forEach((x) => x.classList.toggle("on", x === b));
    $("#f-login").classList.toggle("hidden", b.dataset.tab !== "login");
    $("#f-signup").classList.toggle("hidden", b.dataset.tab !== "signup");
  }));
  $("#f-login").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target, er = f.querySelector(".err"), btn = f.querySelector("button[type=submit]");
    er.textContent = ""; btn.disabled = true;
    try { G.user = await API.login(f.email.value, f.password.value); afterAuth(); }
    catch (x) { er.textContent = x.message; }
    finally { btn.disabled = false; }
  });
  $("#f-signup").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target, er = f.querySelector(".err"), btn = f.querySelector("button[type=submit]");
    er.textContent = "";
    if (f.password.value !== f.password2.value) { er.textContent = t("pwMismatch"); return; }
    btn.disabled = true;
    try { G.user = await API.signup(f.email.value, f.password.value, signupLang); toast(t("signedUp")); afterAuth(); }
    catch (x) { er.textContent = x.message; }
    finally { btn.disabled = false; }
  });
  function afterAuth() {
    if (document.activeElement) document.activeElement.blur();
    if (G.user.lang && G.user.lang !== I.lang) applyLang(G.user.lang);
    if (!G.user.avatar || !G.user.nickname) openCreator(false); else enterWorld();
  }
  $("#btn-continue").addEventListener("click", afterAuth);
  $("#btn-switch").addEventListener("click", () => { API.logout(); G.user = null; showAuthForms(); });
  function showAuthForms() { $("#auth-forms").classList.remove("hidden"); $("#auth-continue").classList.add("hidden"); }

  function refreshMe() {
    $("#me-name").textContent = G.user.nickname + (G.user.role === "artist" ? " 👑" : "");
    const c = $("#me-face"), x = c.getContext("2d");
    x.clearRect(0, 0, 16, 20);
    Avatar.draw(x, G.user.avatar, 8, 22, "down", 0);
    $("#chat-opts").classList.toggle("hidden", G.user.role !== "artist");
    $("#online").textContent = API.demo ? t("demoSolo") : G.online > 1 ? t("online", { n: G.online }) : t("onlineShort");
  }

  async function enterWorld() {
    await fade(true);
    $("#title").classList.add("hidden");
    $("#creator").classList.add("hidden");
    $("#hud").classList.remove("hidden");
    G.mode = "world";
    // 모바일은 채팅창을 접은 상태로 시작
    if (IS_TOUCH) { $("#chat").classList.add("collapsed"); $("#chat-toggle").textContent = "▲"; }
    refreshMe();
    setScene("plaza");
    await fade(false);
    toast(t("welcome", { name: G.user.nickname }));
  }
  function logout() {
    API.logout(); G.user = null; G.mode = "title"; G.others.clear();
    closeModal();
    $("#hud").classList.add("hidden"); $("#creator").classList.add("hidden");
    $("#title").classList.remove("hidden");
    G.scene = "plaza"; buildMinimap();
    showAuthForms();
  }
  $("#btn-logout").addEventListener("click", logout);

  // ---------------- 메인 루프 ----------------
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (G.scene) { update(dt); render(); }
    if (!$("#creator").classList.contains("hidden")) drawPreview();
    requestAnimationFrame(loop);
  }

  window.__jelly = { G, runZone: (z) => runZone(z) };
  // ---------------- 시작 ----------------
  (async function boot() {
    I.apply();
    renderTitleLang();
    try { await Promise.race([Promise.all([document.fonts.load("11px Galmuri11"), document.fonts.load("bold 13px Galmuri11")]), new Promise((r) => setTimeout(r, 2500))]); } catch {}
    buildWorlds();
    makeNPCs();
    G.scene = "plaza"; buildMinimap();
    requestAnimationFrame(loop);
    const demo = await API.init();
    if (demo) $("#demo").classList.remove("hidden");
    if (API.hasToken()) {
      try {
        G.user = await API.me();
        if (G.user.lang && G.user.lang !== I.lang) applyLang(G.user.lang);
        $("#cont-name").textContent = t("welcomeBack", { name: G.user.nickname || G.user.email });
        $("#auth-forms").classList.add("hidden"); $("#auth-continue").classList.remove("hidden");
      } catch { API.logout(); }
    }
  })();
})();
