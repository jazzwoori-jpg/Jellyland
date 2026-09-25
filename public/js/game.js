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
  const ARTIST_LOOK = { gender: "f", hair: 1, hairColor: 0, skin: 0, outfit: 1, eye: 1 }; // 긴 흑발 + Can't Stop! 곰돌이 후디 + 키타
  const APP_VERSION = "13"; // public/version.json 과 같게 — 배포 때마다 올리면 접속 중인 사람에게 새 버전 알림
  const staff = (r) => r === "artist" || r === "admin"; // 관리자 (호스트 포함)
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
    lastInput: 0,
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
    G.target = null; G.pendingZone = null; G.others.clear(); G.zone = null; G.seat = null; G.seatObj = null;
    $("#prompt").classList.add("hidden");
    buildMinimap();
    updateSceneLabels();
    resetChat();
    if (G.mode === "world" && !G.gameOpen) BGM.play(id);
  }
  function updateSceneLabels() {
    if (!G.scene) return;
    $("#mm-label").textContent = G.scene === "plaza" ? t("mapPlaza") : t("mapLounge");
    $("#chat-title").textContent = G.scene === "plaza" ? t("chatPlaza") : t("chatLounge");
    $("#btn-gb").classList.toggle("hidden", G.scene !== "lounge");
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
    G.npcs = [0, 1, 2].map((i) => ({ i, av: Avatar.random(), x: 560 + i * 60, y: 640 + (i % 2) * 40, tx: 0, ty: 0, dir: "down", moving: false, wait: 1 + i, t: 0, line: 0 }));
  }
  function updateNPCs(dt) {
    if (G.scene !== "plaza") return;
    for (const n of G.npcs) {
      n.t += dt;
      // 대사: 1번부터 10번까지 순서대로, 말풍선 4.5초 → 쉬고 → 다음 대사
      if (n.nextTalk === undefined) { n.nextTalk = G.t + 1500 + n.i * 2500; n.line = 0; }
      if (G.t >= n.nextTalk) {
        const lines = t("npcLines")[n.i] || [];
        n.say = lines[n.line % Math.max(1, lines.length)]; n.sayUntil = G.t + 4500;
        n.line = (n.line + 1) % Math.max(1, lines.length);
        n.nextTalk = G.t + 7500;
      }
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
    if (w.piano && Math.abs(p.x - w.piano.x) < 26 && p.y > w.piano.y - 26 && p.y < w.piano.y + 16) { G.target = { ...w.piano.front }; G.pendingZone = "piano"; return; }
    if (w.artist && Math.hypot(p.x - w.artist.x, p.y - 18 - w.artist.y) < 22) { G.target = { x: w.artist.x + 10, y: w.artist.y + 26 }; G.pendingZone = "profile"; return; }
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
      if (G.seat && (vx || vy || G.target)) standUp();
      if (!vx && !vy && G.target) {
        const dx = G.target.x - p.x, dy = G.target.y - p.y, d = Math.hypot(dx, dy);
        if (d < 3) { G.target = null; if (G.pendingZone) { const z = G.pendingZone; G.pendingZone = null; runZone(z); } }
        else { vx = dx / d; vy = dy / d; }
      }
    }
    const len = Math.hypot(vx, vy);
    const wasMoving = p.moving;
    if (p.vx === undefined) { p.vx = 0; p.vy = 0; }
    p.moving = len > 0.05;
    if (p.moving) G.lastInput = Date.now();
    if (!p.moving) { p.vx = 0; p.vy = 0; }
    if (p.moving !== wasMoving && G.mode === "world") kickSync(); // 출발·정지 순간 바로 알림
    if (p.moving) {
      if (len > 1) { vx /= len; vy /= len; }
      const sp = 92 * dt;
      const nx = p.x + vx * sp, ny = p.y + vy * sp;
      const ox = p.x, oy = p.y;
      if (!blockedFeet(nx, p.y)) p.x = nx;
      if (!blockedFeet(p.x, ny)) p.y = ny;
      p.dir = Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? "right" : "left") : vy > 0 ? "down" : "up";
      p.t += dt;
      // 실제 이동 속도 (다른 사람 화면에서 미리 예측해 움직이도록 함께 보냄)
      p.vx = p.vx * 0.5 + ((p.x - ox) / dt) * 0.5; p.vy = p.vy * 0.5 + ((p.y - oy) / dt) * 0.5;
      if (G.target && Math.hypot(p.x - ox, p.y - oy) < 0.01) { p.stuck = (p.stuck || 0) + dt; if (p.stuck > 0.35) { G.target = null; G.pendingZone = null; p.stuck = 0; } } else p.stuck = 0;
    }
    // 다른 플레이어: 마지막 위치 + 이동 속도로 "지금 있을 곳"을 예측해서 따라감 → 지연이 거의 안 느껴짐
    const nowMs = Date.now();
    for (const o of G.others.values()) {
      let tx = o.x, ty = o.y;
      const moving = !o.seat && (o.vx || o.vy);
      if (moving) {
        const el = Math.min(800, (o.age || 0) + (nowMs - (o.recv || nowMs))) / 1000;
        const px = o.x + o.vx * el, py = o.y + o.vy * el;
        if (!blockedFeet(px, py)) { tx = px; ty = py; }
      }
      const dx = tx - o.rx, dy = ty - o.ry, d = Math.hypot(dx, dy);
      if (d > 160) { o.rx = tx; o.ry = ty; o.walking = false; continue; }
      const sp = Math.max(moving ? Math.hypot(o.vx, o.vy) : 80, d * 5) * dt;
      if (d <= sp) { o.rx = tx; o.ry = ty; } else { o.rx += (dx / d) * sp; o.ry += (dy / d) * sp; }
      o.walking = moving || d > 1.2;
      if (o.walking) {
        o.t = (o.t || 0) + dt;
        const hx = moving ? o.vx : dx, hy = moving ? o.vy : dy;
        o.dir = Math.abs(hx) > Math.abs(hy) ? (hx > 0 ? "right" : "left") : hy > 0 ? "down" : "up";
      }
    }
    updateNPCs(dt);
    const w = scene();
    let zone = null;
    if (G.mode === "world") for (const z of w.zones) if (p.x > z.x && p.x < z.x + z.w && p.y > z.y && p.y < z.y + z.h) { zone = z; break; }
    // 벤치 · 테이블 좌석: 가까운 빈자리가 있으면 "앉기"
    if (G.mode === "world" && G.seat) zone = G.standZone || (G.standZone = { id: "stand", label: t("actStand") });
    else if (G.mode === "world" && !zone && w.seats) {
      let best = null, bd = 26;
      for (const st of w.seats) { const d = Math.hypot(p.x - st.ax, p.y - st.ay); if (d < bd && !seatTaken(st.id)) { bd = d; best = st; } }
      if (best) zone = best.zone || (best.zone = { id: "seat", seat: best, label: t("actSit") });
    }
    if (zone !== G.zone) { G.zone = zone; renderPrompt(); }
    // 카메라
    const vw = VW / S, vh = VH / S;
    let cx = p.x - vw / 2, cy = p.y - 18 - vh / 2;
    // 모바일에서 채팅창이 열려 있으면 캐릭터가 가려지지 않게 카메라를 옮김
    if (IS_TOUCH && G.mode === "world") {
      if (!G.chatRectT || G.t - G.chatRectT > 400) { G.chatRectT = G.t; const c = $("#chat"); G.chatRect = c.classList.contains("collapsed") ? null : c.getBoundingClientRect(); G.hudBottom = $(".hud-top").getBoundingClientRect().bottom; }
      const r = G.chatRect;
      if (r) {
        if (r.width > VW * 0.6) cy = p.y - 18 - (G.hudBottom + r.top) / 2 / S; // 세로 화면: 상단 메뉴와 채팅창 사이 가운데
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
    const act = z.id === "exit" || z.id === "seat" || z.id === "stand" ? "" : z.id === "piano" ? t("actPlay") : z.id === "profile" || z.id === "guide" || z.id === "guestbook" ? t("actView") : t("actEnter");
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
    if (w.artist) chars.push({ y: w.artist.y, x: w.artist.x, name: L(CFG.artist.name) + " ♪", av: ARTIST_LOOK, dir: "down", frame: 0, crown: true, artist: true, bobby: true, keytar: true });
    if (G.scene === "plaza") for (const n of G.npcs) chars.push({ x: n.x, y: n.y, name: t("npc")[n.i], av: n.av, dir: n.dir, frame: frameOf(n.moving, n.t), npc: n });
    const seatMap = w.seats ? Object.fromEntries(w.seats.map((st) => [st.id, st])) : {};
    for (const o of G.others.values()) {
      const st = o.seat && seatMap[o.seat];
      if (st) { o.rx = o.x = st.x; o.ry = o.y = st.y; }
      chars.push({ x: o.rx, y: o.ry, name: o.name, av: o.avatar, dir: st ? st.dir : o.dir || "down", frame: frameOf(o.walking, o.t || 0), crown: o.role === "artist", id: o.id, artist: o.role === "artist", admin: o.role === "admin", sit: !!st });
    }
    if (G.mode === "world") chars.push({ x: G.player.x, y: G.player.y, name: G.user.nickname, av: G.user.avatar, dir: G.player.dir, frame: frameOf(G.player.moving, G.player.t), crown: G.user.role === "artist", me: true, id: G.user.id, artist: G.user.role === "artist", admin: G.user.role === "admin", sit: !!G.seat });
    for (const c of chars) list.push({ y: c.y, char: c });
    list.sort((a, b) => a.y - b.y);
    for (const o of list) {
      if (o.char) {
        const c = o.char;
        if (c.artist || c.admin) drawAura(c.x, c.y, G.t, c.admin);
        Avatar.draw(ctx, c.av, c.x, c.y, c.dir, c.bobby ? (Math.floor(G.t / 500) % 2 ? 1 : 0) : c.frame, { keytar: c.keytar, sit: c.sit });
        if (c.artist || c.admin) drawSparkles(c.x, c.y, G.t, c.admin);
      } else o.draw(ctx, G.t);
    }
    if (G.target) { ctx.fillStyle = "rgba(255,127,174,.8)"; const r = 3 + (Math.floor(G.t / 150) % 2); ctx.fillRect(G.target.x - r, G.target.y - 1, r * 2, 2); ctx.fillRect(G.target.x - 1, G.target.y - r, 2, r * 2); }

    // ---- 화면 해상도 오버레이 (이름표, 말풍선, 아이콘) ----
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // 입체감용 화면 조명: 왼쪽 위는 밝게, 가장자리는 살짝 어둡게
    if (!G.vig || G.vigW !== VW || G.vigH !== VH) {
      G.vigW = VW; G.vigH = VH;
      const v = ctx.createRadialGradient(VW * 0.42, VH * 0.4, Math.min(VW, VH) * 0.25, VW * 0.5, VH * 0.5, Math.max(VW, VH) * 0.75);
      v.addColorStop(0, "rgba(255,245,225,0.06)"); v.addColorStop(0.6, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(35,15,50,0.30)");
      G.vig = v;
    }
    ctx.fillStyle = G.vig; ctx.fillRect(0, 0, VW, VH);
    const sx = (x) => (x - G.cam.x) * S, sy = (y) => (y - G.cam.y) * S;
    for (const ic of w.icons) {
      const X = sx(ic.x), Y = sy(ic.y) - 16 - Math.sin(G.t / 300) * 4;
      ctx.fillStyle = "#3a2530"; ctx.beginPath(); ctx.arc(X, Y, 17, 0, 7); ctx.fill();
      ctx.fillStyle = "#fff8ea"; ctx.beginPath(); ctx.arc(X, Y, 14, 0, 7); ctx.fill();
      ctx.font = `16px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(ic.icon, X, Y + 1);
    }
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const sg of w.signs || []) drawBubble(sx(sg.x), sy(sg.y) - 22 - Math.sin(G.t / 280) * 3, t(sg.key), "#fff3a8");
    const now = Date.now();
    for (const c of chars) {
      const X = sx(c.x), Y = sy(c.y - (c.sit ? 33 : 42));
      ctx.font = `${c.me || c.artist ? "bold " : ""}12px ${FONT}`;
      const label = c.artist ? "✦ " + c.name : c.admin ? "★ " + c.name : c.name;
      if (c.admin) ctx.font = `bold 12px ${FONT}`;
      const tw = ctx.measureText(label).width + 10;
      ctx.fillStyle = c.artist ? "rgba(40,130,230,.95)" : c.admin ? "rgba(214,150,10,.95)" : c.me ? "rgba(58,37,48,.85)" : c.npc ? "rgba(79,195,176,.85)" : "rgba(58,37,48,.6)";
      ctx.fillRect(X - tw / 2, Y - 9, tw, 17);
      ctx.fillStyle = "#fff"; ctx.fillText(label, X, Y);
      const b = c.id && G.bubbles.get(c.id);
      if (b && b.until > now) drawBubble(X, Y - 14, msgText(b.m));
      if (c.artist && !c.id && G.scene === "plaza" && Math.floor(G.t / 4000) % 3 === 0) drawBubble(X, Y - 14, t("artistHello"));
      if (c.npc && c.npc.say && c.npc.sayUntil > G.t) drawBubble(X, Y - 14, c.npc.say);
    }
    if (G.mode === "world" && G.t - (G.mmT || 0) > 120) { G.mmT = G.t; drawMinimapFrame(); } // 지도는 초당 8번만 (폰 부담 줄이기)
  }
  // 아티스트(조젤리) 전용: 영롱한 푸른 빛 오라 + 반짝이
  // 관리자: 노란(황금빛) 오라
  const AURA = {
    blue: ["rgba(120,215,255,.75)", "rgba(60,150,255,.38)", "rgba(40,110,255,0)", "140,225,255", "80,190,255"],
    gold: ["rgba(255,236,120,.8)", "rgba(255,196,40,.42)", "rgba(255,170,0,0)", "255,230,120", "255,200,40"],
  };
  function drawAura(x, y, tt, gold) {
    const A = gold ? AURA.gold : AURA.blue;
    const pulse = 0.75 + Math.sin(tt / 380) * 0.25;
    ctx.save();
    // 푸른 후광 (밝은 바닥에서도 잘 보이도록 진한 파랑 → 투명)
    const R = 34 * pulse + 8;
    const g = ctx.createRadialGradient(x, y - 18, 3, x, y - 18, R);
    g.addColorStop(0, A[0]);
    g.addColorStop(0.5, A[1]);
    g.addColorStop(1, A[2]);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x, y - 18, R * 0.8, R * 1.05, 0, 0, Math.PI * 2); ctx.fill();
    // 위로 올라가는 빛기둥
    const g2 = ctx.createLinearGradient(0, y - 66, 0, y);
    g2.addColorStop(0, `rgba(${A[3]},0)`);
    g2.addColorStop(1, `rgba(${A[3]},${0.35 * pulse})`);
    ctx.fillStyle = g2; ctx.fillRect(x - 8, y - 66, 16, 66);
    // 발밑 빛 고리
    ctx.fillStyle = `rgba(${A[4]},${0.55 + 0.35 * pulse})`;
    for (let i = -11; i <= 11; i++) { const h = Math.round(Math.sqrt(121 - i * i) / 3); ctx.fillRect(x + i, y - h + 1, 1, 1); ctx.fillRect(x + i, y + h + 1, 1, 1); }
    ctx.restore();
  }
  function drawSparkles(x, y, tt, gold) {
    ctx.save();
    for (let i = 0; i < 6; i++) {
      const a = tt / 700 + (i * Math.PI) / 3;
      const r = 15 + Math.sin(tt / 300 + i) * 2;
      const sx = Math.round(x + Math.cos(a) * r), sy = Math.round(y - 18 + Math.sin(a) * r * 1.1 - ((tt / 25 + i * 9) % 18) * 0.3);
      const on = (Math.floor(tt / 160) + i) % 3;
      ctx.fillStyle = on === 0 ? "#ffffff" : gold ? (on === 1 ? "#fff3a8" : "#ffc83d") : on === 1 ? "#9fe8ff" : "#5fb8ff";
      ctx.fillRect(sx, sy, 1, 1);
      if (on === 0) { ctx.fillRect(sx - 1, sy, 3, 1); ctx.fillRect(sx, sy - 1, 1, 3); }
    }
    ctx.restore();
  }
  const wrapCache = new Map();
  function drawBubble(X, Y, text, bg) {
    ctx.font = `12px ${FONT}`;
    let lines = wrapCache.get(text);
    if (!lines) { lines = wrapPx(text, 150).slice(0, 3); if (wrapCache.size > 200) wrapCache.clear(); wrapCache.set(text, lines); }
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 16, h = lines.length * 16 + 8;
    const x = X - w / 2, y = Y - h;
    ctx.fillStyle = "#3a2530"; ctx.fillRect(x - 2, y - 2, w + 4, h + 4); ctx.fillRect(X - 4, Y, 8, 6);
    ctx.fillStyle = bg || "#fff"; ctx.fillRect(x, y, w, h); ctx.fillRect(X - 2, Y, 4, 4);
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
  function seatTaken(id) { for (const o of G.others.values()) if (o.seat === id) return true; return false; }
  function sitDown(st) {
    if (seatTaken(st.id)) return;
    G.seat = st.id; G.seatObj = st; G.target = null; G.pendingZone = null;
    G.player.x = st.x; G.player.y = st.y; G.player.dir = st.dir; G.player.moving = false;
    G.zone = null; kickSync();
  }
  function standUp() {
    const st = G.seatObj; G.seat = null; G.seatObj = null;
    if (st) { G.player.x = st.ax; G.player.y = st.ay; }
    G.zone = null; kickSync();
  }
  async function runZone(id) {
    if (id === "seat" && G.zone && G.zone.seat) return sitDown(G.zone.seat);
    if (id === "stand") return standUp();
    if (id === "guestbook") return openGuestbook();
    if (id === "gallery") return openGallery();
    if (id === "albums") return openAlbums();
    if (id === "cinema") return openCinema();
    if (id === "profile") return openProfile();
    if (id === "guide") return openGuide();
    if (id === "shop") return openShop();
    if (id === "piano") return openPiano();
    if (id === "game") return openGame();
    if (id === "lounge") { await fade(true); setScene("lounge"); await fade(false); toast(t("enteredLounge")); return; }
    if (id === "exit") { const b = G.worlds.plaza.buildings.find((x) => x.id === "lounge"); await fade(true); setScene("plaza", { x: b.door.x, y: b.door.y + 22, dir: "down" }); await fade(false); }
  }

  // ---------------- 모달 콘텐츠 ----------------
  function openModal(title, html, onMount, wide) {
    if (G.modalCleanup) { const f = G.modalCleanup; G.modalCleanup = null; try { f(); } catch {} }
    document.querySelector("#modal .modal").classList.toggle("wide", !!wide);
    document.querySelector("#modal .modal").classList.remove("game", "piano");
    $("#modal-close-big").textContent = t("close");
    $("#modal-title").textContent = title;
    $("#modal-body").innerHTML = html;
    $("#modal").classList.remove("hidden");
    $("#modal-body").scrollTop = 0;
    G.modalOpen = true; G.keys.clear(); G.joy.x = G.joy.y = 0;
    onMount && onMount($("#modal-body"));
  }
  function closeModal() {
    if (G.modalCleanup) { const f = G.modalCleanup; G.modalCleanup = null; try { f(); } catch {} }
    $("#modal").classList.add("hidden"); $("#modal-body").innerHTML = ""; G.modalOpen = false;
  }
  $("#modal-close").addEventListener("click", closeModal);
  $("#modal-close-big").addEventListener("click", closeModal);
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });

  function openGallery() {
    const html = `<p style="margin-top:0">${esc(t("galleryIntro"))} <button class="btn sm grape" data-go="profile">${esc(t("seeProfile"))}</button></p>
      <div class="gallery">${CFG.photos.map((p, i) => `<div class="polaroid" data-i="${i}"><img src="${esc(p.src)}" alt="${esc(L(p.caption))}" loading="lazy"><p>${esc(L(p.caption))}</p></div>`).join("")}</div>`;
    openModal("📷 " + t("bGallery"), html, (el) => { el.querySelector("[data-go=profile]").addEventListener("click", openProfile); el.querySelectorAll(".polaroid").forEach((d) => d.addEventListener("click", () => {
      const i = +d.dataset.i, p = CFG.photos[i], n = CFG.photos.length;
      openModal("📷 " + t("bGallery"), `<div class="lightbox"><img src="${esc(p.src)}" alt=""><p>${esc(L(p.caption))} <small>(${i + 1}/${n})</small></p>
        <p class="lb-nav"><button class="btn sm" id="prev">◀</button><button class="btn sm" id="back">${esc(t("back"))}</button><button class="btn sm" id="next">▶</button></p></div>`, (e2) => {
        e2.querySelector("#back").addEventListener("click", openGallery);
        const go = (j) => openGalleryAt((j + n) % n);
        e2.querySelector("#prev").addEventListener("click", () => go(i - 1));
        e2.querySelector("#next").addEventListener("click", () => go(i + 1));
      });
    })); });
  }
  function openGalleryAt(i) { openGallery(); $("#modal-body").querySelector(`.polaroid[data-i="${i}"]`).click(); }
  function openAlbums() {
    const meta = (k, v) => (v ? `<div><span>${esc(t(k))}</span><b>${esc(L(v))}</b></div>` : "");
    const html = `<p style="margin-top:0">${esc(t("albumsIntro"))}</p>` + CFG.albums.map((a, i) => `
      <div class="album">
        <div class="album-top">
          <img src="${esc(a.cover)}" alt="" class="cover">
          <div class="album-info">
            <span class="tag">${esc(L(a.type))}</span>
            <h3>${esc(L(a.title))}</h3>
            <div class="artist-line">Jo Jelly</div>
            <div class="meta">${meta("albRelease", a.date || a.year)}${meta("albGenre", a.genre)}${meta("albLabel", a.label)}${meta("albAgency", a.agency)}</div>
            ${a.link ? `<a class="btn sm pink" href="${esc(a.link)}" target="_blank" rel="noopener">${esc(t("listen"))}</a>` : ""}
          </div>
        </div>
        ${a.tracks && a.tracks.length ? `<h4>${esc(t("albTracks"))}</h4><ol class="tracks">${a.tracks.map((tr) => `<li>${esc(L(tr))}</li>`).join("")}</ol>` : ""}
        ${a.desc ? `<h4>${esc(t("albAbout"))}</h4><p class="desc">${esc(L(a.desc)).replace(/\n/g, "<br>")}</p>` : ""}
        ${a.credits && a.credits.length ? `<details class="credits"${i === 0 ? "" : ""}><summary>${esc(t("albCredits"))}</summary><dl>${a.credits.map(([r, n]) => `<dt>${esc(r)}</dt><dd>${esc(n)}</dd>`).join("")}</dl></details>` : ""}
      </div>`).join("");
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
  // ---------------- 젤리코인 ----------------
  const SHOP = window.JELLY_SHOP || [];
  const isHost = () => !!(G.user && G.user.role === "artist");
  const owns = (it) => isHost() || !!(G.user && (G.user.inv || []).includes(it.id));
  const shopItem = (kind, idx) => SHOP.find((x) => x.kind === kind && x.idx === idx);
  const kstDay = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  function setUser(u) { if (!u) return; G.user = { ...G.user, ...u }; refreshMe(); }
  function renderCoins() {
    const el = $("#coin-pill"); if (!el || !G.user) return;
    const n = G.user.coins | 0, old = +el.dataset.n || 0;
    el.textContent = "🪙 " + n.toLocaleString();
    if (n > old && el.dataset.n !== undefined) { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
    el.dataset.n = n;
    const sc = $("#shop-coins"); if (sc) sc.textContent = n.toLocaleString();
  }
  let dailyBusy = false;
  async function checkDaily() {
    if (!G.user || G.mode !== "world" || dailyBusy) return;
    if (G.user.daily === kstDay() && G.user.welcomedChecked) return;
    dailyBusy = true;
    try {
      const r = await API.daily();
      setUser(r.user); G.user.welcomedChecked = true;
      const msgs = [];
      if (r.gained && r.gained.welcome) msgs.push(t("coinWelcome", { n: r.gained.welcome }));
      if (r.gained && r.gained.daily) msgs.push(t("coinDaily", { n: r.gained.daily }));
      msgs.forEach((m, i) => setTimeout(() => toast(m), 2600 + i * 2500));
    } catch {} finally { dailyBusy = false; }
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden && G.user && G.user.daily !== kstDay()) checkDaily(); });
  $("#coin-pill").addEventListener("click", () => toast(`🪙 ${t("myCoins")}: ${(G.user.coins | 0).toLocaleString()}`));

  // ---------------- 🛍️ 젤리젤리샵 ----------------
  let shopTab = "all";
  function previewAv(it) {
    const av = { ...(G.user.avatar || Avatar.random()) };
    av[it.kind] = it.idx;
    if (it.kind === "outfit" && av.wand) av.wand = av.wand; // 마법봉은 그대로
    return av;
  }
  function openShop() {
    const html = `<div class="shop-top"><div class="coin-big">🪙 <b id="shop-coins">${(G.user.coins | 0).toLocaleString()}</b> <small>${esc(t("coinName"))}</small></div>
      <p>${esc(t("shopIntro"))}</p><p class="shop-how">${esc(t("shopHow"))}</p></div>
      <div class="chips shop-tabs">${["all", "hair", "outfit", "wand"].map((k) => `<button class="chip ${k === shopTab ? "on" : ""}" data-k="${k}">${esc(t({ all: "kAll", hair: "kHair", outfit: "kOutfit", wand: "kWand" }[k]))}</button>`).join("")}</div>
      <div class="shop-grid" id="shop-grid"></div>`;
    openModal("🛍️ " + t("bShop"), html, (el) => {
      el.querySelectorAll(".shop-tabs .chip").forEach((b) => b.addEventListener("click", () => { shopTab = b.dataset.k; el.querySelectorAll(".shop-tabs .chip").forEach((x) => x.classList.toggle("on", x === b)); renderShop(); }));
      renderShop();
    }, true);
  }
  function renderShop() {
    const grid = $("#shop-grid"); if (!grid) return;
    const av = G.user.avatar || {};
    const list = SHOP.filter((it) => shopTab === "all" || it.kind === shopTab);
    grid.innerHTML = list.map((it) => {
      const own = owns(it), on = (av[it.kind] | 0) === it.idx;
      const tier = it.price >= 12000 ? "t4" : it.price >= 5000 ? "t3" : it.price >= 1200 ? "t2" : "t1";
      const btn = !own ? `<button class="btn sm pink buy ${(G.user.coins | 0) < it.price ? "poor" : ""}" data-act="buy">🪙 ${it.price.toLocaleString()} ${esc(t("buy"))}</button>`
        : on ? (it.kind === "wand" ? `<button class="btn sm" data-act="off">${esc(t("unequip"))}</button>` : `<button class="btn sm on" disabled>${esc(t("equipped"))}</button>`)
        : `<button class="btn sm grape" data-act="wear">${esc(t("equip"))}</button>`;
      return `<div class="shop-item ${tier}${own ? " own" : ""}" data-id="${it.id}">
        <span class="kind">${esc(t({ hair: "kHair", outfit: "kOutfit", wand: "kWand" }[it.kind]))}</span>${own ? `<span class="owned">${esc(t("owned"))}</span>` : ""}
        <canvas width="96" height="96"></canvas><b>${esc(L(it.name))}</b><span class="price">🪙 ${it.price.toLocaleString()}</span>${btn}</div>`;
    }).join("");
    grid.querySelectorAll(".shop-item").forEach((card) => {
      const it = SHOP.find((x) => x.id === card.dataset.id);
      const c = card.querySelector("canvas"), x = c.getContext("2d");
      x.imageSmoothingEnabled = false;
      const pv = previewAv(it);
      let dirI = 0;
      const drawPv = () => { x.clearRect(0, 0, 96, 96); x.drawImage(Avatar.sprite(pv, ["down", "right", "up", "left"][dirI % 4], 0), 0, 0, 96, 96); };
      drawPv();
      c.addEventListener("click", () => { dirI++; drawPv(); });
      const b = card.querySelector("[data-act]");
      if (!b) return;
      b.addEventListener("click", async () => {
        const act = b.dataset.act;
        if (act === "buy") {
          if ((G.user.coins | 0) < it.price) return toast(t("e_coins"));
          if (!b.classList.contains("sure")) { b.classList.add("sure"); b.textContent = t("buySure") + " 🪙" + it.price.toLocaleString(); setTimeout(() => { if (b.isConnected && b.classList.contains("sure")) { b.classList.remove("sure"); b.textContent = `🪙 ${it.price.toLocaleString()} ${t("buy")}`; } }, 3500); return; }
          b.disabled = true;
          try { const r = await API.buy(it.id); setUser(r.user); toast(t("bought", { name: L(it.name) })); await wear(it); }
          catch (e) { toast(e.message); }
          renderShop();
          return;
        }
        b.disabled = true;
        try { await wear(it, act === "off"); } catch (e) { toast(e.message); }
        renderShop();
      });
    });
  }
  async function wear(it, off) {
    const av = { ...(G.user.avatar || Avatar.random()) };
    av[it.kind] = off ? 0 : it.idx;
    const u = await API.saveAvatar(G.user.nickname, av);
    setUser(u); kickSync();
    if (!off) toast(t("wearing", { name: L(it.name) }));
  }

  // ---------------- 🎹 피아노 연주 ----------------
  function openPiano() {
    BGM.stop(); // 연주하는 동안 배경음악은 잠시 멈춤
    openModal(t("pianoTitle"), `<div id="pn-root"></div>`, (el) => {
      const pn = Piano.mount(el.querySelector("#pn-root"), { t, lang: I.lang });
      G.modalCleanup = () => { pn.destroy(); BGM.play(G.scene); };
    }, true);
    document.querySelector("#modal .modal").classList.add("piano");
  }

  // ---------------- 🔮 오늘의 운세 ----------------
  function fortuneBox(el) {
    const box = document.createElement("div"); box.className = "ft-box";
    let saved = ""; try { saved = localStorage.getItem("jl_birth") || ""; } catch {}
    box.innerHTML = `<button class="btn pink ft-open">${esc(t("ftBtn"))}</button>
      <div class="ft-form hidden"><label>${esc(t("ftBirth"))}</label><input type="date" class="inp ft-date" min="1900-01-01" max="${Fortune.today()}" value="${esc(saved)}"><button class="btn grape ft-go">${esc(t("ftGo"))}</button></div>
      <div class="ft-result hidden"></div>`;
    el.appendChild(box);
    const form = box.querySelector(".ft-form"), res = box.querySelector(".ft-result"), inp = box.querySelector(".ft-date");
    box.querySelector(".ft-open").addEventListener("click", () => { form.classList.toggle("hidden"); res.classList.add("hidden"); if (!form.classList.contains("hidden")) box.scrollIntoView({ block: "nearest", behavior: "smooth" }); });
    box.querySelector(".ft-go").addEventListener("click", () => {
      const v = inp.value;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return toast(t("ftNeed"));
      try { localStorage.setItem("jl_birth", v); } catch {}
      const f = Fortune.make(v, I.lang);
      const star = (n) => "★".repeat(n) + "☆".repeat(5 - n);
      res.innerHTML = `<h3>${esc(t("ftTitle"))}</h3><p class="ft-for">${esc(t("ftFor", { date: Fortune.today(), sign: f.sign, animal: f.animal }))}</p>
        <p class="ft-msg">${esc(f.msg)}</p>
        <div class="ft-grid"><span>${esc(t("ftTotal"))}</span><b>${star(f.total)}</b><span>${esc(t("ftLove"))}</span><b>${star(f.love)}</b>
        <span>${esc(t("ftMoney"))}</span><b>${star(f.money)}</b><span>${esc(t("ftHealth"))}</span><b>${star(f.health)}</b></div>
        <div class="ft-lucky"><div><small>${esc(t("ftLuckyColor"))}</small><b><i style="background:${f.color}"></i>${esc(f.colorName)}</b></div>
        <div><small>${esc(t("ftLuckyNum"))}</small><b>${f.num}</b></div><div><small>${esc(t("ftLuckySong"))}</small><b>🎹 ${esc(f.song)}</b></div></div>`;
      res.classList.remove("hidden"); form.classList.add("hidden");
      box.querySelector(".ft-open").textContent = t("ftAgain");
      res.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }

  // ---------------- 🎮 젤리게임월드: 점프점프 젤리월드 ----------------
  function openGame() {
    G.gameOpen = true;
    BGM.play("minigame");
    openModal("🎮 " + t("gameTitle"), `<div id="jg-root"></div>`, (el) => {
      const g = JumpGame.mount(el.querySelector("#jg-root"), {
        t, avatar: () => G.user.avatar, dayLeft: G.user.gameLeft,
        onStart: () => API.gameStart(),
        onFinish: async (run, m) => {
          const r = await API.gameFinish(run, m);
          if (r.user) setUser(r.user);
          if (r.top) renderRank(r.top);
          if (r.rank) setTimeout(() => toast(t("rankNew", { n: r.rank })), 600);
          return r;
        },
      });
      const box = document.createElement("div"); box.className = "jg-rank"; box.id = "jg-rank";
      box.innerHTML = `<h3>${esc(t("rankTitle"))}</h3><div class="rk-list"><p class="rk-empty">…</p></div>`;
      fortuneBox(el.querySelector("#jg-root"));
      el.querySelector("#jg-root").appendChild(box);
      API.gameTop().then((r) => renderRank(r.top || [])).catch(() => renderRank([]));
      G.modalCleanup = () => { g.destroy(); G.gameOpen = false; BGM.play(G.scene); };
    }, true);
    document.querySelector("#modal .modal").classList.add("game");
  }

  // 랭킹 TOP 10
  function renderRank(top) {
    const list = document.querySelector("#jg-rank .rk-list"); if (!list) return;
    if (!top.length) { list.innerHTML = `<p class="rk-empty">${esc(t("rankEmpty"))}</p>`; return; }
    const medal = ["🥇", "🥈", "🥉"];
    list.innerHTML = top.map((e, i) => `<div class="rk-row${G.user && e.id === G.user.id ? " me" : ""}${e.role === "artist" ? " host" : ""}">
      <span class="rk-no">${medal[i] || i + 1}</span><canvas width="32" height="26" data-av='${esc(JSON.stringify(e.avatar || null))}'></canvas>
      <b>${e.role === "artist" ? "✦ " : ""}${esc(e.name)}</b><span class="rk-m">${Number(e.m).toLocaleString()} m</span></div>`).join("");
    list.querySelectorAll("canvas[data-av]").forEach((c) => { try { Avatar.face(c.getContext("2d"), JSON.parse(c.dataset.av), 32, 26); } catch {} });
  }

  // ---------------- ✉️ 쪽지함 ----------------
  let mailUnread = 0, mailBox = [];
  async function loadMail(first) {
    if (!G.user || G.mode !== "world") return;
    try {
      const r = await API.mail();
      mailBox = r.box || [];
      const n = r.unread | 0;
      if (n > mailUnread && !first) toast(t("mailNew"));
      else if (n > 0 && first) setTimeout(() => toast(t("mailNew")), 8000);
      mailUnread = n; renderMailBadge();
      if (document.querySelector("#mail-list")) renderMailList();
    } catch {}
  }
  setInterval(() => { if (!document.hidden) loadMail(); }, 60000);
  function renderMailBadge() { const b = $("#mail-badge"); b.textContent = mailUnread > 9 ? "9+" : mailUnread; b.classList.toggle("hidden", !mailUnread); }
  function openMail() {
    openModal(t("mailTitle"), `<div id="mail-list" class="mail-list"></div>`, () => {
      renderMailList();
      if (mailUnread) { API.mailRead().catch(() => {}); mailUnread = 0; renderMailBadge(); }
      loadMail();
    }, true);
  }
  function renderMailList() {
    const el = $("#mail-list"); if (!el) return;
    if (!mailBox.length) { el.innerHTML = `<p class="gb-empty">${esc(t("mailEmpty"))}</p>`; return; }
    el.innerHTML = mailBox.map((m) => `<div class="mail-item${m.read ? "" : " unread"}" data-ts="${m.ts}">
      <div class="mail-head"><b class="${m.fromRole === "artist" ? "host" : "adm"}">${m.fromRole === "artist" ? "✦" : "★"} ${esc(m.from)}</b>
      <span class="role">${esc(t(m.fromRole === "artist" ? "roleArtist" : "roleAdmin"))}${m.all ? " · " + esc(t("mailAll")) : ""}</span>
      <span class="when">${fmtTime(m.ts)}</span><button class="gb-del" title="${esc(t("del"))}">✕</button></div>
      <div class="mail-text">${esc(m.text).replace(/\n/g, "<br>")}</div></div>`).join("");
    el.querySelectorAll(".mail-item .gb-del").forEach((b) => b.addEventListener("click", async () => {
      const ts = +b.closest(".mail-item").dataset.ts;
      try { const r = await API.mailDelete(ts); mailBox = r.box || []; renderMailList(); } catch (e) { toast(e.message); }
    }));
  }
  $("#btn-mail").addEventListener("click", openMail);

  // ---------------- 🛠 관리자: 회원관리 ----------------
  let adminUsers = [];
  function openAdmin() {
    if (!G.user || !staff(G.user.role)) return;
    openModal(t("adminTitle"), `<div class="adm-top"><input class="inp" id="adm-q" placeholder="${esc(t("adminSearch"))}"><span id="adm-count"></span>
      <button class="btn sm grape" id="adm-all">${esc(t("adminAll"))}</button></div>
      <div class="adm-compose hidden" id="adm-compose-all"><textarea id="adm-all-text" maxlength="500" rows="3" placeholder="${esc(t("adminMsgPh"))}"></textarea><button class="btn sm pink" id="adm-all-send">${esc(t("adminSend"))}</button></div>
      <div class="adm-list" id="adm-list"><p class="gb-empty">…</p></div>`, (el) => {
      el.querySelector("#adm-q").addEventListener("input", renderAdmin);
      el.querySelector("#adm-all").addEventListener("click", () => el.querySelector("#adm-compose-all").classList.toggle("hidden"));
      el.querySelector("#adm-all-send").addEventListener("click", async (e) => {
        const ta = el.querySelector("#adm-all-text"), text = ta.value.trim(); if (!text) return;
        e.target.disabled = true;
        try { const r = await API.adminMail("all", text); ta.value = ""; el.querySelector("#adm-compose-all").classList.add("hidden"); toast(t("adminSent", { n: r.sent })); loadMail(); }
        catch (x) { toast(x.message); } finally { e.target.disabled = false; }
      });
      API.adminUsers().then((r) => { adminUsers = r.users || []; renderAdmin(); }).catch((x) => { el.querySelector("#adm-list").innerHTML = `<p class="gb-empty">${esc(x.message)}</p>`; });
    }, true);
  }
  function renderAdmin() {
    const el = $("#adm-list"); if (!el) return;
    const q = ($("#adm-q").value || "").trim().toLowerCase();
    const list = adminUsers.filter((u) => !q || (u.nickname || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q));
    $("#adm-count").textContent = t("adminCount", { n: adminUsers.length });
    const roleName = (r) => t(r === "artist" ? "roleArtist" : r === "admin" ? "roleAdmin" : "roleFan");
    el.innerHTML = list.map((u) => `<div class="adm-row" data-id="${esc(u.id)}">
      <canvas width="32" height="26" data-av='${esc(JSON.stringify(u.avatar || null))}'></canvas>
      <div class="adm-info"><b>${esc(u.nickname || "—")}</b> <span class="adm-role r-${u.role}">${esc(roleName(u.role))}</span><br>
        <small>${esc(u.email)} · ${esc(t("adminJoined"))} ${u.createdAt ? fmtTime(u.createdAt).slice(0, 10) : "-"} · 🪙 ${(u.coins | 0).toLocaleString()}</small></div>
      <div class="adm-act"><button class="btn sm" data-act="msg">${esc(t("adminMsg"))}</button>${staff(u.role) ? "" : `<button class="btn sm kick" data-act="kick">${esc(t("adminKick"))}</button>`}</div>
      <div class="adm-compose hidden"><textarea maxlength="500" rows="3" placeholder="${esc(t("adminMsgPh"))}"></textarea><button class="btn sm pink" data-act="send">${esc(t("adminSend"))}</button></div></div>`).join("");
    el.querySelectorAll("canvas[data-av]").forEach((c) => { try { const av = JSON.parse(c.dataset.av); if (av) Avatar.face(c.getContext("2d"), av, 32, 26); } catch {} });
    el.querySelectorAll(".adm-row").forEach((row) => {
      const u = adminUsers.find((x) => x.id === row.dataset.id);
      row.querySelector("[data-act=msg]").addEventListener("click", () => row.querySelector(".adm-compose").classList.toggle("hidden"));
      row.querySelector("[data-act=send]").addEventListener("click", async (e) => {
        const ta = row.querySelector("textarea"), text = ta.value.trim(); if (!text) return;
        e.target.disabled = true;
        try { await API.adminMail(u.id, text); ta.value = ""; row.querySelector(".adm-compose").classList.add("hidden"); toast(t("adminSent", { n: 1 })); }
        catch (x) { toast(x.message); } finally { e.target.disabled = false; }
      });
      const kb = row.querySelector("[data-act=kick]");
      if (kb) kb.addEventListener("click", async () => {
        if (!kb.classList.contains("sure")) { kb.classList.add("sure"); kb.textContent = t("adminKickSure"); setTimeout(() => { if (kb.isConnected) { kb.classList.remove("sure"); kb.textContent = t("adminKick"); } }, 4000); return; }
        kb.disabled = true;
        try { await API.adminDelete(u.id); adminUsers = adminUsers.filter((x) => x.id !== u.id); toast(t("adminKicked", { name: u.nickname || u.email })); renderAdmin(); }
        catch (x) { toast(x.message); kb.disabled = false; }
      });
    });
  }
  $("#btn-admin").addEventListener("click", openAdmin);

  // ---------------- ✨ 새 버전 알림 ----------------
  async function checkVersion() {
    try {
      const r = await fetch("version.json?" + Date.now(), { cache: "no-store" });
      const d = await r.json();
      if (d && d.v && String(d.v) !== APP_VERSION) showUpdateBar();
    } catch {}
  }
  function showUpdateBar() {
    if ($("#update-bar")) return;
    const b = document.createElement("div"); b.id = "update-bar"; b.className = "win";
    b.innerHTML = `<span>${esc(t("newVersion"))}</span><button class="btn sm pink">${esc(t("reload"))}</button>`;
    b.querySelector("button").addEventListener("click", () => location.reload());
    document.body.appendChild(b);
  }
  setInterval(() => { if (!document.hidden) checkVersion(); }, 120000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) checkVersion(); });

  // ---------------- 📲 홈 화면에 앱 추가 ----------------
  let installEvt = null;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e; });
  const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  function maybeInstallPopup() {
    if (!IS_TOUCH || isStandalone() || G.modalOpen || G.mode !== "world") return;
    try { if (localStorage.getItem("jl_install_shown")) return; localStorage.setItem("jl_install_shown", "1"); } catch {}
    openInstall();
  }
  function openInstall() {
    const ios = document.body.classList.contains("ios");
    const html = `<div class="install"><img src="img/icon-180.png" alt="" class="inst-icon"><p>${esc(t("installIntro"))}</p>
      ${installEvt ? `<button class="btn pink" id="inst-go">${esc(t("installBtn"))}</button>` : ""}
      <div class="inst-steps">${ios ? `<div class="inst-card">${t("installIOS")}</div>` : `<div class="inst-card">${t("installAndroid")}</div><div class="inst-card">${t("installIOS")}</div>`}</div>
      <button class="btn sm" id="inst-later">${esc(t("installLater"))}</button></div>`;
    openModal(t("installTitle"), html, (el) => {
      const go = el.querySelector("#inst-go");
      if (go) go.addEventListener("click", async () => { try { installEvt.prompt(); await installEvt.userChoice; toast(t("installDone")); } catch {} installEvt = null; closeModal(); });
      el.querySelector("#inst-later").addEventListener("click", closeModal);
    });
  }
  if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));

  // ---------------- 방명록 ----------------
  const fmtTime = (ts) => { const d = new Date(ts), z = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}.${z(d.getMonth() + 1)}.${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; };
  async function openGuestbook(page = 0) {
    openModal("📖 " + t("gbTitle"), `<div class="gb-write"><h3>${esc(t("gbWriteTitle"))}</h3><p>${esc(t("gbIntro"))}</p><p class="gb-once">${esc(t("gbOnce"))}</p>
      <form class="gb-form" id="gb-form"><textarea id="gb-text" maxlength="300" rows="4" placeholder="${esc(t("gbPh"))}"></textarea>
      <div class="gb-row"><span id="gb-count">0/300</span><button class="btn pink" type="submit">${esc(t("gbWrite"))}</button></div><div class="err" id="gb-err"></div></form></div>
      <h3 class="gb-list-title">${esc(t("gbListTitle"))}</h3>
      <div class="gb-list" id="gb-list"><p class="gb-empty">…</p></div><div class="gb-pager" id="gb-pager"></div>`, (el) => {
      const ta = el.querySelector("#gb-text");
      ta.addEventListener("input", () => (el.querySelector("#gb-count").textContent = ta.value.length + "/300"));
      el.querySelector("#gb-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const text = ta.value.trim(); if (!text) return;
        const btn = e.target.querySelector("button"); btn.disabled = true;
        try { const r = await API.gbWrite(text); if (r.user) setUser(r.user); if (r.coins) setTimeout(() => toast(t("coinGb", { n: r.coins })), 900); ta.value = ""; el.querySelector("#gb-count").textContent = "0/300"; toast(t("gbDone")); loadGb(0); }
        catch (err) { el.querySelector("#gb-err").textContent = err.message; }
        finally { btn.disabled = false; }
      });
      loadGb(page);
    }, true);
  }
  async function loadGb(page) {
    const list = $("#gb-list"), pager = $("#gb-pager");
    if (!list) return;
    try {
      const r = await API.gbList(page);
      if (!r.entries.length) { list.innerHTML = `<p class="gb-empty">${esc(t("gbEmpty"))}</p>`; pager.innerHTML = ""; return; }
      list.innerHTML = `<div class="gb-head"><span>${esc(t("gbNo"))}</span><span>${esc(t("gbWriter"))}</span><span>${esc(t("gbContent"))}</span><span>${esc(t("gbDate"))}</span></div>` +
        r.entries.map((e, i) => `<div class="gb-item${e.role === "artist" ? " host" : ""}" data-key="${esc(e.key)}">
          <span class="no">${r.total - page * 20 - i}</span>
          <span class="who"><canvas width="32" height="26" data-av='${esc(JSON.stringify(e.avatar || null))}'></canvas><b>${e.role === "artist" ? "✦ " : ""}${esc(e.name)}</b></span>
          <span class="txt">${esc(e.text).replace(/\n/g, "<br>")}</span>
          <span class="when">${fmtTime(e.ts)}${G.user && (staff(G.user.role) || G.user.id === e.id) ? ` <button class="gb-del" title="${esc(t("del"))}">✕</button>` : ""}</span></div>`).join("");
      list.querySelectorAll("canvas[data-av]").forEach((c) => { try { const av = JSON.parse(c.dataset.av); const x = c.getContext("2d"); x.imageSmoothingEnabled = false; Avatar.face(x, av, 32, 26); } catch {} });
      list.querySelectorAll(".gb-del").forEach((b) => b.addEventListener("click", async () => {
        const key = b.closest(".gb-item").dataset.key;
        try { await API.gbDelete(key); loadGb(page); } catch (e) { toast(e.message); }
      }));
      const pages = Math.ceil(r.total / 20);
      pager.innerHTML = pages > 1 ? Array.from({ length: pages }, (_, i) => `<button class="chip ${i === page ? "on" : ""}" data-p="${i}">${i + 1}</button>`).join("") : "";
      pager.querySelectorAll("[data-p]").forEach((b) => b.addEventListener("click", () => loadGb(+b.dataset.p)));
    } catch (e) { list.innerHTML = `<p class="gb-empty">${esc(e.message)}</p>`; }
  }

  function openGuide() {
    openModal(t("guideTitle"), `<ul class="guide">${t("guide").map((g) => `<li>${g}</li>`).join("")}</ul><p style="text-align:center"><button class="btn sm grape" id="guide-profile">${esc(t("seeProfile"))}</button> <button class="btn sm pink" id="guide-install">${esc(t("installHelp"))}</button></p>`,
      (el) => { el.querySelector("#guide-install").addEventListener("click", openInstall); el.querySelector("#guide-profile").addEventListener("click", openProfile); });
  }
  $("#btn-help").addEventListener("click", openGuide);
  function bgmBtn() { $("#btn-bgm").textContent = BGM.on ? "🔊" : "🔇"; $("#btn-bgm").title = t("bgm"); }
  $("#btn-bgm").addEventListener("click", () => { BGM.toggle(); bgmBtn(); });
  bgmBtn();
  $("#btn-gb").addEventListener("click", () => openGuestbook());

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
    // 로그인 화면 배경음악 켜기/끄기
    const tb = document.createElement("button");
    tb.type = "button"; tb.className = "chip bgm-title"; tb.textContent = BGM.on ? "🔊" : "🔇"; tb.title = t("bgm");
    tb.addEventListener("click", () => { BGM.toggle(); tb.textContent = BGM.on ? "🔊" : "🔇"; bgmBtn(); });
    $("#lang-top").appendChild(tb);
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

  // ---------------- 네트워크: 위치 + 채팅을 한 번에 (sync) ----------------
  // 주변에 사람이 있거나 내가 움직이면 자주(0.9초), 혼자 가만히 있으면 드물게(5초) 확인 → 빠르고 저렴
  let syncBusy = false, syncTimer = null, lastSync = 0, lastSent = "";
  function nextSyncDelay() {
    if (document.hidden) return 15000;
    let othersMoving = false;
    for (const o of G.others.values()) if (o.vx || o.vy) { othersMoving = true; break; }
    if (G.player.moving || othersMoving) return 450;              // 누군가 움직이는 중: 빠르게
    if (G.others.size > 0 || Date.now() - G.lastInput < 4000) return 1200; // 주변에 사람만 있을 때
    return 5000;                                                   // 혼자 가만히: 드물게
  }
  function scheduleSync(ms) { clearTimeout(syncTimer); syncTimer = setTimeout(doSync, ms ?? nextSyncDelay()); }
  function kickSync() { if (Date.now() - lastSync > 250) scheduleSync(0); }
  async function doSync() {
    if (G.mode !== "world" || syncBusy) return scheduleSync();
    syncBusy = true; lastSync = Date.now();
    const room = G.scene;
    try {
      const r = await API.sync({ scene: room, x: Math.round(G.player.x), y: Math.round(G.player.y), dir: G.player.dir, seat: G.seat, vx: Math.round(G.player.vx || 0), vy: Math.round(G.player.vy || 0), since: G.chat.since });
      if (room !== G.scene) return;
      applyOthers(r.others || [], r.now);
      if (!API.demo) { G.online = r.online || 1; $("#online").textContent = t("online", { n: G.online }); }
      applyChat(r.messages || [], r.notice);
    } catch (e) {
      if (e.status === 401 && e.code === "gone") { toast(t("e_gone")); return logout(); }
      if (e.status === 401) {
        try { G.user = await API.me(); } catch { return logout(); } // 예전 토큰이면 새 토큰으로 교체
      }
    } finally { syncBusy = false; scheduleSync(); }
  }
  function applyOthers(list, serverNow) {
    const now = Date.now();
    for (const o of list) {
      const ex = G.others.get(o.id);
      const upd = { x: o.x, y: o.y, dir: o.dir, name: o.name, avatar: o.avatar, role: o.role, seat: o.seat || null,
        vx: o.vx || 0, vy: o.vy || 0, age: serverNow ? Math.max(0, serverNow - o.ts) : 0, recv: now, seen: now };
      if (ex) Object.assign(ex, upd);
      else G.others.set(o.id, { ...upd, id: o.id, rx: o.x, ry: o.y });
    }
    // 잠깐 응답에서 빠져도 바로 사라지지 않게 8초 유지 (깜빡임 방지)
    for (const [id, o] of G.others) if (now - o.seen > 8000) G.others.delete(id);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) kickSync(); });
  // 채팅은 5분이 지나면 화면에서 사라짐
  const CHAT_TTL = 5 * 60 * 1000;
  setInterval(() => {
    const cut = Date.now() - CHAT_TTL;
    const keep = [];
    for (const m of G.chat.msgs) { if (m.ts < cut && !m.pending) { m.el && m.el.remove(); } else keep.push(m); }
    G.chat.msgs = keep;
  }, 10000);

  // ---------------- 채팅 (광장 / 팬 라운지, 자동 번역) ----------------
  function resetChat() {
    G.chat = { since: 0, seen: new Set(), msgs: [], notice: null, unread: 0 };
    $("#chat-log").innerHTML = "";
    $("#notice").classList.add("hidden");
    updateBadge();
    kickSync();
  }
  function applyChat(messages, notice) {
    const log = $("#chat-log");
    const atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 40;
    const first = G.chat.since === 0;
    for (const m of messages) {
      G.chat.since = Math.max(G.chat.since, m.ts);
      if (m.ts < Date.now() - CHAT_TTL) continue;
      if (G.chat.seen.has(m.key)) continue;
      G.chat.seen.add(m.key);
      // 내가 보낸 메시지(이미 화면에 먼저 표시됨)면 번역본으로 교체만
      const pend = G.chat.msgs.find((x) => x.pending && x.id === m.id && x.text === m.text);
      if (pend) { Object.assign(pend, m, { pending: false }); pend.el && pend.el.replaceWith(makeChatLine(pend)); continue; }
      G.chat.msgs.push(m);
      if (G.chat.msgs.length > 120) G.chat.msgs.shift();
      addChatLine(m);
      if (!first || Date.now() - m.ts < 8000) G.bubbles.set(m.id, { m, until: Date.now() + 6500 });
      if (!first && m.id !== G.user.id && $("#chat").classList.contains("collapsed")) G.chat.unread++;
    }
    if (G.chat.since === 0) G.chat.since = 1;
    if (atBottom || first) log.scrollTop = log.scrollHeight;
    const nKey = notice ? notice.ts : 0, oKey = G.chat.notice ? G.chat.notice.ts : 0;
    if (nKey !== oKey) { G.chat.notice = notice; renderNotice(); }
    updateBadge();
  }

  function renderNotice() {
    const n = $("#notice"), no = G.chat.notice;
    if (!no) return n.classList.add("hidden");
    n.innerHTML = `📢 <b>${esc(t("noticeLabel"))}</b> ${esc(msgText(no))}${staff(G.user.role) ? ` <span class="del" id="notice-del">✕</span>` : ""}`;
    n.classList.remove("hidden");
    const d = $("#notice-del");
    if (d) d.addEventListener("click", async () => { try { await API.chatDelete("notice/" + G.scene); G.chat.notice = null; renderNotice(); } catch (e) { toast(e.message); } });
  }
  function addChatLine(m) { $("#chat-log").appendChild(makeChatLine(m)); }
  function makeChatLine(m) {
    const d = document.createElement("div");
    m.el = d;
    d.className = "msg" + (m.role === "artist" ? " artist" : m.role === "admin" ? " admin" : "") + (m.id === G.user.id ? " mine" : "");
    const time = new Date(m.ts).toLocaleTimeString(I.lang === "en" ? "en-US" : I.lang === "ja" ? "ja-JP" : "ko-KR", { hour: "2-digit", minute: "2-digit" });
    const shown = msgText(m);
    const isTr = shown !== m.text;
    d.innerHTML = `<b>${esc(m.name)}</b> <span class="txt">${esc(shown)}</span>${isTr ? `<span class="tr" title="${esc(m.text)}">🌐</span>` : ""}<span class="t">${time}</span>${staff(G.user.role) ? `<span class="del">✕</span>` : ""}`;
    if (isTr) {
      let orig = false;
      d.querySelector(".tr").addEventListener("click", () => { orig = !orig; d.querySelector(".txt").textContent = orig ? m.text : shown; d.querySelector(".tr").classList.toggle("on", orig); });
    }
    const del = d.querySelector(".del");
    if (del) del.addEventListener("click", async () => { try { await API.chatDelete(m.key); d.remove(); } catch (e) { toast(e.message); } });
    if (m.pending) d.classList.add("pending");
    return d;
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
  $("#chat-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const inp = $("#chat-input"), text = inp.value.trim();
    if (!text) { if (!IS_TOUCH) inp.blur(); return; }
    inp.value = "";
    const notice = $("#chat-notice").checked;
    // 보내자마자 내 화면에 바로 표시 (번역은 서버에서 끝나면 자동 반영)
    let temp = null;
    if (!notice) {
      temp = { id: G.user.id, name: G.user.nickname, role: G.user.role, text, ts: Date.now(), key: "tmp" + Math.random(), pending: true };
      G.chat.msgs.push(temp); addChatLine(temp);
      G.bubbles.set(G.user.id, { m: temp, until: Date.now() + 6500 });
      $("#chat-log").scrollTop = $("#chat-log").scrollHeight;
    }
    try {
      const r = await API.chatSend(G.scene, text, notice);
      if (notice) { $("#chat-notice").checked = false; toast(t("noticeDone")); G.chat.notice = r.notice; renderNotice(); }
      else if (r.message) { G.chat.seen.add(r.message.key); Object.assign(temp, r.message, { pending: false }); temp.el && temp.el.replaceWith(makeChatLine(temp)); }
      kickSync();
    } catch (err) {
      toast(err.message); inp.value = text;
      if (temp) { temp.el && temp.el.remove(); G.chat.msgs.splice(G.chat.msgs.indexOf(temp), 1); G.bubbles.delete(G.user.id); }
    }
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
    const shopName = (kind, i) => { const it = shopItem(kind, i); return it ? L(it.name) : ""; };
    chipRow("hair", Avatar.HAIRS.map((_, i) => ({ name: t("hairs")[i] || shopName("hair", i) || t("hairsMore")[i - 10] || "?" })), "hair");
    if (draft.avatar.wand === undefined) draft.avatar.wand = 0;
    chipRow("wand", Avatar.WANDS.map((_, i) => ({ name: i ? shopName("wand", i) : t("wandNone") })), "wand");
    chipRow("eye", Avatar.EYES.map((c, i) => ({ c, name: t("eyes")[i] })), "eye", "sw");
    chipRow("hairColor", Avatar.HAIR_COLORS.map((c, i) => ({ ...c, name: t("hairColors")[i] })), "hairColor", "sw");
    chipRow("skin", Avatar.SKINS.map((c, i) => ({ ...c, name: t("skins")[i] })), "skin", "sw");
    const isHost = G.user && G.user.role === "artist";
    const outs = Avatar.OUTFITS.map((o, i) => ({ i, name: t("outfits")[i] || shopName("outfit", i) || o.id, col: o.overall || (o.top === "#f7f5ff" ? o.skirt : o.top), host: !!o.host }));
    chipRow("outfit", outs, "outfit");
    // 호스트 전용 의상: 호스트가 아니면 잠금 표시
    $("#o-outfit").querySelectorAll(".chip").forEach((el, idx) => {
      if (!outs[idx].host) return;
      el.classList.add("host-only"); el.insertAdjacentHTML("beforeend", `<small>${isHost ? "✦" : "🔒"} ${esc(t("hostOnly"))}</small>`);
      if (!isHost) { el.disabled = true; el.title = t("hostOnly"); }
    });
    if (!isHost && outs[draft.avatar.outfit] && outs[draft.avatar.outfit].host) draft.avatar.outfit = 0;
    // 젤리젤리샵 아이템: 산 것만 고를 수 있음
    [["hair", "#o-hair"], ["outfit", "#o-outfit"], ["wand", "#o-wand"]].forEach(([kind, sel]) => {
      $(sel).querySelectorAll(".chip").forEach((el, idx) => {
        const it = shopItem(kind, idx); if (!it) return;
        el.classList.add("shop-only");
        if (!owns(it)) { el.disabled = true; el.title = t("shopLock"); el.insertAdjacentHTML("beforeend", `<small>🛍️ ${esc(t("shopLock"))}</small>`); if ((draft.avatar[kind] | 0) === idx) draft.avatar[kind] = 0; }
        else el.insertAdjacentHTML("beforeend", "<small>✦</small>");
      });
    });
  }
  const DIRS = ["down", "right", "up", "left"];
  function drawPreview() {
    const c = $("#preview"), x = c.getContext("2d");
    x.clearRect(0, 0, 48, 50);
    const now = performance.now();
    Avatar.draw(x, draft.avatar, 24, 47, DIRS[Math.floor(now / 1400) % 4], [1, 0, 3, 0][Math.floor(now / 160) % 4]);
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
    $("#me-name").textContent = G.user.nickname + (G.user.role === "artist" ? " 👑" : G.user.role === "admin" ? " ★" : "");
    const c = $("#me-face"), x = c.getContext("2d");
    x.clearRect(0, 0, c.width, c.height); x.imageSmoothingEnabled = false;
    Avatar.face(x, G.user.avatar, c.width, c.height);
    $("#chat-opts").classList.toggle("hidden", !staff(G.user.role));
    $("#btn-admin").classList.toggle("hidden", !staff(G.user.role));
    renderCoins();
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
    BGM.play(G.scene);
    checkDaily();
    loadMail(true);
    setTimeout(maybeInstallPopup, 5500);
  }
  function logout() {
    API.logout(); G.user = null; G.mode = "title"; G.others.clear(); BGM.play("title");
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

  window.__jelly = { G, runZone: (z) => runZone(z), closeModal: () => closeModal() };
  // ---------------- 시작 ----------------
  (async function boot() {
    I.apply();
    renderTitleLang();
    try { await Promise.race([Promise.all([document.fonts.load("11px Galmuri11"), document.fonts.load("bold 13px Galmuri11")]), new Promise((r) => setTimeout(r, 2500))]); } catch {}
    buildWorlds();
    makeNPCs();
    G.scene = "plaza"; buildMinimap();
    BGM.play("title"); // 로그인 화면 배경음악 (첫 터치 후 재생)
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
