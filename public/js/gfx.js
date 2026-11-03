/* JELLY LAND 그래픽 효과 — 그림자 · 불빛 · 시간대 색 · 파티클 · 밤 네온 간판
   - 주소 뒤에 ?gfx=off 를 붙이면 원래 화면, ?gfx=low 면 가벼운 효과, ?gfx=on 이면 자동 낮춤 없이 전체 효과
   - ?time=day|dusk|night 로 시간대 고정 (없으면 한국 시간을 따름)
   - 새 그림은 없고, 기존 그림 위에 빛과 그림자만 얹음
   - 그림자·불빛·네온은 world.js 의 물건에 붙어 있음 (sh, li, win, neon) → 물건을 옮기면 함께 따라감
     sh: [dx, dy, 너비, 높이, 깊이] (여러 개면 배열의 배열) · li: [{dx, dy, r, c, sq, lamp}] · neon: { c, dx, dy, rect, col, lift, texts } */
(function () {
  const q = new URLSearchParams(location.search);
  const FORCED = { day: 12, dusk: 18, night: 22 }[q.get("time")];
  const URL_MODE = ["off", "low", "on"].includes(q.get("gfx")) ? q.get("gfx") : null;

  // ---------------- 느린 기기는 효과를 자동으로 낮춤 (며칠 기억) ----------------
  const DROP_KEY = "jl_gfx_drop", DROP_MS = 3 * 24 * 3600 * 1000;
  function storedMode() { try { const s = JSON.parse(localStorage.getItem(DROP_KEY)); if (s && Date.now() - s.t < DROP_MS) return s.m; } catch {} return null; }
  function storeMode(m) { try { localStorage.setItem(DROP_KEY, JSON.stringify({ m, t: Date.now() })); } catch {} }

  // ---------------- 시간대 (야외) ----------------
  // top/bot: 곱하기(multiply)할 바탕색 · lit: 창문·빛무리 세기 · pool: 바닥 불빛 세기 · sun: 그림자 방향과 길이 · sa: 그림자 진하기
  const DAY = { top: [255, 253, 246], bot: [255, 250, 240], lit: 0, pool: 0, sun: [0.42, 0.24], sa: 0.26 };
  const DUSK = { top: [255, 218, 178], bot: [250, 178, 158], lit: 0.55, pool: 0.2, sun: [0.85, 0.3], sa: 0.3 };
  const NIGHT = { top: [72, 80, 160], bot: [84, 86, 164], lit: 1, pool: 1, sun: [-0.2, 0.16], sa: 0.14 };
  const mix = (a, b, k) => a + (b - a) * k;
  const mixArr = (a, b, k) => a.map((v, i) => mix(v, b[i], k));
  // 모든 사람이 같은 시간대를 보도록 한국 시간 기준: 낮 08~16시 · 저녁 16~20시와 06~08시 · 밤 20~06시
  const SEGS = [[0, "night", NIGHT], [6, "dusk", DUSK], [8, "day", DAY], [16, "dusk", DUSK], [20, "night", NIGHT]];
  const FADE_H = 1 / 60; // 경계 시각부터 1분에 걸쳐 바뀜
  const segIndex = (h) => { let i = SEGS.length - 1; while (i > 0 && h < SEGS[i][0]) i--; return i; };
  function outdoorAt(h) {
    const i = segIndex(h), a = SEGS[(i + SEGS.length - 1) % SEGS.length][2], b = SEGS[i][2];
    const k = Math.min(1, (h - SEGS[i][0]) / FADE_H);
    // 그림자는 한 번만 다시 굽도록: 전반에 옅어졌다가 새 방향으로 후반에 진해짐
    const p = { top: mixArr(a.top, b.top, k), bot: mixArr(a.bot, b.bot, k), lit: mix(a.lit, b.lit, k), pool: mix(a.pool, b.pool, k), sun: k < 0.5 ? a.sun : b.sun, sa: k < 0.5 ? a.sa * (1 - 2 * k) : b.sa * (2 * k - 1) };
    p.neon = Math.max(0, Math.min(1, (p.pool - DUSK.pool) / (1 - DUSK.pool))); // 저녁까지는 0, 밤이 되면서 켜짐
    return p;
  }
  // 실내: 해 그림자 없이 위에서 내려오는 짧은 그림자 + 조명. 밤에는 살짝 아늑하게
  const IN_DAY = [255, 250, 240], IN_NIGHT = [206, 178, 178];
  function indoorFrom(o) {
    const c = mixArr(IN_DAY, IN_NIGHT, o.neon);
    return { top: c, bot: c, lit: 0, pool: 0.4 + 0.6 * o.neon, sun: [0.04, 0.2], sa: 0.22, neon: o.neon };
  }
  // 바닷속: 시간과 상관없이 위는 밝고 아래로 갈수록 깊은 색 (물고기가 잘 보이도록 진하지 않게)
  const SEA = { top: [236, 250, 255], bot: [168, 194, 232], lit: 0, pool: 0.8, sun: [0, 0], sa: 0, neon: 0 };
  const kstHour = () => { const d = new Date(Date.now() + 9 * 3600 * 1000); return d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600; }; // 기기 시간대와 상관없이 한국 시간
  const rgb = (a) => `rgb(${a[0] | 0},${a[1] | 0},${a[2] | 0})`;
  function hexRgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }

  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]].map((r) => r.map((v) => (v + 0.5) / 16));
  function mk(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d"); x.imageSmoothingEnabled = false; return [c, x]; }

  // ---------------- 불빛 도장: 부드러운 원 대신 몇 단계로 끊고 경계만 점묘 → 도트 그림에 어울리는 빛 ----------------
  const stamps = new Map();
  function stamp(r, col, squash) {
    const key = r + "|" + col + "|" + squash;
    let c = stamps.get(key); if (c) return c;
    const W = r * 2, H = Math.max(2, Math.round(r * 2 * squash));
    const [cv, x] = mk(W, H), img = x.createImageData(W, H), d = img.data, BANDS = 5;
    for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
      const dx = (xx + 0.5 - W / 2) / (W / 2), dy = (yy + 0.5 - H / 2) / (H / 2), dist = Math.hypot(dx, dy);
      if (dist >= 1) continue;
      const v = Math.pow(1 - dist, 1.25) * BANDS + (BAYER[yy & 3][xx & 3] - 0.5) * 0.9 + 0.5;
      const lv = Math.min(BANDS, Math.floor(v)) / BANDS; if (lv <= 0) continue;
      const i = (yy * W + xx) * 4; d[i] = col[0] * lv; d[i + 1] = col[1] * lv; d[i + 2] = col[2] * lv; d[i + 3] = 255;
    }
    x.putImageData(img, 0, 0); stamps.set(key, cv); return cv;
  }
  function put(x, s, cx, cy, a) { x.globalAlpha = a; x.drawImage(s, Math.round(cx - s.width / 2), Math.round(cy - s.height / 2)); }
  // 네온 간판 둘레의 빛무리 (사각형 바깥으로 번짐)
  const PAD = 12;
  function halo(w, h, col) {
    const key = "h" + w + "|" + h + "|" + col;
    let c = stamps.get(key); if (c) return c;
    const W = w + PAD * 2, H = h + PAD * 2, [cv, x] = mk(W, H), img = x.createImageData(W, H), d = img.data, BANDS = 4;
    for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
      const dx = Math.max(PAD - xx - 0.5, xx + 0.5 - (W - PAD), 0), dy = Math.max(PAD - yy - 0.5, yy + 0.5 - (H - PAD), 0), dist = Math.hypot(dx, dy) / PAD;
      if (dist >= 1 || (dx === 0 && dy === 0)) continue;
      const v = Math.pow(1 - dist, 1.5) * BANDS + (BAYER[yy & 3][xx & 3] - 0.5) * 0.9 + 0.5;
      const lv = Math.min(BANDS, Math.floor(v)) / BANDS; if (lv <= 0) continue;
      const i = (yy * W + xx) * 4; d[i] = col[0] * lv; d[i + 1] = col[1] * lv; d[i + 2] = col[2] * lv; d[i + 3] = 255;
    }
    x.putImageData(img, 0, 0); stamps.set(key, cv); return cv;
  }

  // ---------------- 물건에 붙은 효과 모으기 (장면마다 한 번) ----------------
  function neonGeom(n) {
    const dx = n.dx || 0, dy = n.dy || 0, r = n.rect, l = n.lift || [];
    n.abs = r ? [dx + r[0], dy + r[1], r[2], r[3]] : null;
    n.liftAbs = l.map((a) => [dx + a[0], dy + a[1], a[2], a[3]]);
    n.box = n.abs || n.liftAbs[0];
    n.rgb = hexRgb(n.col); n.spill = n.rgb.map((v) => v * 0.45 | 0);
    n.panel = rgb(n.rgb.map((v) => 14 + v * 0.11));
    n.core = rgb(n.rgb.map((v) => v + (255 - v) * 0.8));
    if (n.c && r) {
      const inside = n.c._texts.filter((t) => t.x >= r[0] && t.x <= r[0] + r[2] && t.y >= r[1] && t.y <= r[1] + r[3]);
      const seen = new Map(); for (const t of inside) seen.set(t.t, t); // 그림자용으로 두 번 쓴 글자는 한 번만
      n.list = [...seen.values()].map((t) => ({ t: t.t, x: dx + t.x, y: dy + t.y, font: t.font, align: t.align, base: t.base }));
    }
  }
  function drawNeon(c, n, a) {
    if (!n.abs) return;
    const [x, y, w, h] = n.abs;
    c.globalAlpha = a;
    c.fillStyle = n.panel; c.fillRect(x, y, w, h);
    c.fillStyle = n.col; c.fillRect(x, y, w, 1); c.fillRect(x, y + h - 1, w, 1); c.fillRect(x, y, 1, h); c.fillRect(x + w - 1, y, 1, h);
    const list = n.texts ? n.texts() : n.list || [];
    for (const r of list) {
      c.font = r.font; c.textAlign = r.align; c.textBaseline = r.base;
      c.fillStyle = n.col;
      for (const [ox, oy] of [[-0.5, 0], [0.5, 0], [0, -0.5], [0, 0.5]]) c.fillText(r.t, r.x + ox, r.y + oy);
      c.fillStyle = n.core; c.fillText(r.t, r.x, r.y);
    }
    c.globalAlpha = 1;
  }
  function collect(w) {
    if (w._fx) return w._fx;
    const f = { casters: [], lights: [], neons: [...(w.neons || [])], lamps: [], wins: [] };
    for (const o of w.objects) {
      if (o.sh) f.casters.push(o);
      if (o.li) for (const l of o.li) { f.lights.push({ o, l }); if (l.lamp) f.lamps.push({ o, l }); }
      if (o.neon) { o.neon.y = o.y + 0.01; f.neons.push(o.neon); }
      if (o.win) f.wins.push(o);
    }
    for (const n of f.neons) {
      neonGeom(n);
      n.obj = { y: n.y || 0, x: n.box[0], draw: (c) => drawNeon(c, n, phaseNow.neon) };
    }
    f.winObjs = f.wins.map((o) => ({ y: o.y + 0.01, x: o.x, draw: (c) => {
      c.globalAlpha = Math.min(1, phaseNow.lit * 1.6); c.fillStyle = "#ffd98a";
      for (const p of o.win.panes) c.fillRect(p[0], p[1], p[2], p[3]);
      c.fillStyle = "#fff0c0"; for (const p of o.win.panes) c.fillRect(p[0], p[1], p[2], 2);
      c.globalAlpha = 1;
    } }));
    return (w._fx = f);
  }

  // ---------------- 그림자: 다각형 → 살짝 번지게 → 점묘로 끊기. 한 번 구워 두고 해 방향이 바뀔 때만 다시 구움 ----------------
  function dither(src, W, H, r) {
    const a = new Uint8ClampedArray(W * H), s = src.data;
    for (let i = 0; i < W * H; i++) a[i] = s[i * 4 + 3];
    const b = new Uint8ClampedArray(W * H), win = r * 2 + 1;
    for (let y = 0; y < H; y++) { let sum = 0, o = y * W; for (let x = -r; x <= r; x++) sum += a[o + Math.min(W - 1, Math.max(0, x))]; for (let x = 0; x < W; x++) { b[o + x] = sum / win; sum += a[o + Math.min(W - 1, x + r + 1)] - a[o + Math.max(0, x - r)]; } }
    for (let x = 0; x < W; x++) { let sum = 0; for (let y = -r; y <= r; y++) sum += b[Math.min(H - 1, Math.max(0, y)) * W + x]; for (let y = 0; y < H; y++) { a[y * W + x] = sum / win; sum += b[Math.min(H - 1, y + r + 1) * W + x] - b[Math.max(0, y - r) * W + x]; } }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4, on = a[y * W + x] / 255 > BAYER[y & 3][x & 3];
      s[i] = 74; s[i + 1] = 30; s[i + 2] = 78; s[i + 3] = on ? 255 : 0;
    }
    return src;
  }
  function castPoly(x, cx, by, cw, ch, depth, sun) {
    const L = ch, ox = sun[0] * L, oy = sun[1] * L, l = cx - cw / 2, rt = cx + cw / 2, side = sun[0] >= 0 ? rt : l;
    x.beginPath(); x.moveTo(l, by); x.lineTo(rt, by); x.lineTo(rt + ox, by + oy); x.lineTo(l + ox, by + oy); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(side, by - depth); x.lineTo(side, by); x.lineTo(side + ox, by + oy); x.lineTo(side + ox, by - depth + oy); x.closePath(); x.fill();
  }
  let shadow = null, shadowKey = "", charShadow = null;
  function bake(w, f, sun) {
    const key = w.id + Math.round(sun[0] * 10) + "," + Math.round(sun[1] * 10);
    if (shadowKey === key) return;
    shadowKey = key;
    const t0 = performance.now();
    const [c, x] = mk(w.W, w.H); x.fillStyle = "#000";
    for (const o of f.casters) for (const s of Array.isArray(o.sh[0]) ? o.sh : [o.sh]) castPoly(x, o.x + s[0], o.y + s[1], s[2], s[3], s[4] == null ? 4 : s[4], sun);
    x.putImageData(dither(x.getImageData(0, 0, w.W, w.H), w.W, w.H, 2), 0, 0);
    // 픽셀을 읽어 본 캔버스는 브라우저가 느린 방식으로 바꿀 수 있어서, 새 캔버스에 옮겨 담아 씀
    const [fresh, fx] = mk(w.W, w.H); fx.drawImage(c, 0, 0); shadow = fresh;
    // 캐릭터 그림자 도장
    const CW = 96, CH = 64, [cc, cx2] = mk(CW, CH); cx2.fillStyle = "#000";
    castPoly(cx2, CW / 2, CH / 2, 11, 30, 0, sun);
    cx2.putImageData(dither(cx2.getImageData(0, 0, CW, CH), CW, CH, 1), 0, 0);
    charShadow = cc;
    Gfx.bakeMs = performance.now() - t0;
  }

  // ---------------- 곱하기 레이어 (세계 1픽셀 = 레이어 1픽셀) ----------------
  let lm = null, lmx = null, lmKey = "", lmT = 0;
  const flick = (t, seed) => 0.92 + 0.08 * Math.sin(t / 700 + seed) * Math.sin(t / 233 + seed * 1.7);
  const LAMP_HEAD = [240, 190, 90];
  const CHAR_GLOW = [92, 66, 22];

  function drawLightmap(ctx, w, f, chars, ph, t, vw, vh) {
    const ox = Math.floor(view.x), oy = Math.floor(view.y), W = Math.ceil(vw) + 2, H = Math.ceil(vh) + 2;
    if (!lm || lm.width !== W || lm.height !== H) { [lm, lmx] = mk(W, H); lmKey = ""; }
    const key = w.id + "|" + ox + "|" + oy + "|" + (ph.top[0] | 0) + "|" + (ph.pool * 50 | 0);
    const now = performance.now();
    if (key !== lmKey || now - lmT > 90) { // 가만히 서 있을 때는 초당 11번만 다시 그림 (배터리 절약)
      lmKey = key; lmT = now;
      const g = lmx.createLinearGradient(0, -oy, 0, w.H - oy);
      g.addColorStop(0, rgb(ph.top)); g.addColorStop(1, rgb(ph.bot));
      lmx.globalCompositeOperation = "source-over"; lmx.globalAlpha = 1; lmx.fillStyle = g; lmx.fillRect(0, 0, W, H);
      lmx.globalCompositeOperation = "lighter";
      const inView = (x, y, r) => x + r > ox && x - r < ox + W && y + r > oy && y - r < oy + H;
      if (ph.pool > 0.01) {
        for (const { o, l } of f.lights) {
          const lx = o.x + (l.dx || 0), ly = o.y + (l.dy || 0);
          if (!inView(lx, ly, l.r)) continue;
          put(lmx, stamp(l.r, l.c, l.sq || 0.62), lx - ox, ly - oy, ph.pool * (l.lamp ? flick(t, lx) : 1));
          if (l.lamp) put(lmx, stamp(13, LAMP_HEAD, 1), lx - ox, ly - 25 - oy, ph.lit);
        }
        for (const c of chars) if (inView(c.x, c.y, 40)) put(lmx, stamp(c.me ? 30 : 20, CHAR_GLOW, 0.9), c.x - ox, c.y - 18 - oy, ph.pool);
      }
      if (ph.lit > 0.01) { // 창문은 어두워지지 않게
        lmx.globalAlpha = ph.lit; lmx.fillStyle = "#fff";
        for (const o of f.wins) for (const r of o.win.rects) if (inView(r[0], r[1], 20)) lmx.fillRect(r[0] - ox, r[1] - oy, r[2], r[3]);
      }
      if (ph.neon > 0.01) { // 네온 간판은 밤에도 어두워지지 않게 + 아래로 번지는 색 빛
        for (const n of f.neons) {
          const b = n.box; if (!inView(b[0], b[1], b[2] + 40)) continue;
          lmx.fillStyle = "#fff"; lmx.globalAlpha = ph.neon;
          if (n.abs) lmx.fillRect(n.abs[0] - ox, n.abs[1] - oy, n.abs[2], n.abs[3]);
          lmx.globalAlpha = ph.neon * 0.75; // 게시판 내용은 눈부시지 않을 만큼만 밝게
          for (const a of n.liftAbs) lmx.fillRect(a[0] - ox, a[1] - oy, a[2], a[3]);
          lmx.globalAlpha = ph.neon;
          put(lmx, stamp(Math.min(70, Math.max(26, Math.round(b[2] * 0.6))), n.spill, 0.8), b[0] + b[2] / 2 - ox, b[1] + b[3] / 2 - oy, ph.neon);
        }
      }
      lmx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(lm, ox, oy);
    ctx.globalCompositeOperation = "source-over";
  }

  // ---------------- 파티클: 낮·저녁은 꽃잎, 저녁·밤은 반딧불 (세계 픽셀에 맞춰 찍음) ----------------
  const petals = [], flies = [];
  for (let i = 0; i < 16; i++) petals.push({ x: Math.random() * 2000, y: Math.random() * 2000, s: 0.6 + Math.random() * 0.7, ph: Math.random() * 6.3, i });
  for (let i = 0; i < 14; i++) flies.push({ x: Math.random() * 2000, y: Math.random() * 2000, ph: Math.random() * 6.3, s: 0.5 + Math.random() * 0.6 });
  const PETALS = ["#ffd1e1", "#ffb8d0", "#ffffff", "#ffc7da"];
  const wrap = (v, o, size) => o + (((v - o) % size) + size) % size;
  let lastP = 0;
  function stepParticles(t) {
    const dt = Math.min(0.05, (t - lastP) / 1000); lastP = t; if (dt <= 0) return;
    for (const p of petals) { p.ph += dt; p.x += (9 + Math.sin(p.ph * 0.7) * 7) * dt * p.s; p.y += (10 + Math.cos(p.ph) * 4) * dt * p.s; }
    for (const f of flies) { f.ph += dt * f.s; f.x += Math.sin(f.ph * 0.9) * 7 * dt; f.y += Math.cos(f.ph * 1.3) * 5 * dt; }
  }
  function drawPetals(ctx, w, ph, vw, vh) {
    if (ph.lit > 0.9) return;
    const cols = w.fx.petals || PETALS;
    for (const p of petals) {
      const x = Math.round(wrap(p.x, view.x - 10, vw + 20)), y = Math.round(wrap(p.y, view.y - 10, vh + 20));
      ctx.fillStyle = cols[p.i % cols.length];
      if (Math.sin(p.ph * 3) > 0) ctx.fillRect(x, y, 2, 1); else ctx.fillRect(x, y, 1, 2);
    }
  }
  function drawFlies(ctx, ph, vw, vh) {
    if (ph.lit < 0.3) return;
    ctx.globalCompositeOperation = "lighter";
    for (const f of flies) {
      const blink = Math.max(0, Math.sin(f.ph * 2.2));
      if (blink < 0.05) continue;
      const x = Math.round(wrap(f.x, view.x - 10, vw + 20)), y = Math.round(wrap(f.y, view.y - 10, vh + 20));
      ctx.globalAlpha = ph.lit * blink * 0.5; ctx.fillStyle = "#b8e860"; ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3);
      ctx.globalAlpha = ph.lit * blink; ctx.fillStyle = "#f4ffb0"; ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  }
  function drawMotes(ctx, col, a, vw, vh) { // 영화관의 먼지 · 바닷속 부유물
    ctx.fillStyle = col;
    for (const f of flies) {
      const x = Math.round(wrap(f.x, view.x - 10, vw + 20)), y = Math.round(wrap(f.y, view.y - 10, vh + 20));
      ctx.globalAlpha = a * (0.4 + 0.6 * Math.abs(Math.sin(f.ph))); ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1;
  }
  const VIS = (x, y, w, h) => x + w > view.x && x < view.x + view.w && y + h > view.y && y < view.y + view.h;
  function drawHalos(ctx, f, ph, t, pool) {
    ctx.globalCompositeOperation = "lighter";
    const r = 22;
    if (ph.lit > 0.05) for (const { o, l } of f.lamps) {
      const lx = o.x + (l.dx || 0), ly = o.y + (l.dy || 0);
      if (!VIS(lx - r, ly - 60, r * 2, 80)) continue;
      put(ctx, stamp(r, [255, 190, 110], 1), lx, ly - 25, 0.34 * ph.lit * flick(t, lx));
      if (pool) put(ctx, stamp(58, [210, 130, 40], 0.62), lx, ly, 0.5 * ph.pool);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  }
  function drawNeonHalos(ctx, f, ph, t) {
    ctx.globalCompositeOperation = "lighter";
    for (const n of f.neons) {
      const b = n.box; if (!VIS(b[0] - PAD, b[1] - PAD, b[2] + PAD * 2, b[3] + PAD * 2)) continue;
      ctx.globalAlpha = ph.neon * (0.72 + 0.08 * Math.sin(t / 900 + b[0]));
      ctx.drawImage(halo(b[2], b[3], n.rgb), b[0] - PAD, b[1] - PAD);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  }

  const view = { x: 0, y: 0, w: 0, h: 0 };
  let phaseNow = outdoorAt(12);
  let gN = 0, gSum = 0;
  const Gfx = {
    mode: URL_MODE || storedMode() || "on",
    bakeMs: 0,
    get on() { return Gfx.mode !== "off"; },
    get low() { return Gfx.mode === "low"; },
    hour: FORCED, // 시험할 때 바꿀 수 있게 열어 둠
    phaseName() { return SEGS[segIndex(Gfx.hour == null ? kstHour() : Gfx.hour)][1]; },
    phase(w) {
      const o = outdoorAt(Gfx.hour == null ? kstHour() : Gfx.hour);
      const kind = w && w.fx ? w.fx.kind : "outdoor";
      if (kind === "indoor") return indoorFrom(o);
      if (kind === "sea") return SEA;
      if (w && w.fx && w.fx.moon && o.neon > 0) { const m = w.fx.moon; o.top = o.top.map((v, i) => v + m[i] * o.neon); o.bot = o.bot.map((v, i) => v + m[i] * o.neon); }
      return o;
    },
    // 원래의 꽃잎·음표를 이 효과가 대신하는지
    replacesAmbient(w) { return !!w.fx && !Gfx.low && w.fx.kind === "outdoor"; },
    // 프레임이 계속 느리면 한 단계씩 낮춤. 바뀌면 true (화면 크기를 다시 계산해야 함)
    guard(dtMs, paused) {
      if (URL_MODE || Gfx.mode === "off") return false;
      if (paused || dtMs > 250) { gN = gSum = 0; return false; } // 화면이 가려졌거나 창이 열려 있으면 재지 않음
      gN++; gSum += dtMs;
      if (gN < 90) return false;
      const avg = gSum / gN; gN = gSum = 0;
      const next = Gfx.mode === "on" && avg > 26 ? "low" : Gfx.mode === "low" && avg > 45 ? "off" : null;
      if (!next) return false;
      Gfx.mode = next; storeMode(next); return true;
    },
    // 바닥 바로 위 · 물건들 아래. 이번 프레임에 함께 그릴 물건(창문·네온)을 돌려줌
    under(ctx, w, cam, vw, vh, chars, t) {
      view.x = cam.x; view.y = cam.y; view.w = vw; view.h = vh;
      stepParticles(t);
      const ph = (phaseNow = Gfx.phase(w)), kind = w.fx.kind, f = collect(w);
      if (Gfx.low) return [];
      if (kind === "outdoor" || kind === "indoor") {
        bake(w, f, ph.sun);
        const sx = Math.max(0, Math.floor(cam.x)), sy = Math.max(0, Math.floor(cam.y)), sw = Math.min(w.W - sx, Math.ceil(vw) + 2), sh = Math.min(w.H - sy, Math.ceil(vh) + 2);
        ctx.globalAlpha = ph.sa;
        if (sw > 0 && sh > 0) ctx.drawImage(shadow, sx, sy, sw, sh, sx, sy, sw, sh);
        for (const c of chars) if (!c.sit) ctx.drawImage(charShadow, Math.round(c.x) - 48, Math.round(c.y) - 32);
        ctx.globalAlpha = 1;
      }
      const extra = [];
      if (ph.lit > 0.05) extra.push(...f.winObjs);
      if (ph.neon > 0.01) for (const n of f.neons) { const b = n.box; if (n.abs && VIS(b[0], b[1], b[2], b[3])) extra.push(n.obj); }
      return extra;
    },
    // 물건들 위 · 낚싯줄 · 이름표 아래
    over(ctx, w, chars, t) {
      const ph = phaseNow, vw = view.w, vh = view.h, kind = w.fx.kind, f = collect(w);
      if (kind === "cinema") return;
      if (Gfx.low) { // 가벼운 경로: 그림자·창문·파티클·불빛 레이어 없이, 단색 곱하기 + 가로등 불빛 + 네온
        if (kind === "sea") return;
        ctx.globalCompositeOperation = "multiply"; ctx.fillStyle = rgb(ph.bot); ctx.fillRect(view.x - 2, view.y - 2, vw + 4, vh + 4); ctx.globalCompositeOperation = "source-over";
        if (ph.lit > 0.05) drawHalos(ctx, f, ph, t, true);
        if (ph.neon > 0.01) for (const n of f.neons) { const b = n.box; if (n.abs && VIS(b[0], b[1], b[2], b[3])) drawNeon(ctx, n, ph.neon); }
        return;
      }
      if (kind === "outdoor") drawPetals(ctx, w, ph, vw, vh);
      drawLightmap(ctx, w, f, chars, ph, t, vw, vh);
      if (ph.lit > 0.05) drawHalos(ctx, f, ph, t);
      if (ph.neon > 0.01) drawNeonHalos(ctx, f, ph, t);
      if (kind === "outdoor") drawFlies(ctx, ph, vw, vh);
      if (kind === "sea") drawMotes(ctx, "#e4fbff", 0.7, vw, vh);
    },
    // 영화관은 자체 조명이 끝난 뒤에 먼지만 얹음
    post(ctx, w) {
      if (w.fx.kind === "cinema" && !Gfx.low) drawMotes(ctx, "#fff0d0", 0.4, view.w, view.h);
    },
  };
  window.Gfx = Gfx;
})();
