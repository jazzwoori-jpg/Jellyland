/* JELLY LAND — 메인 게임 */
(function () {
  const CFG = window.JELLY_CONFIG;
  const API = window.JellyAPI;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const FONT = "'Galmuri11', 'Galmuri9', 'Apple SD Gothic Neo', monospace";
  const ARTIST_LOOK = { gender: "f", hair: 1, hairColor: 0, skin: 0, outfit: 1 };

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
    bubbles: new Map(), // userId -> {text, until}
    chatSince: 0, chatSeen: new Set(),
    online: 1,
    modalOpen: false,
    t: 0,
  };

  // ---------------- 화면 크기 ----------------
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    VW = window.innerWidth; VH = window.innerHeight;
    canvas.width = Math.round(VW * dpr); canvas.height = Math.round(VH * dpr);
    S = Math.max(1.5, Math.min(4, Math.floor(Math.min(VW / 470, VH / 300) * 2) / 2));
    ctx.imageSmoothingEnabled = false;
  }
  window.addEventListener("resize", resize);
  resize();
  if ("ontouchstart" in window || navigator.maxTouchPoints > 0) document.body.classList.add("touch");

  // ---------------- 토스트 / 페이드 ----------------
  let toastT;
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(() => (t.style.opacity = 0), 2200); }
  const fade = (on) => new Promise((r) => { $("#fade").classList.toggle("on", on); setTimeout(r, 360); });

  // ---------------- 월드 ----------------
  function scene() { return G.worlds[G.scene]; }
  function setScene(id, pos) {
    G.scene = id;
    const w = scene();
    const p = pos || w.spawn;
    G.player.x = p.x; G.player.y = p.y; G.player.dir = pos && pos.dir ? pos.dir : "up";
    G.target = null; G.pendingZone = null; G.others.clear();
    buildMinimap();
    $("#mm-label").textContent = id === "plaza" ? "광장 지도" : "팬 라운지";
    $("#chat").classList.toggle("hidden", id !== "lounge");
    $("#notice").classList.add("hidden");
    if (id === "lounge" && document.body.classList.contains("touch")) { $("#chat").classList.add("collapsed"); $("#chat-toggle").textContent = "▲"; }
    if (id === "lounge") { G.chatSince = 0; G.chatSeen.clear(); $("#chat-log").innerHTML = ""; pollChat(); }
    sendPresence();
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
    const names = ["젤리 주민", "건반 요정", "음표 수집가"];
    G.npcs = names.map((n, i) => ({ name: n, av: Avatar.random(), x: 560 + i * 60, y: 640 + (i % 2) * 40, tx: 0, ty: 0, dir: "down", moving: false, wait: 1 + i, t: 0 }));
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
    if (e.target.tagName === "INPUT") return;
    if (G.modalOpen) { if (e.key === "Escape") closeModal(); return; }
    if (G.mode !== "world") return;
    if (KEYMAP[e.code]) { G.keys.add(KEYMAP[e.code]); G.target = null; e.preventDefault(); }
    if (e.code === "KeyE" || e.code === "Space") { interact(); e.preventDefault(); }
    if (e.code === "Enter" && G.scene === "lounge") { $("#chat-input").focus(); e.preventDefault(); }
  });
  window.addEventListener("keyup", (e) => { if (KEYMAP[e.code]) G.keys.delete(KEYMAP[e.code]); });
  window.addEventListener("blur", () => G.keys.clear());

  const toWorld = (sx, sy) => ({ x: sx / S + G.cam.x, y: sy / S + G.cam.y });
  canvas.addEventListener("pointerdown", (e) => {
    if (G.mode !== "world" || G.modalOpen) return;
    document.activeElement && document.activeElement.blur && document.activeElement.blur();
    const p = toWorld(e.clientX, e.clientY);
    const w = scene();
    // 건물 클릭 → 문 앞으로 이동 후 입장
    if (w.buildings) for (const b of w.buildings) if (p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h + 6) { G.target = { x: b.door.x, y: b.door.y + 6 }; G.pendingZone = b.id; return; }
    if (w.artist && Math.hypot(p.x - w.artist.x, p.y - 12 - w.artist.y) < 18) { G.target = { x: w.artist.x + 10, y: w.artist.y + 26 }; G.pendingZone = "profile"; return; }
    G.target = p; G.pendingZone = null;
  });

  // 가상 조이스틱
  (function joystick() {
    const joy = $("#joy"), knob = joy.querySelector(".knob");
    let id = null, cx = 0, cy = 0;
    joy.addEventListener("pointerdown", (e) => { id = e.pointerId; const r = joy.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; joy.setPointerCapture(id); move(e); G.target = null; });
    joy.addEventListener("pointermove", (e) => { if (e.pointerId === id) move(e); });
    const end = () => { id = null; G.joy.x = G.joy.y = 0; knob.style.transform = ""; };
    joy.addEventListener("pointerup", end); joy.addEventListener("pointercancel", end);
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
    // 다른 플레이어 보간
    for (const o of G.others.values()) {
      const k = Math.min(1, dt * 8);
      const dx = o.x - o.rx, dy = o.y - o.ry;
      o.rx += dx * k; o.ry += dy * k;
      o.walking = Math.hypot(dx, dy) > 0.6;
      if (o.walking) o.t = (o.t || 0) + dt;
    }
    updateNPCs(dt);
    // 영역 감지
    const w = scene();
    let zone = null;
    if (G.mode === "world") for (const z of w.zones) if (p.x > z.x && p.x < z.x + z.w && p.y > z.y && p.y < z.y + z.h) { zone = z; break; }
    if (zone !== G.zone) {
      G.zone = zone;
      const pr = $("#prompt");
      if (zone) { pr.innerHTML = `<kbd>E</kbd>${esc(zone.label)} ${zone.id === "exit" ? "" : zone.id === "profile" || zone.id === "guide" ? "보기" : "들어가기"}`; pr.classList.remove("hidden"); }
      else pr.classList.add("hidden");
    }
    // 카메라
    const vw = VW / S, vh = VH / S;
    let cx = p.x - vw / 2, cy = p.y - 12 - vh / 2;
    if (G.mode === "title") { cx = 640 - vw / 2 + Math.sin(G.t / 9000) * 260; cy = 470 - vh / 2 + Math.cos(G.t / 11000) * 160; }
    if (w.W > vw) cx = Math.max(0, Math.min(w.W - vw, cx)); else cx = (w.W - vw) / 2;
    if (w.H > vh) cy = Math.max(0, Math.min(w.H - vh, cy)); else cy = (w.H - vh) / 2;
    G.cam.x = Math.round(cx * S) / S; G.cam.y = Math.round(cy * S) / S;
  }

  // ---------------- 렌더 ----------------
  const frameOf = (moving, t) => (moving ? [1, 0, 3, 0][Math.floor(t * 8) % 4] : 0);
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
    if (w.artist) chars.push({ y: w.artist.y, x: w.artist.x, name: CFG.artist.name + " ♪", av: ARTIST_LOOK, dir: "down", frame: 0, crown: true, artist: true, bobby: true });
    if (G.scene === "plaza") for (const n of G.npcs) chars.push({ x: n.x, y: n.y, name: n.name, av: n.av, dir: n.dir, frame: frameOf(n.moving, n.t), npc: true });
    for (const o of G.others.values()) chars.push({ x: o.rx, y: o.ry, name: o.name, av: o.avatar, dir: o.dir || "down", frame: frameOf(o.walking, o.t || 0), crown: o.role === "artist", id: o.id, artist: o.role === "artist" });
    if (G.mode === "world") chars.push({ x: G.player.x, y: G.player.y, name: G.user.nickname, av: G.user.avatar, dir: G.player.dir, frame: frameOf(G.player.moving, G.player.t), crown: G.user.role === "artist", me: true, id: G.user.id, artist: G.user.role === "artist" });
    for (const c of chars) list.push({ y: c.y, char: c });
    list.sort((a, b) => a.y - b.y);
    for (const o of list) {
      if (o.char) {
        const c = o.char;
        const by = c.bobby ? (Math.floor(G.t / 500) % 2) : 0;
        Avatar.draw(ctx, c.av, c.x, c.y - by * 0, c.dir, c.bobby ? (by ? 1 : 0) : c.frame, { crown: c.crown });
      } else o.draw(ctx, G.t);
    }
    // 이동 목표 표시
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
    for (const c of chars) {
      const X = sx(c.x), Y = sy(c.y - 27 - (c.crown ? 3 : 0));
      ctx.font = `${c.me || c.artist ? "bold " : ""}12px ${FONT}`;
      const tw = ctx.measureText(c.name).width + 10;
      ctx.fillStyle = c.artist ? "rgba(224,88,140,.92)" : c.me ? "rgba(58,37,48,.85)" : c.npc ? "rgba(79,195,176,.85)" : "rgba(58,37,48,.6)";
      ctx.fillRect(X - tw / 2, Y - 9, tw, 17);
      ctx.fillStyle = "#fff"; ctx.fillText(c.name, X, Y);
      const b = c.id && G.bubbles.get(c.id);
      if (b && b.until > Date.now()) drawBubble(X, Y - 14, b.text);
      if (c.artist && !c.id && G.scene === "plaza" && Math.floor(G.t / 4000) % 3 === 0) drawBubble(X, Y - 14, "JELLY LAND에 온 걸 환영해요! ♪");
    }
    if (G.mode === "world") drawMinimapFrame();
  }
  function drawBubble(X, Y, text) {
    ctx.font = `12px ${FONT}`;
    const lines = wrap(text, 16).slice(0, 3);
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 16, h = lines.length * 16 + 8;
    const x = X - w / 2, y = Y - h;
    ctx.fillStyle = "#3a2530"; ctx.fillRect(x - 2, y - 2, w + 4, h + 4); ctx.fillRect(X - 4, Y, 8, 6);
    ctx.fillStyle = "#fff"; ctx.fillRect(x, y, w, h); ctx.fillRect(X - 2, Y, 4, 4);
    ctx.fillStyle = "#3a2530"; lines.forEach((l, i) => ctx.fillText(l, X, y + 12 + i * 16));
  }
  function wrap(t, n) { const out = []; let s = String(t); while (s.length > n) { out.push(s.slice(0, n)); s = s.slice(n); } out.push(s); return out; }

  // ---------------- 미니맵 ----------------
  let mmBase = null;
  function buildMinimap() {
    const w = scene();
    const mm = $("#minimap");
    const sc = w.id === "plaza" ? 0.25 : 0.4;
    mm.width = Math.round(w.W * sc); mm.height = Math.round(w.H * sc);
    const [c, x] = [document.createElement("canvas"), null];
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
    // 시야 사각형
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
    if (id === "lounge") { await fade(true); setScene("lounge"); await fade(false); toast("💬 팬 라운지에 입장했어요!"); return; }
    if (id === "exit") { const b = G.worlds.plaza.buildings.find((b) => b.id === "lounge"); await fade(true); setScene("plaza", { x: b.door.x, y: b.door.y + 22, dir: "down" }); await fade(false); }
  }

  // ---------------- 모달 콘텐츠 ----------------
  function openModal(title, html, onMount) {
    $("#modal-title").textContent = title;
    $("#modal-body").innerHTML = html;
    $("#modal").classList.remove("hidden");
    G.modalOpen = true; G.keys.clear(); G.joy.x = G.joy.y = 0;
    onMount && onMount($("#modal-body"));
  }
  function closeModal() { $("#modal").classList.add("hidden"); $("#modal-body").innerHTML = ""; G.modalOpen = false; }
  $("#modal-close").addEventListener("click", closeModal);
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });

  function openGallery() {
    const html = `<p style="margin-top:0">📷 조젤리의 순간들을 모아둔 갤러리예요. 사진을 누르면 크게 볼 수 있어요.</p>
      <div class="gallery">${CFG.photos.map((p, i) => `<div class="polaroid" data-i="${i}"><img src="${esc(p.src)}" alt="${esc(p.caption)}" loading="lazy"><p>${esc(p.caption)}</p></div>`).join("")}</div>`;
    openModal("📷 포토 갤러리", html, (el) => el.querySelectorAll(".polaroid").forEach((d) => d.addEventListener("click", () => {
      const p = CFG.photos[+d.dataset.i];
      openModal("📷 포토 갤러리", `<div class="lightbox"><img src="${esc(p.src)}" alt=""><p>${esc(p.caption)}</p><p><button class="btn sm" id="back">◀ 목록으로</button></p></div>`, (e2) => e2.querySelector("#back").addEventListener("click", openGallery));
    })));
  }
  function openAlbums() {
    const html = `<p style="margin-top:0">💿 조젤리의 발매 이력이에요.</p>` + CFG.albums.map((a) => `
      <div class="album"><img src="${esc(a.cover)}" alt=""><div>
        <span class="tag">${esc(a.type)}</span>
        <h3>${esc(a.title)}</h3><p style="margin:0;line-height:1.6">${esc(a.desc)}</p>
        ${a.tracks && a.tracks.length ? `<ol>${a.tracks.map((t) => `<li>${esc(t)}</li>`).join("")}</ol>` : ""}
        ${a.link ? `<p><a class="btn sm pink" href="${esc(a.link)}" target="_blank" rel="noopener">▶ 듣기</a></p>` : ""}
      </div><div class="yr">${esc(a.year)}</div></div>`).join("");
    openModal("💿 앨범 기록관", html);
  }
  function openCinema(idx = 0) {
    const vs = CFG.videos;
    if (!vs.length) return openModal("🎬 젤리 시네마", "<p>등록된 영상이 없어요.</p>");
    const v = vs[idx];
    const html = `<div class="player"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.id)}?rel=0&playsinline=1" title="${esc(v.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>
      <h3 style="margin:12px 0 0">${esc(v.title)}</h3>
      <div class="vlist">${vs.map((x, i) => `<div class="vitem ${i === idx ? "on" : ""}" data-i="${i}"><img src="https://i.ytimg.com/vi/${encodeURIComponent(x.id)}/hqdefault.jpg" alt="" loading="lazy"><p>${esc(x.title)}</p></div>`).join("")}</div>
      <p style="text-align:center"><a class="btn sm" href="${esc(CFG.artist.links.find((l) => l.label === "YouTube")?.url || "#")}" target="_blank" rel="noopener">YouTube 채널 가기 ↗</a></p>`;
    openModal("🎬 젤리 시네마", html, (el) => el.querySelectorAll(".vitem").forEach((d) => d.addEventListener("click", () => openCinema(+d.dataset.i))));
  }
  function openProfile() {
    const a = CFG.artist;
    const html = `<div class="profile"><img src="${esc(a.photo)}" alt="${esc(a.name)}"><div>
      <h2>${esc(a.name)} <span class="en">${esc(a.nameEn)}</span></h2><div class="role">🎹 ${esc(a.title)}</div>
      ${a.bio.map((b) => `<p>${esc(b)}</p>`).join("")}
      <div class="links">${a.links.map((l) => `<a class="btn sm ${l.label === "YouTube" ? "pink" : l.label === "Instagram" ? "grape" : "mint"}" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join("")}</div>
      <div class="links"><button class="btn sm" data-go="gallery">📷 갤러리</button><button class="btn sm" data-go="albums">💿 앨범</button><button class="btn sm" data-go="cinema">🎬 영상</button></div>
    </div></div>`;
    openModal("🎹 조젤리 프로필", html, (el) => el.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => runZone(b.dataset.go))));
  }
  function openGuide() {
    openModal("❔ JELLY LAND 안내", `<ul class="guide">
      <li><b>이동</b> — 방향키 / WASD, 또는 바닥을 클릭(탭)하면 그곳으로 걸어가요. 모바일은 왼쪽 아래 조이스틱!</li>
      <li><b>입장·보기</b> — 건물 문 앞에서 <b>E</b> 또는 <b>스페이스</b> (모바일은 <b>A</b> 버튼). 건물을 클릭해도 자동으로 걸어가 들어가요.</li>
      <li>📷 <b>포토 갤러리</b> — 조젤리 프로필 사진</li>
      <li>💿 <b>앨범 기록관</b> — 앨범 발매 이력</li>
      <li>🎬 <b>젤리 시네마</b> — 유튜브 영상 시청</li>
      <li>💬 <b>팬 라운지</b> — 다른 팬들, 조젤리와 실시간 채팅</li>
      <li>🎹 <b>중앙 무대</b> — 조젤리에게 말을 걸면 프로필을 볼 수 있어요</li>
      <li>🗺 오른쪽 위 지도를 누르면 크게 볼 수 있어요.</li></ul>`);
  }
  $("#btn-help").addEventListener("click", openGuide);

  // ---------------- 네트워크: 접속자 / 채팅 ----------------
  let presBusy = false;
  async function sendPresence() {
    if (G.mode !== "world" || API.demo || presBusy) return;
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
      $("#online").textContent = `🟢 접속 중 ${G.online}명`;
    } catch (e) { if (e.status === 401) return logout(); }
    finally { presBusy = false; }
  }
  setInterval(sendPresence, 1500);

  let chatBusy = false;
  async function pollChat() {
    if (G.mode !== "world" || G.scene !== "lounge" || chatBusy) return;
    chatBusy = true;
    try {
      const r = await API.chatList("lounge", G.chatSince);
      const log = $("#chat-log");
      const atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 30;
      const fresh = G.chatSince > 0;
      for (const m of r.messages) {
        if (G.chatSeen.has(m.key)) continue;
        G.chatSeen.add(m.key);
        G.chatSince = Math.max(G.chatSince, m.ts);
        addChatLine(m);
        if (fresh || Date.now() - m.ts < 8000) G.bubbles.set(m.id, { text: m.text, until: Date.now() + 6000 });
      }
      if (G.chatSince === 0) G.chatSince = 1;
      if (atBottom || !fresh) log.scrollTop = log.scrollHeight;
      const n = $("#notice");
      if (r.notice) { n.innerHTML = `📢 <b>조젤리 공지</b> ${esc(r.notice.text)}`; n.classList.remove("hidden"); } else n.classList.add("hidden");
    } catch (e) { if (e.status === 401) logout(); }
    finally { chatBusy = false; }
  }
  setInterval(pollChat, 2500);
  function addChatLine(m) {
    const d = document.createElement("div");
    d.className = "msg" + (m.role === "artist" ? " artist" : "");
    const time = new Date(m.ts).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    d.innerHTML = `<b>${esc(m.name)}</b> ${esc(m.text)}<span class="t">${time}</span>${G.user.role === "artist" ? `<span class="del" title="삭제">✕</span>` : ""}`;
    const del = d.querySelector(".del");
    if (del) del.addEventListener("click", async () => { try { await API.chatDelete(m.key); d.remove(); } catch (e) { toast(e.message); } });
    $("#chat-log").appendChild(d);
  }
  $("#chat-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const inp = $("#chat-input"), text = inp.value.trim();
    if (!text) { inp.blur(); return; }
    inp.value = "";
    const notice = $("#chat-notice").checked;
    try {
      const r = await API.chatSend("lounge", text, notice);
      if (notice) { $("#chat-notice").checked = false; toast("📢 공지가 등록됐어요"); }
      else G.bubbles.set(G.user.id, { text, until: Date.now() + 6000 });
      pollChat();
    } catch (err) { toast(err.message); }
  });
  $("#chat-head").addEventListener("click", () => { $("#chat").classList.toggle("collapsed"); $("#chat-toggle").textContent = $("#chat").classList.contains("collapsed") ? "▲" : "_"; });

  // ---------------- 캐릭터 만들기 ----------------
  const draft = { nickname: "", avatar: Avatar.random() };
  function chipRow(id, items, key, render) {
    const el = $("#o-" + id);
    el.innerHTML = "";
    items.forEach((it, i) => {
      const v = key === "gender" ? it.v : i;
      const b = document.createElement(render ? "button" : "button");
      b.type = "button";
      b.className = render === "sw" ? "sw" : "chip";
      if (render === "sw") { b.style.background = it.c; b.title = it.name; }
      else b.innerHTML = (it.col ? `<i style="background:${it.col}"></i>` : "") + esc(it.name);
      if (draft.avatar[key] === v) b.classList.add("on");
      b.addEventListener("click", () => { draft.avatar[key] = v; renderCreator(); });
      el.appendChild(b);
    });
  }
  function renderCreator() {
    chipRow("gender", [{ v: "f", name: "여자" }, { v: "m", name: "남자" }], "gender");
    chipRow("hair", Avatar.HAIRS.map((n) => ({ name: n })), "hair");
    chipRow("hairColor", Avatar.HAIR_COLORS, "hairColor", "sw");
    chipRow("skin", Avatar.SKINS, "skin", "sw");
    chipRow("outfit", Avatar.OUTFITS.map((o) => ({ name: o.name, col: o.top === "#f7f4ff" || o.top === "#fff3f6" ? o.bot : o.top })), "outfit");
  }
  const DIRS = ["down", "right", "up", "left"];
  function drawPreview() {
    const c = $("#preview"), x = c.getContext("2d");
    x.clearRect(0, 0, 32, 40);
    const t = performance.now();
    const dir = DIRS[Math.floor(t / 1400) % 4];
    Avatar.draw(x, draft.avatar, 16, 34, dir, [1, 0, 3, 0][Math.floor(t / 160) % 4]);
  }
  function openCreator(editing) {
    G.mode = G.mode === "world" ? "world" : "creator";
    draft.nickname = G.user.nickname || "";
    draft.avatar = G.user.avatar ? { ...G.user.avatar } : Avatar.random();
    $("#nick").value = draft.nickname;
    $("#c-err").textContent = "";
    $("#btn-cancel").classList.toggle("hidden", !editing);
    $("#btn-enter").textContent = editing ? "저장하기 ✓" : "JELLY LAND 입장! ▶";
    renderCreator();
    $("#title").classList.add("hidden");
    $("#creator").classList.remove("hidden");
    G.modalOpen = !!editing;
  }
  $("#btn-rand").addEventListener("click", () => { draft.avatar = Avatar.random(); renderCreator(); });
  $("#btn-cancel").addEventListener("click", () => { $("#creator").classList.add("hidden"); G.modalOpen = false; });
  $("#btn-enter").addEventListener("click", async () => {
    const nick = $("#nick").value.trim();
    if (!nick) { $("#c-err").textContent = "닉네임을 입력해주세요!"; $("#nick").focus(); return; }
    const btn = $("#btn-enter"); btn.disabled = true;
    try {
      G.user = await API.saveAvatar(nick, draft.avatar);
      $("#creator").classList.add("hidden");
      G.modalOpen = false;
      if (G.mode !== "world") enterWorld(); else { refreshMe(); toast("✨ 캐릭터를 저장했어요!"); }
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
    if (f.password.value !== f.password2.value) { er.textContent = "비밀번호가 서로 달라요."; return; }
    btn.disabled = true;
    try { G.user = await API.signup(f.email.value, f.password.value); toast("🎉 가입 완료! 캐릭터를 만들어볼까요?"); afterAuth(); }
    catch (x) { er.textContent = x.message; }
    finally { btn.disabled = false; }
  });
  function afterAuth() { if (!G.user.avatar || !G.user.nickname) openCreator(false); else enterWorld(); }
  $("#btn-continue").addEventListener("click", afterAuth);
  $("#btn-switch").addEventListener("click", () => { API.logout(); G.user = null; showAuthForms(); });
  function showAuthForms() { $("#auth-forms").classList.remove("hidden"); $("#auth-continue").classList.add("hidden"); }

  function refreshMe() {
    $("#me-name").textContent = G.user.nickname + (G.user.role === "artist" ? " 👑" : "");
    const c = $("#me-face"), x = c.getContext("2d");
    x.clearRect(0, 0, 16, 20);
    x.save(); x.translate(0, 0); Avatar.draw(x, G.user.avatar, 8, 22, "down", 0); x.restore();
    $("#chat-opts").classList.toggle("hidden", G.user.role !== "artist");
  }

  async function enterWorld() {
    await fade(true);
    $("#title").classList.add("hidden");
    $("#creator").classList.add("hidden");
    $("#hud").classList.remove("hidden");
    G.mode = "world";
    refreshMe();
    setScene("plaza");
    $("#online").textContent = API.demo ? "데모 모드 (혼자 플레이)" : "🟢 접속 중";
    await fade(false);
    toast(`🍬 ${G.user.nickname}님, JELLY LAND에 오신 걸 환영해요!`);
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
    try { await document.fonts.load("11px Galmuri11"); await document.fonts.load("bold 13px Galmuri11"); } catch {}
    G.worlds.plaza = World.buildPlaza();
    G.worlds.lounge = World.buildLounge();
    makeNPCs();
    G.scene = "plaza"; buildMinimap();
    requestAnimationFrame(loop);
    const demo = await API.init();
    if (demo) $("#demo").classList.remove("hidden");
    if (API.hasToken()) {
      try {
        G.user = await API.me();
        $("#cont-name").textContent = G.user.nickname || G.user.email;
        $("#auth-forms").classList.add("hidden"); $("#auth-continue").classList.remove("hidden");
      } catch { API.logout(); }
    }
  })();
})();
