/* JELLY LAND 맵 생성 — 광장(plaza) & 팬 라운지(lounge) */
(function () {
  const OUT = "#3a2530";
  const FONT = "'Galmuri11', 'Galmuri9', 'Apple SD Gothic Neo', 'Hiragino Sans', 'Noto Sans JP', monospace";
  const T = (k) => window.I18N.t(k);
  function rng(seed) { return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); }
  // 스프라이트용 캔버스. 글자(fillText)는 그림에 굽지 않고 기억해 두었다가, 화면에 그릴 때 실제 해상도로 다시 그림 → 확대해도 글자가 또렷함
  function cv(w, h) {
    const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d"); x.imageSmoothingEnabled = false;
    c._texts = [];
    x.fillText = (t, px, py) => { c._texts.push({ t: String(t), x: px, y: py, font: x.font, fill: x.fillStyle, align: x.textAlign, base: x.textBaseline }); };
    return [c, x];
  }
  function blitText(ctx, c, dx, dy) {
    if (!c._texts || !c._texts.length) return;
    const a = ctx.textAlign, b = ctx.textBaseline;
    for (const r of c._texts) { ctx.font = r.font; ctx.fillStyle = r.fill; ctx.textAlign = r.align; ctx.textBaseline = r.base; ctx.fillText(r.t, dx + r.x, dy + r.y); }
    ctx.textAlign = a; ctx.textBaseline = b;
  }
  function blit(ctx, c, dx, dy) { ctx.drawImage(c, dx, dy); blitText(ctx, c, dx, dy); }
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

  // ---------------- 공용 스프라이트 ----------------
  function treeSprite(variant) {
    const [c, x] = cv(34, 44);
    const greens = [["#2f6e3a", "#3f8f45", "#5cb152", "#8fd36a"], ["#2c6440", "#3b8452", "#57a862", "#86cf7c"], ["#3a6b2e", "#4f8f3a", "#6fb04b", "#a6d86a"]][variant % 3];
    x.fillStyle = "rgba(25,12,35,.26)"; x.beginPath(); x.ellipse(21, 40, 13, 4, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = OUT; x.fillRect(14, 26, 7, 14);
    x.fillStyle = "#8a5a3a"; x.fillRect(15, 27, 5, 12); x.fillStyle = "#6c4429"; x.fillRect(18, 27, 2, 12);
    const blob = (cx, cy, r, col) => { x.fillStyle = col; for (let yy = -r; yy <= r; yy++) { const w = Math.round(Math.sqrt(r * r - yy * yy)); x.fillRect(cx - w, cy + yy, w * 2, 1); } };
    blob(17, 17, 15, OUT); blob(17, 17, 14, greens[0]); blob(16, 15, 12, greens[1]); blob(14, 12, 8, greens[2]); blob(12, 9, 3, greens[3]);
    if (variant === 1) { x.fillStyle = "#ff8fb8"; [[9, 18], [22, 12], [20, 22], [12, 24]].forEach(([a, b]) => x.fillRect(a, b, 2, 2)); }
    if (variant === 2) { x.fillStyle = "#ffe07a"; [[8, 15], [23, 18], [17, 25]].forEach(([a, b]) => x.fillRect(a, b, 2, 2)); }
    return c;
  }
  const TREES = [0, 1, 2].map(treeSprite);

  function lampSprite() {
    const [c, x] = cv(10, 30);
    x.fillStyle = "rgba(40,30,20,.25)"; x.fillRect(1, 27, 8, 3);
    x.fillStyle = OUT; x.fillRect(4, 8, 2, 20); x.fillRect(2, 26, 6, 2);
    x.fillStyle = OUT; x.fillRect(1, 1, 8, 8); x.fillStyle = "#ffe8a3"; x.fillRect(2, 2, 6, 6); x.fillStyle = "#fff8d8"; x.fillRect(3, 3, 2, 2);
    x.fillStyle = "#e0405a"; x.fillRect(1, 0, 8, 2);
    return c;
  }
  const LAMP = lampSprite();

  function stallSprite(color, stripe, goods) {
    const [c, x] = cv(40, 38);
    x.fillStyle = "rgba(40,30,20,.25)"; x.fillRect(2, 33, 38, 5);
    x.fillStyle = OUT; x.fillRect(2, 16, 36, 20);
    x.fillStyle = "#c98b5a"; x.fillRect(3, 17, 34, 18); x.fillStyle = "#a86d42"; x.fillRect(3, 26, 34, 2);
    goods.forEach((g, i) => { x.fillStyle = g; x.fillRect(6 + i * 8, 20, 5, 5); x.fillStyle = OUT; x.fillRect(6 + i * 8, 25, 5, 1); });
    x.fillStyle = OUT; x.fillRect(4, 8, 2, 10); x.fillRect(34, 8, 2, 10);
    x.fillStyle = OUT; x.fillRect(0, 2, 40, 10);
    for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? stripe : color; x.fillRect(1 + i * 5 - (i === 7 ? 1 : 0), 3, 5, 8); x.fillRect(1 + i * 5, 11, 5, 2); }
    return c;
  }

  function benchSprite() {
    const [c, x] = cv(28, 14);
    x.fillStyle = "rgba(40,30,20,.25)"; x.fillRect(1, 11, 27, 3);
    x.fillStyle = OUT; x.fillRect(0, 0, 28, 11);
    x.fillStyle = "#b8784a"; x.fillRect(1, 1, 26, 3); x.fillRect(1, 5, 26, 3);
    x.fillStyle = "#8f5a34"; x.fillRect(1, 4, 26, 1); x.fillRect(1, 8, 26, 1);
    x.fillStyle = OUT; x.fillRect(2, 9, 2, 4); x.fillRect(24, 9, 2, 4);
    return c;
  }
  const BENCH = benchSprite();

  // ---- 앉을 수 있는 벤치 / 테이블 세트 ----
  const WOOD = "#b8784a", WOOD2 = "#8f5a34", WOOD3 = "#d4955f";
  function benchBack(w, withBack) { // 뒤쪽(등받이 + 앉는 판 윗면) — 캐릭터보다 먼저 그림
    const [c, x] = cv(w, 24);
    if (withBack) {
      x.fillStyle = OUT; x.fillRect(3, 0, 3, 14); x.fillRect(w - 6, 0, 3, 14); x.fillRect(1, 1, w - 2, 11);
      x.fillStyle = WOOD; x.fillRect(2, 2, w - 4, 4); x.fillRect(2, 7, w - 4, 4);
      x.fillStyle = WOOD3; x.fillRect(2, 2, w - 4, 1); x.fillRect(2, 7, w - 4, 1);
    }
    x.fillStyle = OUT; x.fillRect(0, 13, w, 8);
    x.fillStyle = WOOD; x.fillRect(1, 14, w - 2, 6); x.fillStyle = WOOD3; x.fillRect(1, 14, w - 2, 1);
    x.fillStyle = WOOD2; x.fillRect(1, 17, w - 2, 1);
    return c;
  }
  function benchFront(w) { // 앞쪽(앉는 판 앞면 + 다리) — 캐릭터 뒤에 그려서 무릎 앞을 가림
    const [c, x] = cv(w, 12);
    x.fillStyle = "rgba(40,30,20,.22)"; x.fillRect(2, 8, w - 2, 4);
    x.fillStyle = OUT; x.fillRect(0, 0, w, 4); x.fillRect(3, 3, 3, 8); x.fillRect(w - 6, 3, 3, 8);
    x.fillStyle = WOOD2; x.fillRect(1, 1, w - 2, 2);
    x.fillStyle = "#6c4429"; x.fillRect(4, 4, 1, 6); x.fillRect(w - 5, 4, 1, 6);
    return c;
  }
  function tableTop(w, h) {
    const [c, x] = cv(w + 4, h + 10);
    x.fillStyle = "rgba(40,30,20,.25)"; x.fillRect(4, h + 2, w, 7);
    x.fillStyle = OUT; x.fillRect(6, h - 2, 4, 10); x.fillRect(w - 6, h - 2, 4, 10); x.fillRect(0, 0, w + 2, h + 2);
    x.fillStyle = WOOD; x.fillRect(1, 1, w, h);
    x.fillStyle = WOOD3; x.fillRect(1, 1, w, 2);
    x.fillStyle = WOOD2; for (let i = 8; i < h; i += 7) x.fillRect(1, i, w, 1); x.fillRect(1, h - 1, w, 2);
    x.fillStyle = "#fff8ea"; x.fillRect(w / 2 - 6, 5, 12, 8); x.fillStyle = "#ff8fb8"; x.fillRect(w / 2 - 3, 7, 3, 3); x.fillStyle = "#f2c14e"; x.fillRect(w / 2 + 1, 8, 3, 3);
    return c;
  }
  // 2인용 벤치 (앞을 보고 앉음)
  function addBench(objects, colliders, seats, id, bx, by) {
    const W2 = 46, back = benchBack(W2, true), front = benchFront(W2);
    objects.push({ y: by - 8, x: bx, draw: (c) => c.drawImage(back, bx - W2 / 2, by - 20) });
    objects.push({ y: by + 6, x: bx, draw: (c) => c.drawImage(front, bx - W2 / 2, by) });
    colliders.push([bx - W2 / 2, by - 12, W2, 18]);
    seats.push({ id: id + "a", x: bx - 11, y: by + 1, dir: "down", ax: bx - 11, ay: by + 16 }, { id: id + "b", x: bx + 11, y: by + 1, dir: "down", ax: bx + 11, ay: by + 16 });
  }
  // 4인용 테이블 세트 (위쪽 2명은 앞을 보고, 아래쪽 2명은 뒤를 보고 앉음)
  function addTableSet(objects, colliders, seats, id, tx, ty) {
    const TW = 50, TH = 22, tt = tableTop(TW, TH), upB = benchBack(TW, false), upF = benchFront(TW), lowB = benchBack(TW, false);
    objects.push({ y: ty - 26, x: tx, draw: (c) => c.drawImage(upB, tx - TW / 2, ty - 38) });
    objects.push({ y: ty - 19, x: tx, draw: (c) => c.drawImage(upF, tx - TW / 2, ty - 20) });
    objects.push({ y: ty + 12, x: tx, draw: (c) => c.drawImage(tt, tx - TW / 2 - 1, ty - 10) });
    objects.push({ y: ty + 18, x: tx, draw: (c) => c.drawImage(lowB, tx - TW / 2, ty + 5) });
    colliders.push([tx - TW / 2, ty - 30, TW, 58]);
    seats.push(
      { id: id + "a", x: tx - 12, y: ty - 19, dir: "down", ax: tx - 12, ay: ty - 36 },
      { id: id + "b", x: tx + 12, y: ty - 19, dir: "down", ax: tx + 12, ay: ty - 36 },
      { id: id + "c", x: tx - 12, y: ty + 23, dir: "up", ax: tx - 12, ay: ty + 36 },
      { id: id + "d", x: tx + 12, y: ty + 23, dir: "up", ax: tx + 12, ay: ty + 36 },
    );
  }

  function flowerPot(col) {
    const [c, x] = cv(14, 16);
    x.fillStyle = OUT; x.fillRect(2, 8, 10, 8); x.fillStyle = "#d9774f"; x.fillRect(3, 9, 8, 6);
    x.fillStyle = "#3f8f45"; x.fillRect(1, 3, 12, 6); x.fillStyle = col; [[2, 3], [6, 1], [10, 4], [5, 5]].forEach(([a, b]) => x.fillRect(a, b, 3, 3));
    return c;
  }

  // ---------------- 건물 ----------------
  function buildingSprite(b) {
    const W = b.w, H = b.h;
    const [c, x] = cv(W + 8, H + 8);
    const wallTop = Math.round(H * 0.42);
    // 그림자
    x.fillStyle = "rgba(40,30,20,.25)"; x.fillRect(6, H - 2, W, 8);
    // 벽
    x.fillStyle = OUT; x.fillRect(2, wallTop, W, H - wallTop);
    x.fillStyle = b.wall; x.fillRect(3, wallTop + 1, W - 2, H - wallTop - 2);
    x.fillStyle = Avatar.mix(b.wall, "#000000", 0.08); x.fillRect(3, H - 8, W - 2, 6);
    // 목재 기둥
    x.fillStyle = b.trim; for (let i = 0; i <= 4; i++) x.fillRect(3 + Math.round(i * (W - 6) / 4), wallTop + 1, 3, H - wallTop - 2);
    // 창문
    const winY = wallTop + 12;
    for (let i = 0; i < 4; i++) {
      if (i === 1 || i === 2) continue;
      const wx = 12 + Math.round(i * (W - 24) / 3) - (i === 3 ? 16 : 0);
      x.fillStyle = OUT; x.fillRect(wx, winY, 18, 20); x.fillStyle = "#9fdcf2"; x.fillRect(wx + 1, winY + 1, 16, 18);
      x.fillStyle = "#d8f4ff"; x.fillRect(wx + 2, winY + 2, 5, 5); x.fillStyle = OUT; x.fillRect(wx + 8, winY, 2, 20); x.fillRect(wx, winY + 9, 18, 2);
      x.fillStyle = b.roof; x.fillRect(wx - 2, winY + 20, 22, 3); x.fillStyle = "#ff8fb8"; x.fillRect(wx, winY + 18, 3, 2); x.fillRect(wx + 14, winY + 18, 3, 2);
    }
    // 문
    const dw = 24, dh = 30, dx = Math.round(W / 2 - dw / 2) + 2, dy = H - dh;
    x.fillStyle = OUT; x.fillRect(dx - 2, dy - 4, dw + 4, dh + 4);
    x.fillStyle = b.trim; x.fillRect(dx, dy - 2, dw, dh + 2);
    x.fillStyle = "#6a3f28"; x.fillRect(dx + 3, dy + 2, dw - 6, dh - 2);
    x.fillStyle = "#ffd34d"; x.fillRect(dx + dw - 8, dy + 14, 2, 2);
    x.fillStyle = "#ffe8a3"; x.fillRect(dx + 5, dy + 4, dw - 10, 6);
    // 지붕 (젤리 물결)
    const rt = 6;
    x.fillStyle = OUT; x.fillRect(0, rt, W + 4, wallTop - rt + 6);
    for (let yy = rt + 1; yy < wallTop + 4; yy++) {
      const stripe = Math.floor((yy - rt) / 6) % 2;
      x.fillStyle = stripe ? b.roof : Avatar.mix(b.roof, "#ffffff", 0.25);
      x.fillRect(1, yy, W + 2, 1);
    }
    for (let i = 0; i < W; i += 12) { x.fillStyle = OUT; x.fillRect(i + 1, wallTop + 4, 12, 4); x.fillStyle = b.roof; x.fillRect(i + 2, wallTop + 4, 10, 3); }
    x.fillStyle = OUT; x.fillRect(W / 2 - 8, 0, 20, rt + 2); x.fillStyle = b.roof; x.fillRect(W / 2 - 7, 1, 18, rt);
    x.fillStyle = "#fff"; x.fillRect(W / 2 - 4, 2, 4, 2);
    // 가게별 장식
    if (b.deco === "shop") { // 줄무늬 차양 + 진열창 속 옷
      for (let i = 0; i < W - 4; i += 8) { x.fillStyle = OUT; x.fillRect(4 + i, winY - 8, 8, 8); x.fillStyle = (i / 8) % 2 ? "#ffffff" : "#ff7fae"; x.fillRect(5 + i, winY - 7, 7, 6); }
      [[14, "#a77ce0"], [W - 32, "#ffd34d"]].forEach(([wx, col]) => { x.fillStyle = col; x.fillRect(wx + 5, winY + 6, 8, 10); x.fillStyle = "#ffffff"; x.fillRect(wx + 7, winY + 6, 4, 2); });
    }
    if (b.deco === "game") { // 네온 조이스틱 + 별
      x.fillStyle = OUT; x.fillRect(W - 30, winY - 10, 22, 8); x.fillStyle = "#ff7fae"; x.fillRect(W - 29, winY - 9, 20, 6); x.fillStyle = "#fff3a8"; x.fillRect(W - 26, winY - 8, 3, 3); x.fillRect(W - 18, winY - 8, 3, 3);
      [[16, winY - 8], [30, winY - 11], [44, winY - 7]].forEach(([sx0, sy0], k) => { x.fillStyle = ["#fff3a8", "#9fe8ff", "#ff9fc8"][k]; x.fillRect(sx0, sy0 + 1, 5, 1); x.fillRect(sx0 + 2, sy0 - 1, 1, 5); });
    }
    // 간판
    x.font = `11px ${FONT}`; x.textBaseline = "middle";
    const tw = Math.ceil(x.measureText(b.name).width) + 14;
    const sx = Math.round(W / 2 + 2 - tw / 2), sy = wallTop - 16;
    x.fillStyle = OUT; x.fillRect(sx - 1, sy - 1, tw + 2, 17);
    x.fillStyle = "#fff8ea"; x.fillRect(sx, sy, tw, 15);
    x.fillStyle = b.roof; x.fillRect(sx, sy + 13, tw, 2);
    x.fillStyle = OUT; x.fillText(b.name, sx + 7, sy + 7);
    return c;
  }

  // ---------------- 광장 ----------------
  function buildPlaza() {
    const W = 1280, H = 960;
    const CX = 640, CY = 500;
    const gardens = [[420, 380], [860, 380], [420, 650]]; // 젤리게임월드 옆 화단(860,650)은 랭킹 게시판 자리로
    const buildings = [
      { id: "gallery", name: T("bGallery"), x: 250, y: 118, w: 190, h: 130, roof: "#d8434e", wall: "#fffaf2", trim: "#c98b5a", icon: "📷" },
      { id: "albums", name: T("bAlbums"), x: 840, y: 118, w: 190, h: 130, roof: "#a77ce0", wall: "#fffaf2", trim: "#a86d42", icon: "💿" },
      { id: "cinema", name: T("bCinema"), x: 150, y: 420, w: 170, h: 130, roof: "#f2a93b", wall: "#fff6e8", trim: "#8f5a34", icon: "🎬" },
      { id: "lounge", name: T("bLounge"), x: 960, y: 420, w: 176, h: 136, roof: "#5fb8c9", wall: "#fffaf2", trim: "#a86d42", icon: "💬" },
      { id: "shop", name: T("bShop"), x: 170, y: 640, w: 176, h: 130, roof: "#ff7fae", wall: "#fff4f8", trim: "#c98b5a", icon: "🛍️", deco: "shop" },
      { id: "game", name: T("bGame"), x: 934, y: 640, w: 176, h: 130, roof: "#4fc3b0", wall: "#f4fffb", trim: "#8f5a34", icon: "🎮", deco: "game" },
    ];
    // 건물 크기를 조금 줄임 (문 위치·바닥선은 그대로)
    for (const b of buildings) { const nw = Math.round(b.w * 0.76), nh = Math.round(b.h * 0.8); b.x += Math.round((b.w - nw) / 2); b.y += b.h - nh; b.w = nw; b.h = nh; }
    const paving = (x, y) => {
      const dx = Math.abs(x - CX), dy = Math.abs(y - CY);
      let p = (dx <= 520 && dy <= 400 && dx + dy <= 780) || (Math.abs(x - CX) <= 60 && y > CY)
        || (Math.abs(x - CX) <= 46 && y < CY) || (Math.abs(y - CY) <= 44); // 북 · 동 · 서쪽 통로 (북·서는 준비 중)
      if (!p) return false;
      for (const [gx, gy] of gardens) if ((x - gx) ** 2 + (y - gy) ** 2 < 46 * 46) return false;
      return true;
    };
    const inGarden = (x, y) => gardens.some(([gx0, gy0]) => (x - gx0) ** 2 + (y - gy0) ** 2 < 46 * 46);
    const mask = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) mask[y * W + x] = paving(x, y) ? 1 : 0;
    const isP = (x, y) => x >= 0 && y >= 0 && x < W && y < H && mask[y * W + x] === 1;
    // 성벽까지의 거리 (광장 바닥에서 얼마나 떨어졌는지) — 두 번 훑는 거리 변환
    const dist = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) { const x = i % W, y = (i / W) | 0; dist[i] = mask[i] || inGarden(x, y) ? 0 : 1e9; }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (!dist[i]) continue; let v = dist[i];
      if (x > 0) v = Math.min(v, dist[i - 1] + 1); if (y > 0) { v = Math.min(v, dist[i - W] + 1); if (x > 0) v = Math.min(v, dist[i - W - 1] + 1.414); if (x < W - 1) v = Math.min(v, dist[i - W + 1] + 1.414); } dist[i] = v; }
    for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) { const i = y * W + x; if (!dist[i]) continue; let v = dist[i];
      if (x < W - 1) v = Math.min(v, dist[i + 1] + 1); if (y < H - 1) { v = Math.min(v, dist[i + W] + 1); if (x < W - 1) v = Math.min(v, dist[i + W + 1] + 1.414); if (x > 0) v = Math.min(v, dist[i + W - 1] + 1.414); } dist[i] = v; }

    const [g, gx] = cv(W, H);
    const img = gx.createImageData(W, H);
    const d = img.data;
    const r = rng(7);
    const C = {
      grassA: hex("#5aa04a"), grassB: hex("#4c9041"), grassC: hex("#6db85a"),
      pA: hex("#f0e0bf"), pB: hex("#e6d1a6"), pL: hex("#d3b986"), edge: hex("#a8845a"), edge2: hex("#c7a574"),
      wShadow: hex("#3d3448"), wA: hex("#b9b3c6"), wB: hex("#a7a0b6"), wMortar: hex("#7d7690"), wLight: hex("#d6d1e0"), wTop: hex("#c8c2d4"), wGap: hex("#5a5268"),
      wPathA: hex("#8b8499"), wPathB: hex("#81798f"), wPathL: hex("#665f75"),
      brick: hex("#b8473c"), brick2: hex("#cf5f4c"), rim: hex("#7a2f2a"), gold: hex("#f2c14e"), carpet: hex("#c9384a"), center: hex("#f3dcae"), center2: hex("#e7c68d"),
    };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      let col;
      if (!mask[y * W + x] && inGarden(x, y)) {
        const n = r();
        col = n < 0.06 ? C.grassB : n < 0.1 ? C.grassC : C.grassA;
      } else if (!mask[y * W + x]) {
        // ===== 성벽 (광장을 둘러싼 돌벽 + 총안 + 성벽 위 길) =====
        const dd = dist[y * W + x];
        if (dd <= 3) col = C.wShadow;
        else if (dd <= 26) { // 벽면: 벽돌
          const row = Math.floor(y / 7), off = row % 2 ? 7 : 0;
          const mortar = y % 7 === 0 || (x + off) % 14 === 0;
          col = mortar ? C.wMortar : ((Math.floor((x + off) / 14) + row) % 3 === 0 ? C.wB : C.wA);
          if (!mortar && dd < 7) col = C.wLight;
        } else if (dd <= 36) { // 총안(凹凸)
          const merlon = Math.floor((x + y) / 10) % 2 === 0;
          col = merlon ? (dd < 29 ? C.wLight : C.wTop) : C.wGap;
          if (merlon && dd > 34) col = C.wMortar;
        } else { // 성벽 위 돌길 (멀어질수록 어둡게)
          const mortar = x % 18 === 0 || y % 18 === 0;
          const base = mortar ? C.wPathL : (Math.floor(x / 18) + Math.floor(y / 18)) % 2 ? C.wPathA : C.wPathB;
          const k = Math.min(0.55, (dd - 36) / 260);
          col = [base[0] * (1 - k) + 40 * k, base[1] * (1 - k) + 34 * k, base[2] * (1 - k) + 56 * k];
        }
      } else {
        const near = !isP(x - 3, y) || !isP(x + 3, y) || !isP(x, y - 3) || !isP(x, y + 3);
        const near2 = !isP(x - 6, y) || !isP(x + 6, y) || !isP(x, y - 6) || !isP(x, y + 6);
        const u = x + y, v = x - y + 2000;
        if (near) col = C.edge;
        else if (near2) col = C.edge2;
        else if (u % 24 < 2 || v % 24 < 2) col = C.pL;
        else col = (Math.floor(u / 24) + Math.floor(v / 24)) % 2 ? C.pA : C.pB;
        // 중앙 무대 (팔각형 벽돌)
        const dx = Math.abs(x - CX), dy = Math.abs(y - CY);
        const oct = Math.max(dx, dy, (dx + dy) * 0.72);
        if (oct < 118) {
          if (oct > 112) col = C.rim;
          else if (oct > 108) col = C.gold;
          else if (oct < 44) col = oct > 40 ? C.gold : ((Math.floor(x / 6) + Math.floor(y / 6)) % 2 ? C.center : C.center2);
          else {
            const ring = Math.floor(oct / 10) % 2;
            const ang = Math.atan2(y - CY, x - CX);
            const spoke = Math.abs(((ang / (Math.PI / 4)) % 1 + 1) % 1 - 0.5) > 0.47;
            col = spoke ? C.gold : ring ? C.brick : C.brick2;
            if ((x + y * 3) % 7 === 0 && !spoke) col = C.rim;
          }
        }
        // 레드 카펫
        if (Math.abs(x - CX) < 20 && y > CY + 112 && y < 900) col = Math.abs(x - CX) > 17 ? C.gold : C.carpet;
      }
      d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
    }
    gx.putImageData(img, 0, 0);

    // 잔디 위 꽃 점
    const rr = rng(21);
    for (let k = 0; k < 900; k++) {
      const x = (rr() * W) | 0, y = (rr() * H) | 0;
      if (mask[y * W + x] || !inGarden(x, y)) continue;
      gx.fillStyle = ["#ffd1e1", "#fff3a8", "#ffffff", "#f58fb0"][k % 4];
      gx.fillRect(x, y, 2, 2);
    }
    // 정원 화단 테두리
    for (const [cx, cy] of gardens) {
      gx.strokeStyle = "#8a5a3a"; gx.lineWidth = 3; gx.beginPath(); gx.arc(cx, cy, 44, 0, Math.PI * 2); gx.stroke();
      for (let a = 0; a < 18; a++) { gx.fillStyle = ["#ff8fb8", "#ffe07a", "#b58cff"][a % 3]; gx.fillRect(cx + Math.cos(a / 18 * Math.PI * 2) * 34 - 2, cy + Math.sin(a / 18 * Math.PI * 2) * 34 - 2, 4, 4); }
    }

    // 나무: 광장에서 먼 숲은 바닥에 굽고, 가장자리는 오브젝트로
    const objects = [];
    const colliders = [];
    const bRects = buildings.map((b) => [b.x - 10, b.y - 10, b.w + 24, b.h + 20]);
    const inB = (x, y) => bRects.some(([bx, by, bw, bh]) => x > bx && x < bx + bw && y > by && y < by + bh);
    // 성벽 모서리 망루 (분홍 뾰족 지붕 + 깃발)
    const tower = towerSprite();
    [[120, 240], [120, 760], [1160, 240], [1160, 760], [260, 100], [1020, 100], [260, 900], [1020, 900]].forEach(([tx0, ty0]) => {
      const ang = Math.atan2(ty0 - CY, tx0 - CX), tx = Math.round(tx0 + Math.cos(ang) * 40), ty = Math.round(ty0 + Math.sin(ang) * 30);
      objects.push({ y: ty, x: tx, draw: (c) => c.drawImage(tower, tx - 24, ty - 76) });
    });
    // 광장 안 화단: 나무 대신 영롱하게 빛나는 큰 다이아 원석
    for (const [cx, cy] of gardens) objects.push({ y: cy + 12, x: cx, anim: true, draw: (c, t) => drawDiamond(c, cx, cy, t) });

    // 건물
    for (const b of buildings) {
      b.sprite = buildingSprite(b);
      objects.push({ y: b.y + b.h, x: b.x, draw: (c) => blit(c, b.sprite, b.x - 2, b.y) });
      const wt = Math.round(b.h * 0.42);
      colliders.push([b.x, b.y + wt - 10, b.w, b.h - wt + 8]);
      b.door = { x: b.x + b.w / 2, y: b.y + b.h + 4 };
    }

    // 피아노 (무대 중앙)
    // 무대: 피아노(왼쪽) · 호스트 전용 공주 의자(가운데) · "젤리에게 들려줘!" 게시판(오른쪽)
    const PX = CX - 64, PY = CY + 2;
    const piano = pianoSprite();
    objects.push({ y: PY + 6, x: PX, draw: (c) => c.drawImage(piano, PX - 22, PY - 30) });
    colliders.push([PX - 22, PY - 14, 44, 20]);
    const seats = [];
    const TX = CX, TY = CY - 2; // 의자 앉는 자리
    const [thB, thF] = throneSprites();
    objects.push({ y: TY - 8, x: TX, draw: (c) => c.drawImage(thB, TX - 24, TY - 52) });
    objects.push({ y: TY + 8, x: TX, draw: (c) => c.drawImage(thF, TX - 24, TY - 14) });
    colliders.push([TX - 20, TY - 14, 40, 18]);
    seats.push({ id: "throne", x: TX, y: TY + 1, dir: "down", ax: TX, ay: TY + 22, hostOnly: true });
    const RX = CX + 64, RY = CY + 2;
    const recB = recBoardSprite(T("recBoard"));
    objects.push({ y: RY, x: RX, draw: (c) => blit(c, recB, RX - 40, RY - 44) });
    colliders.push([RX - 24, RY - 8, 48, 10]);
    // 랭킹 1위 게시판 (젤리게임월드 옆)
    const BX = 888, BY = 770; // 젤리게임월드 바로 왼쪽, 건물 앞면과 같은 선
    objects.push({ y: BY, x: BX, draw: (c, t) => drawRankBoard(c, BX, BY, t) });
    colliders.push([BX - 56, BY - 14, 112, 16]);

    // 분수 (북쪽)
    const FX = 640, FY = 215;
    objects.push({ y: FY + 20, x: FX, anim: true, draw: (c, t) => drawFountain(c, FX, FY, t) });
    colliders.push([FX - 36, FY - 18, 72, 38]);

    // 가판대
    const stalls = [
      [520, 300, "#ff8fb8", "#fff", ["#ffd34d", "#ff6b6b", "#8fe3cf"]],
      [720, 300, "#9d7cf0", "#fff", ["#ff8fb8", "#ffd34d", "#62c3cf"]],
    ];
    stalls.forEach(([sx, sy, a, s, goods]) => {
      const sp = stallSprite(a, s, goods);
      objects.push({ y: sy + 34, x: sx, draw: (c) => c.drawImage(sp, sx, sy) });
      colliders.push([sx + 2, sy + 16, 36, 20]);
    });

    // 가로등
    [[520, 420], [760, 420], [520, 590], [760, 590], [580, 780], [700, 780], [330, 330], [950, 330], [600, 880], [680, 880]].forEach(([lx, ly]) => {
      objects.push({ y: ly, x: lx, anim: true, draw: (c, t) => {
        c.drawImage(LAMP, lx - 5, ly - 28);
        // 따뜻한 가로등 불빛 (살짝 일렁임)
        const k = 0.75 + 0.25 * Math.sin(t / 700 + lx);
        const g = c.createRadialGradient(lx, ly - 23, 1, lx, ly - 23, 16); g.addColorStop(0, `rgba(255,236,160,${0.55 * k})`); g.addColorStop(1, "rgba(255,236,160,0)");
        c.fillStyle = g; c.fillRect(lx - 16, ly - 39, 32, 32);
      } });
      colliders.push([lx - 3, ly - 3, 6, 4]);
    });
    // 벤치 & 화분
    [[462, 470], [818, 470], [462, 560], [818, 560]].forEach(([bx, by], i) => addBench(objects, colliders, seats, "b" + i, bx, by));
    // 테이블 세트 5개 (광장 바닥 위에 있는지 확인하고 배치)
    const hitC = (x0, y0, w, h) => colliders.some(([a, b, cw, ch]) => x0 < a + cw && x0 + w > a && y0 < b + ch && y0 + h > b) || bRects.some(([a, b, cw, ch]) => x0 < a + cw && x0 + w > a && y0 < b + ch + 20 && y0 + h > b);
    const okArea = (x0, y0, w, h) => { if (hitC(x0, y0, w, h)) return false; for (let yy = y0; yy <= y0 + h; yy += 6) for (let xx = x0; xx <= x0 + w; xx += 6) if (!isP(xx, yy)) return false; return true; };
    const tableSpots = [[335, 330], [945, 330], [300, 640], [985, 640], [530, 700], [750, 700], [640, 360]];
    let tCount = 0;
    for (const [tx, ty] of tableSpots) { if (tCount >= 5) break; if (!okArea(tx - 30, ty - 44, 60, 94)) continue; addTableSet(objects, colliders, seats, "t" + tCount, tx, ty); tCount++; }
    [[560, 860, "#ff8fb8"], [720, 860, "#ffd34d"], [150, 800, "#b58cff"], [1130, 800, "#ff8fb8"], [480, 200, "#ffd34d"], [800, 200, "#b58cff"]].forEach(([px, py, col]) => {
      const sp = flowerPot(col); objects.push({ y: py + 16, x: px, draw: (c) => c.drawImage(sp, px - 7, py) }); colliders.push([px - 6, py + 8, 12, 8]);
    });

    // 남쪽 게이트
    const gate = gateSprite();
    objects.push({ y: 914, x: 640, draw: (c) => blit(c, gate, 640 - 80, 860) });
    colliders.push([560, 900, 18, 14], [702, 900, 18, 14]);

    // 🚧 북쪽 · 서쪽 통로: 아직 준비 중 (바리케이드)
    const barH = (() => { const [c, s2] = cv(104, 40); s2.fillStyle = OUT; s2.fillRect(6, 10, 6, 30); s2.fillRect(92, 10, 6, 30);
      s2.fillStyle = OUT; s2.fillRect(0, 12, 104, 14); for (let k = 0; k < 104; k += 12) { s2.fillStyle = (k / 12) % 2 ? "#ffffff" : "#ff7fae"; s2.fillRect(k + 1, 13, 11, 12); }
      s2.fillStyle = OUT; s2.fillRect(30, 0, 44, 14); s2.fillStyle = "#ffe07a"; s2.fillRect(31, 1, 42, 12); s2.font = `bold 8px ${FONT}`; s2.textAlign = "center"; s2.textBaseline = "middle"; s2.fillStyle = OUT; s2.fillText("🚧 " + T("soonShort"), 52, 7); return c; })();
    objects.push({ y: 44, x: CX, draw: (c) => blit(c, barH, CX - 52, 8) });
    colliders.push([CX - 52, 18, 104, 22]);
    const barV = (() => { const [c, s2] = cv(30, 104); s2.fillStyle = OUT; s2.fillRect(4, 0, 22, 104); for (let k = 0; k < 104; k += 12) { s2.fillStyle = (k / 12) % 2 ? "#ffffff" : "#ff7fae"; s2.fillRect(5, k + 1, 20, 11); } s2.fillStyle = OUT; s2.fillRect(0, 0, 30, 6); s2.fillRect(0, 98, 30, 6); return c; })();
    objects.push({ y: CY + 52, x: 30, draw: (c) => c.drawImage(barV, 18, CY - 52) });
    colliders.push([0, CY - 52, 46, 104]);
    // 🌿 동쪽 통로: 젤리 초원으로 (꽃 아치 + 표지판)
    const arch = (() => { const [c, s2] = cv(40, 120); s2.fillStyle = OUT; s2.fillRect(14, 0, 12, 120); s2.fillStyle = "#3fa04a"; s2.fillRect(15, 0, 10, 120); for (let k = 4; k < 120; k += 10) { s2.fillStyle = ["#ff8fb8", "#ffe07a", "#ffffff"][(k / 10 | 0) % 3]; s2.fillRect(13 + (k % 3) * 4, k, 4, 4); } return c; })();
    objects.push({ y: CY - 48, x: 1200, draw: (c) => c.drawImage(arch, 1180, CY - 150) });
    objects.push({ y: CY + 58, x: 1200, draw: (c) => c.drawImage(arch, 1180, CY - 62) });
    colliders.push([1186, CY - 56, 28, 8], [1186, CY + 50, 28, 8]);
    const eastSign = (() => { const [c, s2] = cv(80, 50); s2.fillStyle = OUT; s2.fillRect(37, 22, 6, 28); s2.fillStyle = "#8f5a34"; s2.fillRect(38, 23, 4, 27);
      s2.fillStyle = OUT; s2.beginPath(); s2.moveTo(0, 2); s2.lineTo(68, 2); s2.lineTo(80, 13); s2.lineTo(68, 24); s2.lineTo(0, 24); s2.closePath(); s2.fill();
      s2.fillStyle = "#8fd474"; s2.beginPath(); s2.moveTo(1, 3); s2.lineTo(67, 3); s2.lineTo(78, 13); s2.lineTo(67, 23); s2.lineTo(1, 23); s2.closePath(); s2.fill();
      let fs = 10; s2.font = `bold ${fs}px ${FONT}`; const tt = "🌿 " + T("mapMeadow"); while (s2.measureText(tt).width > 64 && fs > 6) { fs--; s2.font = `bold ${fs}px ${FONT}`; }
      s2.textAlign = "center"; s2.textBaseline = "middle"; s2.fillStyle = OUT; s2.fillText(tt, 36, 13); return c; })();
    objects.push({ y: CY + 112, x: 1190, draw: (c) => blit(c, eastSign, 1150, CY + 64) });

    // 안내 게시판
    const board = boardSprite(T("zGuide"));
    objects.push({ y: 812, x: 532, draw: (c) => blit(c, board, 492, 748) });
    colliders.push([498, 798, 70, 12]);

    const zones = [
      ...buildings.map((b) => ({ id: b.id, x: b.door.x - 20, y: b.door.y - 8, w: 40, h: 26, label: b.name })),
      { id: "piano", x: PX - 34, y: PY + 6, w: 68, h: 30, label: T("zPiano") },
      { id: "recboard", x: RX - 30, y: RY + 2, w: 60, h: 30, label: T("recBoard") },
      { id: "rankboard", x: BX - 50, y: BY + 2, w: 100, h: 30, label: T("rankBoardZ") },
      { id: "guide", x: 494, y: 810, w: 76, h: 26, label: T("zGuide") },
      { id: "fountain", x: FX - 34, y: FY + 20, w: 68, h: 26, label: T("zFountain") },
    ];

    return {
      id: "plaza", W, H, ground: g, objects, colliders, zones, buildings, seats,
      walkable: (x, y) => isP(x | 0, y | 0),
      spawn: { x: 640, y: 840 },
      artist: null, // 조젤리 NPC 는 없앰 (피아노를 직접 연주)
      piano: { x: PX, y: PY - 10, front: { x: PX, y: PY + 20 } },
      clickables: [{ x: RX, y: RY - 20, r: 24, go: "recboard", front: { x: RX, y: RY + 16 } }, { x: BX, y: BY - 50, r: 56, go: "rankboard", front: { x: BX, y: BY + 16 } }, { x: FX, y: FY - 6, r: 38, go: "fountain", front: { x: FX, y: FY + 32 } }],
      icons: [...buildings.map((b) => ({ x: b.x + b.w / 2 + 2, y: b.y - 4, icon: b.icon, label: b.name })), { x: PX, y: PY - 34, icon: "🎹" }, { x: RX, y: RY - 48, icon: "📼" }, { x: BX, y: BY - 122, icon: "🏆" }, { x: 532, y: 744, icon: "ℹ️" }],
      signs: [{ x: FX, y: FY - 34, key: "fountainSign", bg: "#e8dcfa", type: true }],
      triggers: [{ id: "soonN", x: CX - 50, y: 40, w: 100, h: 34 }, { id: "soonW", x: 44, y: CY - 46, w: 34, h: 92 }, { id: "toMeadow", x: W - 16, y: CY - 46, w: 16, h: 92 }],
      npcArea: [300, 300, 700, 500],
    };
  }

  // 성벽 망루
  function towerSprite() {
    const [c, x] = cv(48, 80);
    x.fillStyle = "rgba(20,10,30,.35)"; x.beginPath(); x.ellipse(26, 76, 22, 5, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = OUT; x.fillRect(5, 30, 38, 46);
    for (let yy = 31; yy < 75; yy++) { const row = Math.floor(yy / 6); for (let xx = 6; xx < 42; xx++) {
      const mortar = yy % 6 === 0 || (xx + (row % 2 ? 5 : 0)) % 10 === 0; const shade = xx > 32 ? 0.82 : xx < 12 ? 1.08 : 1;
      const b = mortar ? [125, 118, 144] : (Math.floor((xx + (row % 2 ? 5 : 0)) / 10) + row) % 3 ? [192, 186, 207] : [170, 163, 186];
      x.fillStyle = `rgb(${Math.min(255, b[0] * shade)},${Math.min(255, b[1] * shade)},${Math.min(255, b[2] * shade)})`; x.fillRect(xx, yy, 1, 1); } }
    x.fillStyle = OUT; x.fillRect(20, 50, 8, 12); x.fillStyle = "#ffe8a3"; x.fillRect(21, 51, 6, 10); x.fillStyle = OUT; x.fillRect(23, 51, 2, 10); // 창문
    x.fillStyle = OUT; x.fillRect(3, 26, 42, 6); x.fillStyle = "#d6d1e0"; x.fillRect(4, 27, 40, 4);
    x.fillStyle = OUT; for (let k = 0; k < 5; k++) x.fillRect(4 + k * 9, 22, 6, 6); x.fillStyle = "#c8c2d4"; for (let k = 0; k < 5; k++) x.fillRect(5 + k * 9, 23, 4, 4);
    // 뾰족 지붕
    for (let yy = 0; yy < 22; yy++) { const w = Math.round(2 + yy * 1.05); x.fillStyle = OUT; x.fillRect(24 - w - 1, 4 + yy, w * 2 + 2, 1); x.fillStyle = yy % 5 === 4 ? "#d84a86" : "#ff7fae"; x.fillRect(24 - w, 4 + yy, w * 2, 1); x.fillStyle = "#ffb8d8"; x.fillRect(24 - w, 4 + yy, Math.max(1, Math.floor(w / 3)), 1); }
    x.fillStyle = OUT; x.fillRect(23, 0, 2, 6); x.fillStyle = "#ffd34d"; x.fillRect(25, 0, 8, 4); x.fillStyle = "#a77ce0"; x.fillRect(25, 2, 8, 2); // 깃발
    return c;
  }
  // 💎 영롱하게 빛나는 큰 다이아 원석 (반짝임 + 빛줄기 + 둥실둥실)
  const DIA = (() => {
    const [c, x] = cv(40, 46);
    const poly = (pts, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) x.lineTo(p[0], p[1]); x.closePath(); x.fill(); };
    poly([[8, 2], [32, 2], [40, 14], [20, 46], [0, 14]], OUT);
    poly([[9, 4], [31, 4], [37, 14], [20, 42], [3, 14]], "#7fe3ff");
    poly([[9, 4], [20, 4], [14, 14], [3, 14]], "#d6f7ff");
    poly([[20, 4], [31, 4], [37, 14], [26, 14]], "#a8ecff");
    poly([[14, 14], [26, 14], [20, 4]], "#ffffff");
    poly([[3, 14], [14, 14], [20, 42]], "#9fd8ff");
    poly([[14, 14], [26, 14], [20, 42]], "#c9b8ff");
    poly([[26, 14], [37, 14], [20, 42]], "#ff9fd8");
    x.fillStyle = "#ffffff"; x.fillRect(10, 6, 3, 2); x.fillRect(8, 16, 2, 6);
    return c;
  })();
  function drawDiamond(c, x, y, t) {
    const bob = Math.sin(t / 600 + x) * 2.5, pulse = 0.5 + 0.5 * Math.sin(t / 420 + y);
    const cy = y - 22 + bob;
    c.save();
    // 바닥 빛
    const g0 = c.createRadialGradient(x, y + 6, 2, x, y + 6, 30);
    g0.addColorStop(0, `rgba(150,235,255,${0.35 + pulse * 0.25})`); g0.addColorStop(1, "rgba(150,235,255,0)");
    c.fillStyle = g0; c.beginPath(); c.ellipse(x, y + 6, 30, 10, 0, 0, Math.PI * 2); c.fill();
    // 후광
    const g = c.createRadialGradient(x, cy, 4, x, cy, 42 + pulse * 8);
    g.addColorStop(0, `rgba(255,255,255,${0.55 + pulse * 0.2})`); g.addColorStop(0.35, `rgba(160,230,255,${0.3 + pulse * 0.15})`); g.addColorStop(0.7, "rgba(255,160,230,.12)"); g.addColorStop(1, "rgba(255,160,230,0)");
    c.fillStyle = g; c.beginPath(); c.arc(x, cy, 50, 0, Math.PI * 2); c.fill();
    // 회전하는 빛줄기
    c.globalCompositeOperation = "lighter";
    for (let k = 0; k < 6; k++) {
      const a = t / 1800 + (k * Math.PI) / 3, len = 34 + Math.sin(t / 300 + k) * 8;
      c.strokeStyle = `rgba(${k % 2 ? "255,200,240" : "180,240,255"},${0.18 + pulse * 0.12})`; c.lineWidth = 3;
      c.beginPath(); c.moveTo(x + Math.cos(a) * 10, cy + Math.sin(a) * 10); c.lineTo(x + Math.cos(a) * len, cy + Math.sin(a) * len); c.stroke();
    }
    c.globalCompositeOperation = "source-over";
    c.imageSmoothingEnabled = false;
    c.drawImage(DIA, Math.round(x - 20), Math.round(cy - 24));
    // 반짝이
    for (let k = 0; k < 5; k++) {
      const ph = (t / 900 + k * 0.37) % 1, sx = x + Math.cos(k * 2.4) * (18 + k * 3), sy = cy - 20 + Math.sin(k * 1.7) * 16 - ph * 10;
      const a = Math.sin(ph * Math.PI);
      c.fillStyle = `rgba(255,255,255,${a})`; c.fillRect(Math.round(sx) - 2, Math.round(sy), 5, 1); c.fillRect(Math.round(sx), Math.round(sy) - 2, 1, 5);
    }
    c.restore();
  }
  // 호스트 전용 공주 의자 (뒤: 등받이 · 앞: 방석 앞면 + 팔걸이 + 다리)
  function throneSprites() {
    const G1 = "#f2c14e", G2 = "#c9982c", G3 = "#fff3a8", V1 = "#ff6fa8", V2 = "#d84a86", V3 = "#ffb8d8";
    const [bc, b] = cv(48, 60);
    b.fillStyle = "rgba(40,30,20,.28)"; b.fillRect(6, 50, 40, 8);
    // 등받이 (아치형 금테 + 핑크 벨벳)
    const arch = (x0, y0, w, h, col) => { b.fillStyle = col; for (let yy = 0; yy < h; yy++) { const k = yy < 10 ? Math.round(Math.sqrt(100 - (10 - yy) * (10 - yy)) * (w / 2) / 10) : w / 2; b.fillRect(24 - k, y0 + yy, k * 2, 1); } };
    arch(0, 6, 40, 38, OUT); arch(0, 7, 38, 36, G1); arch(0, 10, 30, 32, OUT); arch(0, 11, 28, 30, V1);
    b.fillStyle = V2; for (let yy = 16; yy < 40; yy += 7) for (let xx = 13; xx < 36; xx += 7) b.fillRect(xx + ((yy / 7) % 2 ? 3 : 0), yy, 2, 2); // 단추 장식
    b.fillStyle = V3; b.fillRect(14, 14, 3, 18);
    b.fillStyle = G3; b.fillRect(8, 16, 2, 20); b.fillStyle = G2; b.fillRect(38, 16, 2, 22);
    // 왕관 + 하트 보석
    b.fillStyle = OUT; b.fillRect(15, 0, 18, 9); b.fillStyle = G1; b.fillRect(16, 3, 16, 5); for (const dx of [16, 22, 28]) b.fillRect(dx, 1, 4, 3);
    b.fillStyle = "#d8434e"; b.fillRect(22, 4, 4, 3); b.fillStyle = "#6fb8ff"; b.fillRect(17, 5, 2, 2); b.fillStyle = "#8fe07a"; b.fillRect(29, 5, 2, 2);
    b.fillStyle = "#ff3b7f"; b.fillRect(21, 24, 2, 2); b.fillRect(25, 24, 2, 2); b.fillRect(21, 26, 6, 2); b.fillRect(23, 28, 2, 2);
    // 방석 윗면
    b.fillStyle = OUT; b.fillRect(6, 40, 36, 12); b.fillStyle = V1; b.fillRect(7, 41, 34, 10); b.fillStyle = V3; b.fillRect(8, 41, 32, 2);
    const [fc, f] = cv(48, 30);
    // 방석 앞면 + 금색 테두리 + 팔걸이 + 다리
    f.fillStyle = OUT; f.fillRect(6, 10, 36, 9); f.fillStyle = V2; f.fillRect(7, 11, 34, 6); f.fillStyle = G1; f.fillRect(7, 16, 34, 2);
    f.fillStyle = G3; for (let xx = 9; xx < 40; xx += 5) f.fillRect(xx, 17, 2, 1);
    for (const ax of [1, 39]) { f.fillStyle = OUT; f.fillRect(ax, 0, 8, 18); f.fillStyle = G1; f.fillRect(ax + 1, 1, 6, 16); f.fillStyle = G3; f.fillRect(ax + 1, 1, 6, 2); f.fillStyle = "#d8434e"; f.fillRect(ax + 3, 5, 2, 2); f.fillStyle = V1; f.fillRect(ax + 2, 9, 4, 5); }
    f.fillStyle = OUT; for (const lx of [8, 36]) f.fillRect(lx, 18, 4, 10); f.fillStyle = G2; f.fillRect(9, 19, 2, 8); f.fillRect(37, 19, 2, 8);
    return [bc, fc];
  }
  // "젤리에게 들려줘!" 녹음 게시판 (작은 입간판)
  function recBoardSprite(title) {
    const [c, x] = cv(80, 48);
    x.fillStyle = "rgba(40,30,20,.25)"; x.fillRect(8, 42, 66, 5);
    x.fillStyle = OUT; x.fillRect(16, 28, 4, 16); x.fillRect(60, 28, 4, 16); x.fillRect(0, 0, 80, 32);
    x.fillStyle = "#4fc3b0"; x.fillRect(1, 1, 78, 30); x.fillStyle = "#8fe3cf"; x.fillRect(1, 1, 78, 3);
    x.fillStyle = "#fff8ea"; x.fillRect(4, 15, 72, 13);
    x.fillStyle = OUT; x.fillRect(7, 16, 16, 11); x.fillStyle = "#ffd34d"; x.fillRect(8, 17, 14, 9); x.fillStyle = OUT; x.fillRect(10, 20, 3, 3); x.fillRect(17, 20, 3, 3);
    x.fillStyle = "#ff7fae"; for (let i = 0; i < 6; i++) x.fillRect(28 + i * 8, 18 + (i % 2) * 3, 4, 7 - (i % 2) * 3);
    x.font = `bold 10px ${FONT}`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = "#fff";
    let fs = 10; while (x.measureText(title).width > 74 && fs > 6) { fs--; x.font = `bold ${fs}px ${FONT}`; }
    x.fillText(title, 40, 8.5);
    return c;
  }
  // 🏆 점프점프 랭킹 1위 게시판 — 1위가 바뀌면 자동으로 바뀜 (World.rankTops 를 게임에서 채워 줌)
  function drawRankBoard(c, bx, by, t) {
    const W = 116, H = 104, x0 = bx - W / 2, y0 = by - H - 6;
    c.fillStyle = "rgba(40,30,20,.28)"; c.fillRect(x0 + 6, by - 4, W - 4, 8);
    c.fillStyle = OUT; c.fillRect(x0 + 16, by - 30, 6, 30); c.fillRect(x0 + W - 22, by - 30, 6, 30);
    c.fillStyle = "#8f5a34"; c.fillRect(x0 + 17, by - 29, 4, 28); c.fillRect(x0 + W - 21, by - 29, 4, 28);
    c.fillStyle = OUT; c.fillRect(x0, y0, W, H - 18);
    c.fillStyle = "#f2c14e"; c.fillRect(x0 + 1, y0 + 1, W - 2, H - 20);
    c.fillStyle = "#fff3a8"; c.fillRect(x0 + 1, y0 + 1, W - 2, 3);
    c.fillStyle = "#fffaf2"; c.fillRect(x0 + 5, y0 + 18, W - 10, H - 40);
    // 점프점프 1위 → 올라올라 1위 → 젤리 블록 1위 를 6초마다 번갈아 보여 줌 (기록 없는 게임은 건너뜀)
    const tops = window.World.rankTops || {};
    const ORDER = ["jump", "up", "tet", "jx"], have = ORDER.filter((g) => tops[g]);
    const which = have.length ? have[Math.floor(t / 6000) % have.length] : ORDER[Math.floor(t / 6000) % 3];
    const title = T(which === "up" ? "rankBoardUp" : which === "tet" ? "rankBoardTet" : which === "jx" ? "rankBoardJx" : "rankBoard");
    c.fillStyle = which === "up" ? "#8fe07a" : which === "tet" ? "#c9b0ff" : which === "jx" ? "#ffb3d6" : "#f2c14e"; c.fillRect(x0 + 1, y0 + 1, W - 2, 16);
    c.textAlign = "center"; c.textBaseline = "middle";
    let fs = 10; c.font = `bold ${fs}px ${FONT}`; while (c.measureText(title).width > W - 10 && fs > 6) { fs--; c.font = `bold ${fs}px ${FONT}`; }
    c.fillStyle = OUT; c.fillText(title, bx, y0 + 10);
    ORDER.forEach((g, i) => { c.fillStyle = which === g ? OUT : "#c9982c"; c.fillRect(bx - 10 + i * 8, y0 + H - 21, 4, 2); }); // 페이지 표시
    const top = tops[which];
    const cy0 = y0 + 18;
    if (top && top.avatar) {
      // 반짝이는 배경 + 1위 캐릭터 크게 (2배)
      const pulse = Math.sin(t / 300) * 0.5 + 0.5;
      c.fillStyle = `rgba(255,211,77,${0.25 + pulse * 0.25})`; c.beginPath(); c.arc(bx, cy0 + 30, 24, 0, Math.PI * 2); c.fill();
      c.imageSmoothingEnabled = false;
      try { c.drawImage(Avatar.sprite(top.avatar, "down", 0), 0, 0, 48, 48, bx - 30, cy0 - 12, 60, 60); } catch {}
      c.fillStyle = "#d8434e"; c.fillRect(bx - 38, cy0 + 2, 14, 12); c.fillStyle = "#fff"; c.font = `bold 9px ${FONT}`; c.fillText("1", bx - 31, cy0 + 8);
      c.font = `bold 10px ${FONT}`; c.fillStyle = OUT;
      const name = String(top.name || "?"); c.fillText(name.length > 12 ? name.slice(0, 11) + "…" : name, bx, y0 + H - 30);
      c.fillStyle = "#7a3fc0"; c.font = `bold 9px ${FONT}`; c.fillText(`${Number(top.m).toLocaleString()}${which === "tet" || which === "jx" ? " " + T("ptsUnit") : " m"}`, bx, y0 + H - 22 + 2);
    } else {
      c.fillStyle = "#9a8a9a"; c.font = `10px ${FONT}`; c.fillText("?", bx, cy0 + 28);
    }
  }

  function pianoSprite() {
    const [c, x] = cv(44, 40);
    x.fillStyle = "rgba(40,30,20,.3)"; x.fillRect(3, 32, 40, 6);
    x.fillStyle = OUT; x.fillRect(2, 2, 40, 28); x.fillRect(4, 28, 3, 8); x.fillRect(37, 28, 3, 8); x.fillRect(20, 28, 3, 7);
    x.fillStyle = "#2a2433"; x.fillRect(3, 3, 38, 20);
    x.fillStyle = "#4a4258"; x.fillRect(5, 4, 30, 3);
    x.fillStyle = "#fffaf2"; x.fillRect(3, 23, 38, 6);
    x.fillStyle = OUT; for (let i = 0; i < 12; i++) x.fillRect(5 + i * 3, 23, 1, 6);
    x.fillStyle = "#1a1620"; for (let i = 0; i < 12; i++) if (i % 7 !== 2 && i % 7 !== 6) x.fillRect(6 + i * 3, 23, 2, 3);
    x.fillStyle = "#ffd34d"; x.fillRect(18, 10, 8, 1);
    return c;
  }
  function gateSprite() {
    const [c, x] = cv(160, 56);
    x.fillStyle = OUT; x.fillRect(18, 10, 22, 46); x.fillRect(120, 10, 22, 46);
    x.fillStyle = "#fff4e2"; x.fillRect(20, 12, 18, 42); x.fillRect(122, 12, 18, 42);
    x.fillStyle = "#d8434e"; x.fillRect(20, 12, 18, 6); x.fillRect(122, 12, 18, 6);
    x.fillStyle = OUT; x.fillRect(4, 0, 152, 24);
    const grad = ["#a77ce0", "#c3a2f0"];
    for (let i = 0; i < 22; i++) { x.fillStyle = grad[Math.floor(i / 4) % 2]; x.fillRect(5, 1 + i, 150, 1); }
    x.font = `bold 13px ${FONT}`; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillStyle = OUT; x.fillText("JELLY LAND", 81, 13); x.fillStyle = "#fff"; x.fillText("JELLY LAND", 80, 12);
    x.fillStyle = "#ffd34d"; x.fillRect(12, 8, 4, 4); x.fillRect(144, 8, 4, 4);
    return c;
  }
  // 입구 안내판 (크게 + "안내" 머리판)
  function boardSprite(title) {
    const [c, x] = cv(80, 66);
    x.fillStyle = "rgba(40,30,20,.25)"; x.fillRect(6, 58, 72, 7);
    x.fillStyle = OUT; x.fillRect(12, 40, 5, 24); x.fillRect(63, 40, 5, 24);
    x.fillStyle = "#8f5a34"; x.fillRect(13, 41, 3, 22); x.fillRect(64, 41, 3, 22);
    x.fillStyle = OUT; x.fillRect(0, 10, 80, 38);
    x.fillStyle = "#c98b5a"; x.fillRect(1, 11, 78, 36); x.fillStyle = "#e0a877"; x.fillRect(1, 11, 78, 2);
    x.fillStyle = "#fff8ea"; x.fillRect(5, 22, 32, 22); x.fillRect(41, 22, 34, 22);
    x.fillStyle = "#ff8fb8"; x.fillRect(8, 26, 26, 2); x.fillStyle = "#c9b8a8"; for (let i = 0; i < 4; i++) x.fillRect(8, 31 + i * 3, 22 - (i % 2) * 6, 1);
    x.fillStyle = "#9d7cf0"; x.fillRect(44, 26, 28, 2); x.fillStyle = "#c9b8a8"; for (let i = 0; i < 4; i++) x.fillRect(44, 31 + i * 3, 24 - (i % 2) * 8, 1);
    x.fillStyle = "#e0405a"; x.fillRect(19, 21, 3, 3); x.fillRect(56, 21, 3, 3);
    // 머리판: ℹ 안내
    x.fillStyle = OUT; x.fillRect(10, 0, 60, 18); x.fillStyle = "#2f7f95"; x.fillRect(11, 1, 58, 16); x.fillStyle = "#5fb8c9"; x.fillRect(11, 1, 58, 2);
    x.fillStyle = "#fff"; x.beginPath(); x.arc(20, 9, 5, 0, Math.PI * 2); x.fill(); x.fillStyle = "#3a8ea0"; x.fillRect(19, 8, 2, 5); x.fillRect(19, 5, 2, 2);
    x.font = `bold 10px ${FONT}`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = "#fff";
    let fs = 10; while (x.measureText(title).width > 42 && fs > 6) { fs--; x.font = `bold ${fs}px ${FONT}`; }
    x.fillStyle = OUT; x.fillText(title, 47, 10.5); x.fillStyle = "#fff"; x.fillText(title, 46, 9.5);
    return c;
  }
  function drawFountain(c, x, y, t) {
    const ell = (cx, cy, rx, ry, col) => { c.fillStyle = col; for (let yy = -ry; yy <= ry; yy++) { const w = Math.round(rx * Math.sqrt(1 - (yy * yy) / (ry * ry))); c.fillRect(cx - w, cy + yy, w * 2, 1); } };
    ell(x, y + 6, 40, 20, "rgba(40,30,20,.25)");
    ell(x, y, 38, 18, OUT); ell(x, y, 36, 16, "#e9d6b3"); ell(x, y, 30, 12, OUT); ell(x, y, 29, 11, "#7fd3e6");
    const ph = Math.floor(t / 250) % 3;
    c.fillStyle = "#c7f1fa"; [[-18, -3], [12, 2], [-4, 5], [20, -5]].forEach(([a, b], i) => c.fillRect(x + a + ((i + ph) % 3), y + b, 5, 1));
    c.fillStyle = OUT; c.fillRect(x - 5, y - 20, 10, 20); c.fillStyle = "#fff4e2"; c.fillRect(x - 4, y - 19, 8, 18);
    // 젤리 조각상
    ell(x, y - 26, 9, 8, OUT); ell(x, y - 26, 8, 7, "#ff8fb8"); c.fillStyle = "#ffd1e1"; c.fillRect(x - 4, y - 30, 3, 2);
    c.fillStyle = OUT; c.fillRect(x - 3, y - 27, 1, 2); c.fillRect(x + 2, y - 27, 1, 2);
    // 수상한 보랏빛 기운이 스멀스멀
    for (let i = 0; i < 10; i++) { const k = ((t / 1400 + i * 0.37) % 1), px = x + Math.sin(i * 2.3 + t / 700) * (10 + k * 22), py = y - 4 - k * 46; c.fillStyle = `rgba(${i % 2 ? "190,120,255" : "150,90,230"},${(0.75 * (1 - k)).toFixed(2)})`; c.fillRect(Math.round(px), Math.round(py), i % 3 ? 2 : 3, i % 3 ? 2 : 3); }
    // 물줄기
    c.fillStyle = "rgba(199,241,250,.9)";
    for (let i = 0; i < 6; i++) { const k = ((t / 90 + i * 3) % 18); c.fillRect(x - 12 - k * 0.6, y - 30 + k * 1.4, 2, 2); c.fillRect(x + 11 + k * 0.6, y - 30 + k * 1.4, 2, 2); }
  }

  // ---------------- 팬 라운지 (커뮤니티 룸) ----------------
  function buildLounge() {
    const W = 960, H = 420; // 팬 라운지 = ☕ 젤리 카페
    const [g, x] = cv(W, H);
    // 바닥: 크림·살구 체크 타일 (팬 라운지 = 젤리 카페)
    for (let yy = 84; yy < H; yy += 16) for (let xx = 0; xx < W; xx += 16) {
      x.fillStyle = (xx / 16 + (yy - 84) / 16) % 2 ? "#fff3e4" : "#f6d6c2"; x.fillRect(xx, yy, 16, 16);
      x.fillStyle = "rgba(160,100,70,.12)"; x.fillRect(xx, yy + 15, 16, 1);
    }
    // 벽: 민트 줄무늬 + 나무 몰딩
    x.fillStyle = OUT; x.fillRect(0, 0, W, 84);
    for (let xx = 0; xx < W; xx += 16) { x.fillStyle = (xx / 16) % 2 ? "#dff5ec" : "#c8ecdf"; x.fillRect(xx, 0, 16, 70); }
    x.fillStyle = "#8fd3bd"; x.fillRect(0, 64, W, 4);
    x.fillStyle = "#c98b5a"; x.fillRect(0, 70, W, 10); x.fillStyle = "#a86d42"; x.fillRect(0, 78, W, 4);
    // 창문
    [[24, 14], [116, 14], [786, 14], [878, 14]].forEach(([wx, wy]) => {
      x.fillStyle = OUT; x.fillRect(wx, wy, 64, 44); x.fillStyle = "#9fdcf2"; x.fillRect(wx + 2, wy + 2, 60, 40);
      x.fillStyle = "#ffffff"; x.fillRect(wx + 8, wy + 8, 12, 4); x.fillRect(wx + 38, wy + 18, 14, 4);
      x.fillStyle = OUT; x.fillRect(wx + 31, wy, 2, 44); x.fillStyle = "#ff8fb8"; x.fillRect(wx - 4, wy - 4, 72, 6);
    });
    // 메뉴판 (칠판) — 매대 위
    const MB = 396;
    x.fillStyle = OUT; x.fillRect(MB, 2, 168, 52); x.fillStyle = "#8f5a34"; x.fillRect(MB + 2, 4, 164, 48); x.fillStyle = "#2f4a3c"; x.fillRect(MB + 6, 8, 156, 40);
    x.font = `bold 13px ${FONT}`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = "#ffe8a3"; x.fillText("☕ JELLY CAFÉ", MB + 84, 19);
    { let fs = 9; x.font = `${fs}px ${FONT}`; while (x.measureText(T("cafeBoard")).width > 148 && fs > 5) { fs--; x.font = `${fs}px ${FONT}`; } }
    x.fillStyle = "#e8fff4"; x.fillText(T("cafeBoard"), MB + 84, 34);
    [[MB + 12, "#7a4a2a"], [MB + 24, "#ffb347"], [MB + 36, "#ff7fae"], [MB + 132, "#7fc8ff"], [MB + 144, "#9fdc7a"], [MB + 156, "#ffd1e1"]].forEach(([cx0, col]) => { x.fillStyle = "#fff"; x.fillRect(cx0 - 3, 40, 6, 7); x.fillStyle = col; x.fillRect(cx0 - 2, 41, 4, 4); });
    // 액자 (방명록·그림 게시판 위)
    [[260, 14, "#9d7cf0"], [670, 14, "#ffd34d"]].forEach(([px, py, col]) => { x.fillStyle = OUT; x.fillRect(px, py, 30, 38); x.fillStyle = "#c98b5a"; x.fillRect(px + 1, py + 1, 28, 36); x.fillStyle = col; x.fillRect(px + 4, py + 4, 22, 30); x.fillStyle = "#fff"; x.fillRect(px + 9, py + 12, 12, 12); x.fillStyle = OUT; x.fillRect(px + 13, py + 15, 4, 7); });
    // 무대 (피아노) — 왼쪽 위, 나무 무대 + 전구 줄
    x.fillStyle = OUT; x.fillRect(30, 84, 180, 70); x.fillStyle = "#b97a4c"; x.fillRect(32, 84, 176, 66); x.fillStyle = "#d39a68"; x.fillRect(32, 84, 176, 6);
    x.fillStyle = "#9a6038"; for (let k = 50; k < 208; k += 22) x.fillRect(k, 92, 1, 56);
    ["#ffd34d", "#ff8fb8", "#7fe3ff", "#9fdc7a"].forEach((col, i) => { for (let k = 0; k < 3; k++) { x.fillStyle = col; x.fillRect(40 + (i + k * 4) * 14, 146, 6, 3); } });
    // 러그 (가운데)
    x.fillStyle = OUT; x.fillRect(372, 186, 216, 148); x.fillStyle = "#f3a6c0"; x.fillRect(374, 188, 212, 144);
    x.fillStyle = "#ffd1e1"; for (let yy = 196; yy < 326; yy += 16) for (let xx = 382; xx < 578; xx += 16) if (((xx + yy) / 16) % 2) x.fillRect(xx, yy, 6, 6);
    x.fillStyle = "#e07aa0"; x.fillRect(378, 192, 204, 2); x.fillRect(378, 326, 204, 2);
    // 차양 (매대 위, 분홍·하양 줄무늬 + 물결)
    for (let xx = 340; xx < 620; xx += 12) { x.fillStyle = (xx / 12) % 2 ? "#ff8fb8" : "#fff6f0"; x.fillRect(xx, 56, 12, 12); x.beginPath(); x.arc(xx + 6, 68, 6, 0, Math.PI); x.fill(); }
    x.fillStyle = OUT; x.fillRect(338, 54, 284, 2);

    // 출입문
    x.fillStyle = OUT; x.fillRect(456, 402, 48, 18); x.fillStyle = "#6a3f28"; x.fillRect(458, 404, 44, 16); x.fillStyle = "#ffe8a3"; x.fillRect(466, 408, 28, 4);

    const objects = [], colliders = [];
    const piano = pianoSprite();
    objects.push({ y: 136, x: 98, draw: (c) => c.drawImage(piano, 98, 100) });
    colliders.push([98, 110, 44, 22], [0, 0, W, 90]);
    // 소파 (3인용: 등받이·쿠션은 캐릭터 뒤, 앞면·팔걸이는 캐릭터 앞에 그려서 실제로 앉은 느낌)
    const seats = [];
    const sofa = (sx, sy, col, id) => {
      const SW = 78;
      const light = Avatar.mix(col, "#ffffff", 0.28), dark = Avatar.mix(col, "#000000", 0.18);
      const [bc, b] = cv(SW, 24);
      b.fillStyle = "rgba(40,30,20,.25)"; b.fillRect(3, 20, SW - 2, 4);
      b.fillStyle = OUT; b.fillRect(0, 0, SW, 22);
      b.fillStyle = col; b.fillRect(1, 1, SW - 2, 11);
      b.fillStyle = light; b.fillRect(1, 1, SW - 2, 2);
      b.fillStyle = dark; for (let k = 1; k < 3; k++) b.fillRect(Math.round(k * SW / 3), 2, 1, 9); // 등받이 쿠션 3칸
      b.fillStyle = light; b.fillRect(6, 12, SW - 12, 9);
      b.fillStyle = col; for (let k = 1; k < 3; k++) b.fillRect(Math.round(k * SW / 3), 12, 1, 9);
      const [fc, f] = cv(SW, 14);
      f.fillStyle = OUT; f.fillRect(0, 0, 7, 12); f.fillRect(SW - 7, 0, 7, 12); f.fillRect(5, 5, SW - 10, 7);
      f.fillStyle = col; f.fillRect(1, 0, 5, 11); f.fillRect(SW - 6, 0, 5, 11); f.fillRect(6, 6, SW - 12, 5);
      f.fillStyle = light; f.fillRect(1, 0, 5, 2); f.fillRect(SW - 6, 0, 5, 2);
      f.fillStyle = dark; f.fillRect(6, 10, SW - 12, 1);
      f.fillStyle = OUT; f.fillRect(4, 12, 3, 2); f.fillRect(SW - 7, 12, 3, 2);
      objects.push({ y: sy + 6, x: sx, draw: (cc) => cc.drawImage(bc, sx, sy) });
      objects.push({ y: sy + 22, x: sx, draw: (cc) => cc.drawImage(fc, sx, sy + 10) });
      colliders.push([sx, sy + 4, SW, 18]);
      for (let k = 0; k < 3; k++) { const px = sx + 14 + k * 25; seats.push({ id: id + k, x: px, y: sy + 17, dir: "down", ax: px, ay: sy + 30 }); }
    };
    sofa(754, 118, "#9d7cf0", "sA"); sofa(848, 118, "#4fc3b0", "sB"); sofa(34, 352, "#ff7fae", "sC"); sofa(848, 352, "#ffb347", "sD");
    // 방명록 게시판 (큰 보드) — 피아노 무대 왼편
    const gbBoard = (() => {
      const BW = 96, BH = 70;
      const [c, s] = cv(BW, BH);
      s.fillStyle = "rgba(40,30,20,.25)"; s.fillRect(8, BH - 6, BW - 12, 6);
      s.fillStyle = OUT; s.fillRect(14, 44, 6, BH - 8); s.fillRect(BW - 20, 44, 6, BH - 8);
      s.fillStyle = "#8f5a34"; s.fillRect(15, 45, 4, BH - 10); s.fillRect(BW - 19, 45, 4, BH - 10);
      s.fillStyle = OUT; s.fillRect(0, 6, BW, 44);
      s.fillStyle = "#a77ce0"; s.fillRect(2, 8, BW - 4, 40);
      s.fillStyle = "#c3a2f0"; s.fillRect(2, 8, BW - 4, 3);
      s.fillStyle = "#f2c14e"; s.fillRect(2, 45, BW - 4, 3);
      s.fillStyle = "#fffaf2"; s.fillRect(6, 20, BW - 12, 24);
      // 붙어 있는 쪽지들
      [["#ff9fc8", 9, 23], ["#9fe8ff", 30, 25], ["#fff3a8", 51, 22], ["#c3f0c8", 72, 24]].forEach(([col, x0, y0]) => { s.fillStyle = OUT; s.fillRect(x0 - 1, y0 - 1, 17, 16); s.fillStyle = col; s.fillRect(x0, y0, 15, 14); s.fillStyle = "rgba(43,29,42,.35)"; for (let k = 0; k < 3; k++) s.fillRect(x0 + 2, y0 + 3 + k * 3, 11, 1); s.fillStyle = "#d8434e"; s.fillRect(x0 + 6, y0 - 2, 3, 3); });
      // 제목판
      s.fillStyle = OUT; s.fillRect(18, 0, BW - 36, 18); s.fillStyle = "#d8434e"; s.fillRect(19, 1, BW - 38, 16);
      s.font = `bold 11px ${FONT}`; s.textAlign = "center"; s.textBaseline = "middle"; s.fillStyle = "#fff"; s.fillText("✎ " + T("gbBoard"), BW / 2, 10);
      return c;
    })();
    // 🎨 "젤리에게 그려줘!" 그림 갤러리 — 피아노 무대 오른편 (방명록과 대칭)
    const artBoard = (() => {
      const BW = 96, BH = 70;
      const [c, s] = cv(BW, BH);
      s.fillStyle = "rgba(40,30,20,.25)"; s.fillRect(8, BH - 6, BW - 12, 6);
      s.fillStyle = OUT; s.fillRect(14, 44, 6, BH - 8); s.fillRect(BW - 20, 44, 6, BH - 8);
      s.fillStyle = "#8f5a34"; s.fillRect(15, 45, 4, BH - 10); s.fillRect(BW - 19, 45, 4, BH - 10);
      s.fillStyle = OUT; s.fillRect(0, 6, BW, 44);
      s.fillStyle = "#4fb3c9"; s.fillRect(2, 8, BW - 4, 40);
      s.fillStyle = "#8fe0ef"; s.fillRect(2, 8, BW - 4, 3);
      s.fillStyle = "#f2c14e"; s.fillRect(2, 45, BW - 4, 3);
      // 액자 속 그림들
      const pics = [["#ffd34d", (q) => { q.fillStyle = "#ff5a5a"; q.fillRect(4, 4, 6, 6); q.fillStyle = "#34c759"; q.fillRect(2, 11, 14, 2); }],
        ["#9fe8ff", (q) => { q.fillStyle = "#ffcc00"; q.fillRect(9, 2, 5, 5); q.fillStyle = "#1c2e8c"; q.fillRect(2, 9, 14, 4); }],
        ["#ffd1e1", (q) => { q.fillStyle = "#ff3b7a"; q.fillRect(4, 4, 3, 3); q.fillRect(9, 4, 3, 3); q.fillRect(5, 7, 6, 3); q.fillRect(7, 10, 2, 2); }],
        ["#e8ffd8", (q) => { q.fillStyle = "#8e44ad"; q.fillRect(3, 3, 12, 2); q.fillStyle = "#007aff"; q.fillRect(3, 7, 9, 2); q.fillStyle = "#ff9500"; q.fillRect(3, 11, 11, 2); }]];
      pics.forEach(([bg, paint], i) => {
        const x0 = 7 + i * 21, y0 = 21;
        s.fillStyle = OUT; s.fillRect(x0 - 2, y0 - 2, 22, 21); s.fillStyle = "#c98b5a"; s.fillRect(x0 - 1, y0 - 1, 20, 19);
        s.fillStyle = bg; s.fillRect(x0 + 1, y0 + 1, 16, 15);
        s.save(); s.translate(x0 + 1, y0 + 1); paint(s); s.restore();
      });
      s.fillStyle = OUT; s.fillRect(18, 0, BW - 36, 18); s.fillStyle = "#ff7fae"; s.fillRect(19, 1, BW - 38, 16);
      s.textAlign = "center"; s.textBaseline = "middle"; s.fillStyle = "#fff";
      let fs = 11; s.font = `bold ${fs}px ${FONT}`; while (s.measureText(T("artBoard")).width > BW - 44 && fs > 6) { fs--; s.font = `bold ${fs}px ${FONT}`; }
      s.fillText(T("artBoard"), BW / 2, 10);
      return c;
    })();
    const ABX = 636, ABY = 86;
    objects.push({ y: ABY + 68, x: ABX + 48, draw: (c) => blit(c, artBoard, ABX, ABY) });
    colliders.push([ABX + 8, ABY + 44, 80, 24]);
    const GBX = 228, GBY = 86;
    objects.push({ y: GBY + 68, x: GBX + 48, draw: (c) => blit(c, gbBoard, GBX, GBY) });
    colliders.push([GBX + 8, GBY + 44, 80, 24]);
    // ---------- ☕ 젤리 카페: 매대 · 알바생 · 테이블 ----------
    const counter = (() => {
      const CW = 268, CH = 58;
      const [c, s] = cv(CW, CH);
      s.fillStyle = "rgba(40,30,20,.25)"; s.fillRect(4, CH - 4, CW - 4, 4);
      // 윗판 (나무)
      s.fillStyle = OUT; s.fillRect(0, 16, CW, 12); s.fillStyle = "#e8c39a"; s.fillRect(1, 17, CW - 2, 9); s.fillStyle = "#f6dcbc"; s.fillRect(1, 17, CW - 2, 2);
      // 앞판 (분홍 + 크림 줄)
      s.fillStyle = OUT; s.fillRect(2, 27, CW - 4, CH - 31); s.fillStyle = "#ff9fc0"; s.fillRect(3, 28, CW - 6, CH - 33);
      s.fillStyle = "#ffd6e5"; for (let k = 10; k < CW - 6; k += 18) s.fillRect(k, 30, 6, CH - 37);
      s.fillStyle = "#e0789e"; s.fillRect(3, CH - 7, CW - 6, 2);
      s.font = `bold 10px ${FONT}`; s.textAlign = "center"; s.textBaseline = "middle"; s.fillStyle = "#ffffff"; s.fillText("JELLY CAFÉ", CW / 2, 40);
      // 커피 머신
      s.fillStyle = OUT; s.fillRect(12, 0, 34, 18); s.fillStyle = "#c9ced6"; s.fillRect(13, 1, 32, 16); s.fillStyle = "#e9edf2"; s.fillRect(13, 1, 32, 3);
      s.fillStyle = "#3a2530"; s.fillRect(20, 8, 18, 3); s.fillStyle = "#ff5a5a"; s.fillRect(16, 4, 2, 2); s.fillStyle = "#5ad16a"; s.fillRect(40, 4, 2, 2);
      s.fillStyle = "#fff"; s.fillRect(26, 12, 6, 5); s.fillStyle = "#7a4a2a"; s.fillRect(27, 13, 4, 2);
      // 컵 탑
      s.fillStyle = OUT; s.fillRect(54, 4, 10, 13); s.fillStyle = "#fff"; s.fillRect(55, 5, 8, 11); s.fillStyle = "#ff8fb8"; s.fillRect(55, 9, 8, 2);
      // 시럽 병들
      [["#ffb347", 70], ["#ff7fae", 78], ["#7fc8ff", 86]].forEach(([col, bx]) => { s.fillStyle = OUT; s.fillRect(bx, 4, 6, 13); s.fillStyle = col; s.fillRect(bx + 1, 7, 4, 9); s.fillStyle = "#fff"; s.fillRect(bx + 2, 5, 2, 2); });
      // 계산대
      s.fillStyle = OUT; s.fillRect(150, 6, 26, 12); s.fillStyle = "#8fd3bd"; s.fillRect(151, 7, 24, 10); s.fillStyle = "#2f4a3c"; s.fillRect(154, 9, 12, 4); s.fillStyle = "#ffe07a"; s.fillRect(168, 9, 4, 4);
      // 진열장 (젤리 케이크 · 마카롱)
      s.fillStyle = OUT; s.fillRect(188, 0, 72, 18); s.fillStyle = "#dff6ff"; s.fillRect(189, 1, 70, 16); s.fillStyle = "rgba(255,255,255,.7)"; s.fillRect(191, 2, 3, 13);
      [["#ff7fae", 196], ["#ffd34d", 212], ["#9fdc7a", 228], ["#b58cff", 244]].forEach(([col, kx]) => { s.fillStyle = "#fff"; s.fillRect(kx, 11, 12, 3); s.fillStyle = col; s.fillRect(kx + 1, 6, 10, 5); s.fillStyle = "#fff"; s.fillRect(kx + 3, 7, 2, 1); s.fillStyle = "#d8434e"; s.fillRect(kx + 5, 4, 2, 2); });
      return c;
    })();
    const CTX0 = 346, CTY0 = 80;
    objects.push({ y: 136, x: CTX0 + 134, draw: (c) => blit(c, counter, CTX0, CTY0) });
    colliders.push([CTX0 - 6, 84, 280, 54]);
    // 의자 (방향별) · 테이블
    const chairCol = ["#ff8fb8", "#8fd3bd", "#ffd34d", "#b58cff"];
    const chairSpr = {};
    const mkChair = (dir, col) => {
      const key = dir + col; if (chairSpr[key]) return chairSpr[key];
      const [c, s] = cv(22, 30); const dk = Avatar.mix(col, "#000000", 0.2), lt = Avatar.mix(col, "#ffffff", 0.3);
      const X = 11, Y = 22; // 앉는 자리 = (X, Y)
      const leg = (lx) => { s.fillStyle = OUT; s.fillRect(lx, Y + 1, 2, 6); };
      if (dir === "down") { // 등받이가 뒤(위)쪽
        s.fillStyle = OUT; s.fillRect(X - 9, Y - 21, 18, 16); s.fillStyle = col; s.fillRect(X - 8, Y - 20, 16, 14); s.fillStyle = lt; s.fillRect(X - 8, Y - 20, 16, 2); s.fillStyle = dk; s.fillRect(X - 1, Y - 17, 2, 9);
      }
      if (dir === "right" || dir === "left") { // 옆모습: 등받이가 등 쪽에
        const bx = dir === "right" ? X - 9 : X + 6;
        s.fillStyle = OUT; s.fillRect(bx, Y - 18, 4, 20); s.fillStyle = col; s.fillRect(bx + 1, Y - 17, 2, 18);
      }
      s.fillStyle = OUT; s.fillRect(X - 8, Y - 2, 16, 5); s.fillStyle = col; s.fillRect(X - 7, Y - 1, 14, 3); s.fillStyle = lt; s.fillRect(X - 7, Y - 1, 14, 1);
      leg(X - 7); leg(X + 5);
      return (chairSpr[key] = c);
    };
    const mkChairBackFront = (col) => { // 위를 보고 앉는 의자: 등받이가 캐릭터 앞(아래)쪽
      const [c, s] = cv(22, 30); const dk = Avatar.mix(col, "#000000", 0.2), lt = Avatar.mix(col, "#ffffff", 0.3);
      const X = 11, Y = 22;
      s.fillStyle = OUT; s.fillRect(X - 9, Y - 14, 18, 14); s.fillStyle = col; s.fillRect(X - 8, Y - 13, 16, 12); s.fillStyle = lt; s.fillRect(X - 8, Y - 13, 16, 2); s.fillStyle = dk; s.fillRect(X - 8, Y - 3, 16, 2);
      s.fillStyle = OUT; s.fillRect(X - 7, Y, 2, 7); s.fillRect(X + 5, Y, 2, 7);
      return c;
    };
    const chair = (sx, sy, dir, col, id, ax, ay) => {
      if (dir === "up") { const sp = mkChairBackFront(col); objects.push({ y: sy + 1, x: sx, draw: (c) => c.drawImage(sp, sx - 11, sy - 22) }); }
      else { const sp = mkChair(dir, col); objects.push({ y: sy - 0.5, x: sx, draw: (c) => c.drawImage(sp, sx - 11, sy - 22) }); }
      colliders.push([sx - 7, sy - 4, 14, 9]);
      seats.push({ id, x: sx, y: sy, dir, ax, ay });
    };
    const roundTop = (() => { // 2인용 둥근 테이블
      const [c, s] = cv(30, 26);
      s.fillStyle = "rgba(40,30,20,.25)"; s.beginPath(); s.ellipse(16, 23, 10, 3, 0, 0, 7); s.fill();
      s.fillStyle = OUT; s.fillRect(13, 10, 4, 13); s.fillRect(8, 21, 14, 3); s.fillStyle = "#8f5a34"; s.fillRect(14, 11, 2, 11);
      s.fillStyle = OUT; s.beginPath(); s.ellipse(15, 7, 14, 7, 0, 0, 7); s.fill();
      s.fillStyle = "#fff6ea"; s.beginPath(); s.ellipse(15, 6.5, 13, 5.8, 0, 0, 7); s.fill();
      s.fillStyle = "#ffd1e1"; s.fillRect(9, 4, 12, 1); s.fillStyle = "#ff7fae"; s.fillRect(13, 2, 4, 3); s.fillStyle = "#9fdc7a"; s.fillRect(14, 1, 2, 1); // 작은 꽃병
      return c;
    })();
    const squareTop = (() => { // 4인용 네모 테이블
      const [c, s] = cv(50, 30);
      s.fillStyle = "rgba(40,30,20,.25)"; s.fillRect(5, 26, 44, 4);
      s.fillStyle = OUT; s.fillRect(4, 14, 3, 13); s.fillRect(43, 14, 3, 13);
      s.fillStyle = OUT; s.fillRect(0, 0, 50, 20); s.fillStyle = "#e8c39a"; s.fillRect(1, 1, 48, 14); s.fillStyle = "#f6dcbc"; s.fillRect(1, 1, 48, 2); s.fillStyle = "#c99a6c"; s.fillRect(1, 15, 48, 4);
      s.fillStyle = "#fff"; s.fillRect(14, 4, 22, 8); s.fillStyle = "#ff9fc0"; for (let k = 14; k < 36; k += 4) s.fillRect(k, 4, 2, 8); // 테이블 러너
      s.fillStyle = OUT; s.fillRect(22, 1, 6, 6); s.fillStyle = "#ffe07a"; s.fillRect(23, 2, 4, 4); // 작은 캔들
      return c;
    })();
    let tn = 0;
    const table2 = (cx, cy, col) => {
      const id = "t2" + tn++;
      objects.push({ y: cy + 8, x: cx, draw: (c) => c.drawImage(roundTop, cx - 15, cy - 13) });
      colliders.push([cx - 13, cy - 8, 26, 14]);
      chair(cx - 23, cy + 2, "right", col, id + "a", cx - 38, cy + 8);
      chair(cx + 23, cy + 2, "left", col, id + "b", cx + 38, cy + 8);
    };
    const table4 = (cx, cy, col) => {
      const id = "t4" + tn++;
      objects.push({ y: cy + 12, x: cx, draw: (c) => c.drawImage(squareTop, cx - 25, cy - 12) });
      colliders.push([cx - 25, cy - 10, 50, 22]);
      chair(cx, cy - 11, "down", col, id + "a", cx, cy - 30);
      chair(cx, cy + 24, "up", col, id + "b", cx, cy + 38);
      chair(cx - 34, cy + 3, "right", col, id + "c", cx - 50, cy + 8);
      chair(cx + 34, cy + 3, "left", col, id + "d", cx + 50, cy + 8);
    };
    table2(92, 228, chairCol[1]); table4(250, 228, chairCol[0]); table4(710, 228, chairCol[3]); table2(868, 228, chairCol[2]);
    table2(250, 330, chairCol[2]); table2(710, 330, chairCol[1]);
    // 알바생 NPC (매대 뒤)
    const staffOutfit = Math.max(0, Avatar.OUTFITS.findIndex((o) => o.id === "cherry"));
    const staff = { x: 480, y: 104, dir: "down", nameKey: "cafeStaff", linesKey: "cafeLines", welcomeKey: "cafeWelcome", thanksKey: "cafeThanks", av: { gender: "f", hair: 2, hairColor: 1, skin: 1, outfit: staffOutfit, eye: 0, wand: 0 } };

    [[16, 170, "#b58cff"], [944, 170, "#9fdc7a"], [20, 392, "#ffd34d"], [940, 392, "#ff8fb8"], [150, 392, "#ff8fb8"], [810, 392, "#b58cff"]].forEach(([px, py, col]) => { const sp = flowerPot(col); objects.push({ y: py + 16, x: px, draw: (c) => c.drawImage(sp, px - 7, py) }); colliders.push([px - 7, py + 6, 14, 10]); });

    const collide = (px, py) => colliders.some(([a, b, w, h]) => px > a && px < a + w && py > b && py < b + h);
    return {
      id: "lounge", W, H, ground: g, objects, colliders: [], zones: [{ id: "exit", x: 450, y: 388, w: 60, h: 32, label: T("zExit") }, { id: "guestbook", x: GBX - 6, y: 150, w: 108, h: 30, label: T("zGuestbook") }, { id: "piano", x: 88, y: 132, w: 64, h: 22, label: T("zPiano") }, { id: "art", x: ABX - 6, y: 150, w: 108, h: 30, label: T("zArt") }, { id: "cafe", x: 444, y: 138, w: 72, h: 26, label: T("zCafe") }], seats, staff,
      walkable: (px, py) => px > 10 && px < W - 10 && py > 92 && py < H - 4 && !collide(px, py),
      spawn: { x: 480, y: 380 }, artist: null, piano: { x: 120, y: 118, front: { x: 120, y: 142 } }, icons: [{ x: GBX + 48, y: 84, icon: "✍️" }, { x: 120, y: 96, icon: "🎹" }, { x: ABX + 48, y: 84, icon: "🎨" }, { x: 410, y: 84, icon: "☕" }], signs: [{ x: GBX + 48, y: 76, key: "gbSign" }, { x: ABX + 48, y: 76, key: "artSign" }],
      clickables: [{ x: 480, y: 96, r: 34, go: "cafe", front: { x: 480, y: 150 } }, { x: ABX + 48, y: 120, r: 40, go: "art", front: { x: ABX + 48, y: 164 } }, { x: GBX + 48, y: 120, r: 40, go: "guestbook", front: { x: GBX + 48, y: 164 } }],
    };
  }

  // ---------------- 🛍️ 젤리젤리샵 내부 ----------------
  function buildShop() {
    const W = 640, H = 400;
    const [g, x] = cv(W, H);
    // 바닥: 연보라 마루 + 가운데 분홍 러그
    for (let yy = 84; yy < H; yy += 10) for (let xx = 0; xx < W; xx += 40) {
      const off = ((yy - 84) / 10) % 2 ? 20 : 0;
      x.fillStyle = ((xx + off + yy) / 10) % 3 === 0 ? "#e6dbf2" : "#efe6f8"; x.fillRect(xx - off, yy, 40, 10);
      x.fillStyle = "#cdbfe0"; x.fillRect(xx - off, yy + 9, 40, 1); x.fillRect(xx - off, yy, 1, 10);
    }
    x.fillStyle = OUT; x.fillRect(224, 170, 192, 150); x.fillStyle = "#ffb8d4"; x.fillRect(226, 172, 188, 146);
    x.fillStyle = "#ffe0ee"; x.fillRect(232, 178, 176, 134); x.fillStyle = "#ffb8d4"; x.fillRect(238, 184, 164, 122);
    x.fillStyle = "#fff4f9"; for (let k = 0; k < 6; k++) { x.beginPath(); x.arc(250 + k * 28, 245, 5, 0, 7); x.fill(); }
    // 벽: 분홍 줄무늬 + 금색 몰딩
    x.fillStyle = OUT; x.fillRect(0, 0, W, 84);
    for (let xx = 0; xx < W; xx += 14) { x.fillStyle = (xx / 14) % 2 ? "#ffe3ef" : "#ffd1e3"; x.fillRect(xx, 0, 14, 72); }
    for (let xx = 7; xx < W; xx += 28) for (let yy = 10; yy < 66; yy += 18) { x.fillStyle = "rgba(255,255,255,.55)"; x.fillRect(xx - 1, yy, 3, 1); x.fillRect(xx, yy - 1, 1, 3); }
    x.fillStyle = "#f2c14e"; x.fillRect(0, 70, W, 4); x.fillStyle = "#c98b5a"; x.fillRect(0, 74, W, 6); x.fillStyle = "#a86d42"; x.fillRect(0, 80, W, 4);
    // 간판
    x.fillStyle = OUT; x.fillRect(236, 4, 168, 32); x.fillStyle = "#fff8ea"; x.fillRect(238, 6, 164, 28); x.fillStyle = "#ff7fae"; x.fillRect(238, 30, 164, 4);
    x.font = `bold 13px ${FONT}`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = "#d1559a"; x.fillText("🛍️ " + T("bShop"), 320, 18);
    // 벽 선반 (접은 옷 · 모자 · 가방)
    const shelf = (sx, items) => {
      x.fillStyle = OUT; x.fillRect(sx, 46, 150, 6); x.fillStyle = "#c98b5a"; x.fillRect(sx + 1, 47, 148, 4);
      x.fillStyle = OUT; x.fillRect(sx + 8, 52, 3, 6); x.fillRect(sx + 139, 52, 3, 6);
      items.forEach(([kind, col], i) => {
        const ix = sx + 10 + i * 28;
        if (kind === "fold") { for (let k = 0; k < 3; k++) { x.fillStyle = OUT; x.fillRect(ix, 40 - k * 6, 20, 6); x.fillStyle = Avatar.mix(col, "#ffffff", k * 0.25); x.fillRect(ix + 1, 41 - k * 6, 18, 4); } }
        if (kind === "hat") { x.fillStyle = OUT; x.fillRect(ix - 1, 38, 22, 8); x.fillRect(ix + 4, 28, 12, 12); x.fillStyle = col; x.fillRect(ix, 39, 20, 6); x.fillRect(ix + 5, 29, 10, 10); x.fillStyle = "#fff"; x.fillRect(ix + 5, 36, 10, 2); }
        if (kind === "bag") { x.fillStyle = OUT; x.fillRect(ix + 2, 30, 16, 16); x.fillStyle = col; x.fillRect(ix + 3, 31, 14, 14); x.strokeStyle = OUT; x.lineWidth = 1.5; x.beginPath(); x.arc(ix + 10, 30, 5, Math.PI, 0); x.stroke(); x.fillStyle = "#f2c14e"; x.fillRect(ix + 9, 36, 2, 2); }
      });
    };
    shelf(30, [["fold", "#a77ce0"], ["fold", "#8fe0cc"], ["hat", "#ff9fc8"], ["fold", "#ffd34d"], ["bag", "#d8434e"]]);
    shelf(460, [["hat", "#2c3e7a"], ["bag", "#ff9fc8"], ["fold", "#f4b6c4"], ["hat", "#efe2c6"], ["fold", "#2f8f6a"]]);
    // 출입문
    x.fillStyle = OUT; x.fillRect(296, 382, 48, 18); x.fillStyle = "#6a3f28"; x.fillRect(298, 384, 44, 16); x.fillStyle = "#ffe8a3"; x.fillRect(306, 388, 28, 4);

    const objects = [], colliders = [[0, 0, W, 90]];
    // 계산대 (매대)
    const counter = (() => {
      const CW = 184, CH = 56;
      const [c, s] = cv(CW, CH);
      s.fillStyle = "rgba(40,30,20,.25)"; s.fillRect(4, CH - 4, CW - 4, 4);
      s.fillStyle = OUT; s.fillRect(0, 16, CW, 12); s.fillStyle = "#fff8ea"; s.fillRect(1, 17, CW - 2, 9); s.fillStyle = "#ffffff"; s.fillRect(1, 17, CW - 2, 2);
      s.fillStyle = OUT; s.fillRect(2, 27, CW - 4, CH - 31); s.fillStyle = "#c9a0ef"; s.fillRect(3, 28, CW - 6, CH - 33);
      s.fillStyle = "#e2cff8"; for (let k = 10; k < CW - 6; k += 16) s.fillRect(k, 30, 2, CH - 37);
      s.fillStyle = "#f2c14e"; s.fillRect(3, 28, CW - 6, 2); s.fillRect(3, CH - 8, CW - 6, 2);
      // 계산기 · 쇼핑백 · 꽃병 · 리본 롤
      s.fillStyle = OUT; s.fillRect(14, 4, 26, 14); s.fillStyle = "#ffd1e6"; s.fillRect(15, 5, 24, 12); s.fillStyle = "#3a2530"; s.fillRect(18, 7, 12, 4); s.fillStyle = "#ffe07a"; s.fillRect(32, 7, 4, 4);
      [["#ff7fae", 120], ["#a77ce0", 140], ["#7fd3bd", 160]].forEach(([col, bx]) => { s.fillStyle = OUT; s.fillRect(bx, 2, 16, 16); s.fillStyle = col; s.fillRect(bx + 1, 3, 14, 14); s.strokeStyle = OUT; s.lineWidth = 1.2; s.beginPath(); s.arc(bx + 8, 3, 4, Math.PI, 0); s.stroke(); s.fillStyle = "#fff"; s.fillRect(bx + 5, 8, 6, 2); });
      s.fillStyle = OUT; s.fillRect(56, 6, 10, 12); s.fillStyle = "#9fe8ff"; s.fillRect(57, 7, 8, 10); s.fillStyle = "#ff5f9f"; s.fillRect(55, 0, 5, 5); s.fillStyle = "#ffd34d"; s.fillRect(62, 1, 5, 5); s.fillStyle = "#3fa04a"; s.fillRect(60, 4, 1, 4);
      s.font = `bold 9px ${FONT}`; s.textAlign = "center"; s.textBaseline = "middle"; s.fillStyle = "#ffffff"; s.fillText("JELLY JELLY", CW / 2, 40);
      return c;
    })();
    const CTX0 = 228, CTY0 = 82;
    objects.push({ y: 136, x: 320, draw: (c) => blit(c, counter, CTX0, CTY0) });
    colliders.push([CTX0 - 4, 84, 192, 54]);
    // 옷걸이 행거 (드레스 5벌)
    const rack = (rx, ry, outfits) => {
      const RW = 124, RH = 64;
      const [c, s] = cv(RW, RH);
      s.fillStyle = "rgba(40,30,20,.22)"; s.fillRect(6, RH - 4, RW - 8, 4);
      s.fillStyle = OUT; s.fillRect(4, 6, 4, RH - 8); s.fillRect(RW - 8, 6, 4, RH - 8); s.fillRect(0, RH - 6, 14, 4); s.fillRect(RW - 14, RH - 6, 14, 4); s.fillRect(2, 4, RW - 4, 4);
      s.fillStyle = "#e8e2f0"; s.fillRect(3, 5, RW - 6, 2); s.fillRect(5, 8, 2, RH - 12); s.fillRect(RW - 7, 8, 2, RH - 12);
      outfits.forEach((oi, i) => {
        const o = Avatar.OUTFITS[oi] || Avatar.OUTFITS[0], hx = 16 + i * 22;
        s.strokeStyle = OUT; s.lineWidth = 1; s.beginPath(); s.moveTo(hx + 6, 4); s.lineTo(hx + 6, 9); s.moveTo(hx, 12); s.lineTo(hx + 6, 9); s.lineTo(hx + 12, 12); s.stroke();
        s.fillStyle = OUT; s.fillRect(hx, 11, 13, 10); s.beginPath(); s.moveTo(hx - 3, 36); s.lineTo(hx + 16, 36); s.lineTo(hx + 12, 19); s.lineTo(hx + 1, 19); s.closePath(); s.fill();
        s.fillStyle = o.top; s.fillRect(hx + 1, 12, 11, 8);
        s.fillStyle = o.skirt || o.top; s.beginPath(); s.moveTo(hx - 1, 35); s.lineTo(hx + 14, 35); s.lineTo(hx + 11, 20); s.lineTo(hx + 2, 20); s.closePath(); s.fill();
        s.fillStyle = o.skirtS || o.topS || o.top; s.fillRect(hx, 33, 13, 2);
        if (o.frill || o.sleeve) { s.fillStyle = o.frill || o.sleeve; s.fillRect(hx + 1, 12, 2, 3); s.fillRect(hx + 10, 12, 2, 3); }
        s.fillStyle = "#ffffff"; s.fillRect(hx + 9, 22 + (i % 2) * 4, 2, 2);
      });
      objects.push({ y: ry + RH - 4, x: rx + RW / 2, draw: (cc) => cc.drawImage(c, rx, ry) });
      colliders.push([rx + 2, ry + RH - 18, RW - 4, 16]);
    };
    const OF = (id) => Math.max(0, Avatar.OUTFITS.findIndex((o) => o.id === id));
    rack(28, 120, [OF("rose"), OF("fairy"), OF("idol"), OF("mint"), OF("berry")]);
    rack(488, 120, [OF("midnight"), OF("emerald"), OF("pearl"), OF("burgundy"), OF("velvet")]);
    rack(28, 250, [OF("tweed"), OF("gingham"), OF("sailor"), OF("aurora"), OF("magic")]);
    rack(488, 250, [OF("tux"), OF("black"), OF("cherry"), OF("moon"), OF("bear")]);
    // 마네킹 (받침대 위 전신 코디)
    const mannequin = (mx, my, av) => {
      const [pc, p] = cv(36, 14);
      p.fillStyle = OUT; p.beginPath(); p.ellipse(18, 7, 17, 6, 0, 0, 7); p.fill(); p.fillStyle = "#fff8ea"; p.beginPath(); p.ellipse(18, 6, 16, 5, 0, 0, 7); p.fill(); p.fillStyle = "#f2c14e"; p.fillRect(4, 8, 28, 2);
      objects.push({ y: my + 2, x: mx, draw: (cc) => { cc.drawImage(pc, mx - 18, my - 6); Avatar.draw(cc, av, mx, my - 2, "down", 0); } });
      colliders.push([mx - 14, my - 6, 28, 10]);
    };
    const pale = { gender: "f", hair: 23, hairColor: 0, skin: 0, eye: 0, wand: 0 };
    mannequin(196, 220, { ...pale, outfit: OF("celestial") });
    mannequin(444, 220, { ...pale, outfit: OF("rose"), gender: "f" });
    // 전신 거울 · 피팅룸 커튼
    const mirror = (() => { const [c, s] = cv(30, 60); s.fillStyle = OUT; s.beginPath(); s.ellipse(15, 26, 14, 25, 0, 0, 7); s.fill(); s.fillStyle = "#f2c14e"; s.beginPath(); s.ellipse(15, 26, 13, 24, 0, 0, 7); s.fill(); s.fillStyle = "#cfefff"; s.beginPath(); s.ellipse(15, 26, 10, 21, 0, 0, 7); s.fill(); s.fillStyle = "rgba(255,255,255,.8)"; s.fillRect(9, 12, 3, 16); s.fillRect(14, 10, 2, 8); s.fillStyle = OUT; s.fillRect(8, 50, 14, 8); s.fillStyle = "#c98b5a"; s.fillRect(9, 51, 12, 6); return c; })();
    objects.push({ y: 372, x: 600, draw: (c) => c.drawImage(mirror, 586, 314) });
    colliders.push([588, 360, 26, 12]);
    const fitting = (() => { const [c, s] = cv(64, 76); s.fillStyle = OUT; s.fillRect(0, 0, 64, 6); s.fillStyle = "#c98b5a"; s.fillRect(1, 1, 62, 4);
      for (let k = 0; k < 8; k++) { s.fillStyle = OUT; s.fillRect(2 + k * 7.6, 6, 8, 66); s.fillStyle = k % 2 ? "#b58cff" : "#c9a0ef"; s.fillRect(3 + k * 7.6, 6, 6, 65); }
      s.fillStyle = "#f2c14e"; s.fillRect(2, 40, 60, 3); s.font = `bold 8px ${FONT}`; s.textAlign = "center"; s.textBaseline = "middle"; s.fillStyle = "#fff"; s.fillText("FITTING", 32, 24); return c; })();
    objects.push({ y: 390, x: 50, draw: (c) => blit(c, fitting, 18, 314) });
    colliders.push([18, 370, 64, 20]);
    [[176, 112, "#ff8fb8"], [464, 112, "#b58cff"], [560, 384, "#ffd34d"], [110, 384, "#9fdc7a"]].forEach(([px, py, col]) => { const sp = flowerPot(col); objects.push({ y: py + 16, x: px, draw: (c) => c.drawImage(sp, px - 7, py) }); colliders.push([px - 7, py + 6, 14, 10]); });
    // 점원 NPC (계산대 뒤)
    const staff = { x: 320, y: 106, dir: "down", nameKey: "shopStaff", linesKey: "shopLines", welcomeKey: "shopWelcome", thanksKey: "shopThanks",
      av: { gender: "f", hair: 1, hairColor: 6, skin: 0, outfit: OF("tweed"), eye: 2, wand: 0 } };
    const collide = (px, py) => colliders.some(([a, b, w, h]) => px > a && px < a + w && py > b && py < b + h);
    return {
      id: "shop", W, H, ground: g, objects, colliders: [], seats: [], staff,
      zones: [{ id: "exitShop", x: 290, y: 368, w: 60, h: 32, label: T("zExit") }, { id: "clerk", x: 284, y: 138, w: 72, h: 26, label: T("zShopClerk") }],
      walkable: (px, py) => px > 10 && px < W - 10 && py > 92 && py < H - 4 && !collide(px, py),
      spawn: { x: 320, y: 362 }, artist: null, icons: [{ x: 252, y: 84, icon: "🛍️" }], signs: [],
      clickables: [{ x: 320, y: 98, r: 34, go: "clerk", front: { x: 320, y: 150 } }],
    };
  }

  // ---------------- 🎬 젤리 시네마 내부 (작고 아늑한 상영관) ----------------
  function buildCinema() {
    const W = 420, H = 330;
    const SC = { x: 74, y: 12, w: 272, h: 62 }; // 스크린
    const [g, x] = cv(W, H);
    // 바닥: 아주 어두운 자주 카펫 + 무늬
    x.fillStyle = "#1c1020"; x.fillRect(0, 0, W, H);
    for (let yy = 96; yy < H; yy += 16) for (let xx = (yy / 16) % 2 ? 8 : 0; xx < W; xx += 16) { x.fillStyle = "#26162b"; x.fillRect(xx, yy, 3, 3); }
    // 가운데 통로 (짙은 빨강 카펫 + 바닥 조명)
    x.fillStyle = OUT; x.fillRect(181, 92, 58, H - 92); x.fillStyle = "#6a1824"; x.fillRect(183, 92, 54, H - 92); x.fillStyle = "#7e1e2c"; x.fillRect(187, 92, 46, H - 92);
    // 벽
    x.fillStyle = OUT; x.fillRect(0, 0, W, 94);
    for (let xx = 0; xx < W; xx += 16) { x.fillStyle = (xx / 16) % 2 ? "#140e22" : "#18112a"; x.fillRect(xx, 0, 16, 88); }
    // 무대 턱
    x.fillStyle = OUT; x.fillRect(40, 82, 340, 10); x.fillStyle = "#3a1a26"; x.fillRect(41, 83, 338, 7);
    // 스크린 (금색 테)
    x.fillStyle = OUT; x.fillRect(SC.x - 6, SC.y - 6, SC.w + 12, SC.h + 12); x.fillStyle = "#8a6a20"; x.fillRect(SC.x - 4, SC.y - 4, SC.w + 8, SC.h + 8); x.fillStyle = OUT; x.fillRect(SC.x - 1, SC.y - 1, SC.w + 2, SC.h + 2);
    const sg = x.createLinearGradient(0, SC.y, 0, SC.y + SC.h); sg.addColorStop(0, "#eef0ff"); sg.addColorStop(1, "#c8cce8"); x.fillStyle = sg; x.fillRect(SC.x, SC.y, SC.w, SC.h);
    x.font = `bold 17px ${FONT}`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = "#c0306a"; x.fillText("🎬 JELLY CINEMA", W / 2, SC.y + 24);
    x.font = `10px ${FONT}`; x.fillStyle = "#4a3a68"; x.fillText(T("cinemaScreen"), W / 2, SC.y + 48);
    // 빨간 커튼 (양옆)
    const curtain = (cx0, flip) => {
      for (let k = 0; k < 4; k++) {
        const xx = flip ? cx0 - k * 9 - 9 : cx0 + k * 9;
        x.fillStyle = OUT; x.fillRect(xx, 0, 9, 84 - k * 3); x.fillStyle = k % 2 ? "#7a1826" : "#9a2232"; x.fillRect(xx + 1, 0, 7, 82 - k * 3); x.fillStyle = "rgba(255,255,255,.08)"; x.fillRect(xx + 2, 0, 2, 80 - k * 3);
      }
      x.fillStyle = "#8a6a20"; x.fillRect(flip ? cx0 - 36 : cx0, 46, 36, 3);
    };
    curtain(30, false); curtain(390, true);
    x.fillStyle = OUT; x.fillRect(26, 0, 368, 6); x.fillStyle = "#7a1826"; x.fillRect(27, 0, 366, 4); for (let xx = 30; xx < 390; xx += 10) { x.fillStyle = "#9a2232"; x.beginPath(); x.arc(xx + 5, 4, 5, 0, Math.PI); x.fill(); }
    // 출입문 + EXIT
    x.fillStyle = OUT; x.fillRect(186, 314, 48, 16); x.fillStyle = "#3a2418"; x.fillRect(188, 316, 44, 14); x.fillStyle = "#8a7a50"; x.fillRect(196, 319, 28, 3);
    x.fillStyle = OUT; x.fillRect(140, 304, 32, 11); x.fillStyle = "#2fb85a"; x.fillRect(141, 305, 30, 9); x.font = `bold 7px ${FONT}`; x.fillStyle = "#eafff0"; x.fillText("EXIT", 156, 310);

    const objects = [], colliders = [[0, 0, W, 96]], seats = [];
    // 영화관 의자 (뒤에서 본 모습: 낮은 등받이가 앉은 사람 앞쪽)
    const seatSpr = (() => {
      const [c, s] = cv(30, 34);
      const X = 15, Y = 24;
      s.fillStyle = "rgba(0,0,0,.35)"; s.fillRect(X - 13, Y + 6, 28, 4);
      s.fillStyle = OUT; s.fillRect(X - 13, Y - 4, 26, 12);
      s.fillStyle = "#8a1e2c"; s.fillRect(X - 12, Y - 3, 24, 10); s.fillStyle = "#a82c3a"; s.fillRect(X - 12, Y - 3, 24, 3); s.fillStyle = "#6a1420"; s.fillRect(X - 1, Y, 2, 6);
      s.fillStyle = OUT; s.fillRect(X - 15, Y - 1, 4, 10); s.fillRect(X + 11, Y - 1, 4, 10);
      s.fillStyle = "#2a1a22"; s.fillRect(X - 14, Y, 2, 8); s.fillRect(X + 12, Y, 2, 8);
      s.fillStyle = "#b8963a"; s.fillRect(X - 3, Y + 4, 6, 2);
      return c;
    })();
    const ROWS = [146, 194, 242], LEFT = [86, 120, 154], RIGHT = [266, 300, 334];
    ROWS.forEach((ry, ri) => {
      [...LEFT, ...RIGHT].forEach((sx, si) => {
        objects.push({ y: ry + 2, x: sx, draw: (c) => c.drawImage(seatSpr, sx - 15, ry - 24) });
        colliders.push([sx - 15, ry - 8, 30, 16]);
        seats.push({ id: "c" + ri + si, x: sx, y: ry, dir: "up", ax: sx, ay: ry + 22, labelKey: "actWatchSit", watch: true });
      });
    });
    // 팝콘 판매대 · 화분
    const popcorn = (() => { const [c, s] = cv(32, 36); s.fillStyle = OUT; s.fillRect(2, 12, 28, 24); s.fillStyle = "#e8e0e0"; s.fillRect(3, 13, 26, 22); s.fillStyle = "#9a2232"; for (let k = 4; k < 28; k += 7) s.fillRect(k, 13, 3, 22);
      s.fillStyle = OUT; s.fillRect(5, 2, 22, 12); s.fillStyle = "#e8dc90"; for (let k = 0; k < 5; k++) { s.beginPath(); s.arc(8 + k * 4, 7 + (k % 2) * 2, 4, 0, 7); s.fill(); } return c; })();
    objects.push({ y: 318, x: 390, draw: (c) => c.drawImage(popcorn, 372, 282) });
    colliders.push([372, 300, 32, 18]);
    [[24, 300, "#ff8fb8"]].forEach(([px, py, col]) => { const sp = flowerPot(col); objects.push({ y: py + 16, x: px, draw: (c) => c.drawImage(sp, px - 7, py) }); colliders.push([px - 7, py + 6, 14, 10]); });
    const collide = (px, py) => colliders.some(([a, b, w, h]) => px > a && px < a + w && py > b && py < b + h);
    return {
      id: "cinema", W, H, ground: g, objects, colliders: [], seats, screen: SC,
      aisleLights: [...[110, 140, 170, 200, 230, 260, 290].flatMap((yy) => [[185, yy], [235, yy]])], exitSign: { x: 140, y: 304, w: 32, h: 11 },
      zones: [{ id: "exitCinema", x: 180, y: 296, w: 60, h: 34, label: T("zExit") }],
      walkable: (px, py) => px > 10 && px < W - 10 && py > 100 && py < H - 4 && !collide(px, py),
      spawn: { x: 210, y: 292 }, artist: null, icons: [], signs: [{ x: 210, y: 116, key: "cinemaSign", bg: "#fff3a8" }],
      clickables: [],
    };
  }

  // ---------------- 🌿 젤리 초원 (광장 동쪽) · 북쪽 암석산 · 수상한 동굴 ----------------
  function warnSign() {
    const [c, x] = cv(40, 46);
    x.fillStyle = OUT; x.fillRect(18, 16, 5, 30); x.fillStyle = "#6e4a2c"; x.fillRect(19, 17, 3, 28);
    x.fillStyle = OUT; x.fillRect(1, 1, 38, 22); x.fillStyle = "#a88a5e"; x.fillRect(2, 2, 36, 20); x.fillStyle = "#866a44"; x.fillRect(2, 16, 36, 2);
    x.font = `bold 10px ${FONT}`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = "#9a2232"; x.fillText("⚠???", 20, 10);
    return c;
  }
  function buildMeadow() {
    const W = 1280, H = 900;
    const r = rng(77);
    // 북쪽 암석산의 아랫선 (울퉁불퉁)
    const cliffY = (px) => 196 + Math.round(Math.sin(px / 61) * 9 + Math.sin(px / 23 + 1) * 5 + Math.sin(px / 137) * 12);
    const CVX = 1000, CVB = cliffY(CVX); // 동굴 입구 (오른쪽 위, 바위산 아래)
    const [g, x] = cv(W, H);
    // 풀밭
    x.fillStyle = "#6cbf55"; x.fillRect(0, 0, W, H);
    for (let k = 0; k < 9000; k++) { const px = (r() * W) | 0, py = (r() * H) | 0, n = r(); x.fillStyle = n < 0.45 ? "#62b24c" : n < 0.8 ? "#78c862" : "#8fd474"; x.fillRect(px, py, 3, 2); }
    // 꽃밭
    for (let k = 0; k < 1400; k++) { const px = (r() * W) | 0, py = (r() * H) | 0; if (py < cliffY(px) + 20 || Math.hypot(px - CVX, py - CVB) < 150) continue; x.fillStyle = ["#ffd1e1", "#fff3a8", "#ffffff", "#f58fb0", "#c9b0ff"][k % 5]; x.fillRect(px, py, 2, 2); }
    // 흙길: 서쪽 입구 → 동굴 앞
    const path = () => { x.beginPath(); x.moveTo(-20, 450); x.bezierCurveTo(260, 470, 420, 420, 600, 380); x.bezierCurveTo(780, 340, 900, 320, CVX, CVB + 30); };
    x.lineCap = "round"; x.strokeStyle = "#a8845a"; x.lineWidth = 44; path(); x.stroke(); x.strokeStyle = "#d9bb8a"; x.lineWidth = 36; path(); x.stroke();
    // 동굴 앞 시든 땅
    const dg = x.createRadialGradient(CVX, CVB + 20, 20, CVX, CVB + 20, 170); dg.addColorStop(0, "rgba(40,20,40,.55)"); dg.addColorStop(0.6, "rgba(70,50,50,.22)"); dg.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = dg; x.beginPath(); x.ellipse(CVX, CVB + 30, 200, 140, 0, 0, 7); x.fill();
    for (let k = 0; k < 220; k++) { const a = r() * Math.PI, d = 40 + r() * 140, px = CVX + Math.cos(a) * d * 1.3, py = CVB + 10 + Math.sin(a) * d * 0.7; x.fillStyle = r() < 0.5 ? "#7d7046" : "#5f5638"; x.fillRect(px | 0, py | 0, 2, 3); }
    // ⛰️ 북쪽 암석산: 먼 봉우리 → 바위 절벽 → 아래 돌무더기
    for (let px = 0; px < W; px += 2) { const top = 18 + Math.round(Math.abs(Math.sin(px / 90)) * 30 + Math.sin(px / 31) * 6); x.fillStyle = "#5e5868"; x.fillRect(px, 0, 2, top + 30); x.fillStyle = "#7a7484"; x.fillRect(px, top, 2, 3); }
    for (let px = 0; px < W; px++) {
      const base = cliffY(px);
      for (let py = 40; py < base; py++) {
        const band = Math.floor((py + Math.sin(px / 17) * 6) / 14), k = (py - 40) / (base - 40);
        const sh = (band % 3 === 0 ? 0 : band % 3 === 1 ? 10 : -8) + Math.round(Math.sin(px / 9 + band) * 4);
        const cval = 128 - k * 40 + sh;
        x.fillStyle = `rgb(${cval + 6},${cval},${cval + 14})`; x.fillRect(px, py, 1, 1);
      }
      x.fillStyle = OUT; x.fillRect(px, base, 1, 2);
    }
    // 바위 덩어리 (절벽 면)
    for (let k = 0; k < 160; k++) {
      const px = (r() * W) | 0, base = cliffY(px), py = 50 + r() * (base - 70), rw = 10 + r() * 22, rh = 7 + r() * 12;
      if (Math.abs(px - CVX) < 70 && py > CVB - 90) continue;
      x.fillStyle = "#4a4454"; x.beginPath(); x.ellipse(px + 1, py + 2, rw / 2 + 1, rh / 2 + 1, 0, 0, 7); x.fill();
      x.fillStyle = r() < 0.5 ? "#8a8494" : "#9a94a4"; x.beginPath(); x.ellipse(px, py, rw / 2, rh / 2, 0, 0, 7); x.fill();
      x.fillStyle = "#b8b2c2"; x.fillRect(px - rw / 4, py - rh / 3, rw / 3, 2);
    }
    // 절벽 틈의 풀 · 이끼
    for (let k = 0; k < 120; k++) { const px = (r() * W) | 0, py = 60 + r() * (cliffY(px) - 70); x.fillStyle = r() < 0.5 ? "#4f8f41" : "#5fa04e"; x.fillRect(px, py, 3, 2); }
    // 절벽 아래 돌무더기
    for (let px = 0; px < W; px += 9) { if (Math.abs(px - CVX) < 46) continue; const base = cliffY(px), rw = 8 + r() * 10; x.fillStyle = OUT; x.beginPath(); x.ellipse(px, base + 3, rw / 2 + 1, 5, 0, 0, 7); x.fill(); x.fillStyle = r() < 0.5 ? "#8a8494" : "#7a7484"; x.beginPath(); x.ellipse(px, base + 2, rw / 2, 4, 0, 0, 7); x.fill(); }
    // 🕳️ 동굴 입구: 절벽을 파고 들어간 어두운 아치 + 둘레 바위 + 종유석
    x.fillStyle = "#3a3444"; x.beginPath(); x.ellipse(CVX, CVB + 2, 52, 74, 0, Math.PI, 0); x.closePath(); x.fill();
    for (let k = 0; k <= 10; k++) { const a = Math.PI + (k / 10) * Math.PI, rx = CVX + Math.cos(a) * 48, ry = CVB + Math.sin(a) * 70; x.fillStyle = OUT; x.beginPath(); x.ellipse(rx, ry, 11, 9, a, 0, 7); x.fill(); x.fillStyle = k % 2 ? "#6e687a" : "#807a8c"; x.beginPath(); x.ellipse(rx, ry, 9, 7, a, 0, 7); x.fill(); x.fillStyle = "#9a94a4"; x.fillRect(rx - 4, ry - 4, 5, 2); }
    const hole = x.createRadialGradient(CVX, CVB - 20, 4, CVX, CVB - 20, 60); hole.addColorStop(0, "#000000"); hole.addColorStop(0.6, "#0c0614"); hole.addColorStop(1, "#24122e");
    x.fillStyle = hole; x.beginPath(); x.ellipse(CVX, CVB + 2, 38, 60, 0, Math.PI, 0); x.closePath(); x.fill();
    x.fillStyle = "#4a4454"; [[-24, 9], [-12, 13], [2, 8], [14, 14], [26, 9]].forEach(([dx, len]) => { const top = CVB - Math.sqrt(Math.max(0, 1 - (dx / 38) ** 2)) * 58; x.beginPath(); x.moveTo(CVX + dx - 4, top); x.lineTo(CVX + dx + 4, top); x.lineTo(CVX + dx, top + len); x.closePath(); x.fill(); });
    // 입구 아래 바닥 돌
    x.fillStyle = "#5a5464"; x.fillRect(CVX - 38, CVB, 76, 4);

    const objects = [], colliders = [];
    // 서쪽 입구 표지 (광장으로)
    const signBoard = (() => { const [c, s] = cv(70, 44); s.fillStyle = OUT; s.fillRect(32, 18, 6, 26); s.fillStyle = "#8f5a34"; s.fillRect(33, 19, 4, 25); s.fillStyle = OUT; s.fillRect(2, 2, 66, 20); s.fillStyle = "#fff8ea"; s.fillRect(3, 3, 64, 18);
      s.font = `bold 9px ${FONT}`; s.textAlign = "center"; s.textBaseline = "middle"; s.fillStyle = OUT; s.fillText("◀ " + T("mapPlaza"), 35, 12); return c; })();
    objects.push({ y: 412, x: 60, draw: (c) => blit(c, signBoard, 26, 368) });
    colliders.push([56, 404, 14, 8]);
    // 나무 (남·서·동쪽 가장자리 + 군데군데)
    const trees = [0, 1, 2].map((v) => treeSprite(v));
    const spots = [];
    for (let xx = 20; xx < W; xx += 46) spots.push([xx + 20, H - 6 - (xx % 2) * 12]);
    for (let yy = 260; yy < H; yy += 50) { if (Math.abs(yy - 450) > 70) spots.push([14 + (yy % 3) * 8, yy]); spots.push([W - 16 - (yy % 2) * 10, yy]); }
    [[230, 300], [380, 270], [700, 290], [300, 700], [520, 760], [800, 760], [180, 600], [1150, 520], [640, 560]].forEach((p) => spots.push(p));
    spots.forEach(([tx, ty], i) => { const sp = trees[i % 3]; objects.push({ y: ty, x: tx, draw: (c) => c.drawImage(sp, tx - 17, ty - 42) }); colliders.push([tx - 8, ty - 8, 16, 8]); });
    // 바위
    [[420, 560], [760, 640], [1180, 330], [240, 820], [520, 280], [820, 280]].forEach(([bx, by]) => { objects.push({ y: by + 6, x: bx, draw: (c) => { c.fillStyle = OUT; c.beginPath(); c.ellipse(bx, by, 15, 10, 0, 0, 7); c.fill(); c.fillStyle = "#9a93a8"; c.beginPath(); c.ellipse(bx, by - 1, 13, 8, 0, 0, 7); c.fill(); c.fillStyle = "#c2bcce"; c.fillRect(bx - 7, by - 6, 6, 2); } }); colliders.push([bx - 14, by - 6, 28, 12]); });
    // 연못
    x.fillStyle = OUT; x.beginPath(); x.ellipse(960, 700, 96, 50, 0, 0, 7); x.fill(); x.fillStyle = "#5fb8e0"; x.beginPath(); x.ellipse(960, 700, 92, 46, 0, 0, 7); x.fill();
    x.fillStyle = "#9fe0f5"; x.fillRect(920, 684, 20, 3); x.fillRect(980, 708, 26, 3); x.fillStyle = "#3fa04a"; [[910, 716], [1000, 690]].forEach(([a, b]) => { x.beginPath(); x.ellipse(a, b, 9, 5, 0, 0, 7); x.fill(); });
    colliders.push([960 - 92, 700 - 40, 184, 80]);
    // 동굴: 안쪽 보랏빛 · 가끔 깜빡이는 빨간 눈 · 피어나오는 검보라 안개
    objects.push({ y: CVB - 1, x: CVX, anim: true, draw: (c, t) => {
      const tt = t || 0, k = 0.55 + 0.45 * Math.sin(tt / 380);
      const gl = c.createRadialGradient(CVX, CVB - 18, 2, CVX, CVB - 18, 44); gl.addColorStop(0, `rgba(170,60,220,${0.5 * k})`); gl.addColorStop(1, "rgba(120,30,170,0)");
      c.fillStyle = gl; c.beginPath(); c.ellipse(CVX, CVB, 38, 58, 0, Math.PI, 0); c.closePath(); c.fill();
      const ph = (tt / 1000) % 7;
      if (ph > 5.6 && ph < 6.6 && !(ph > 6.0 && ph < 6.08)) { c.fillStyle = "#ff2a4a"; c.fillRect(CVX - 9, CVB - 30, 4, 2); c.fillRect(CVX + 5, CVB - 30, 4, 2); c.fillStyle = "rgba(255,60,80,.35)"; c.fillRect(CVX - 11, CVB - 32, 8, 6); c.fillRect(CVX + 3, CVB - 32, 8, 6); }
    } });
    objects.push({ y: CVB + 160, x: CVX, anim: true, draw: (c, t) => {
      for (let i = 0; i < 8; i++) {
        const ph = (((t || 0) / 2800) + i / 8) % 1, sx = CVX + Math.sin((t || 0) / 700 + i * 2.1) * (10 + ph * 34), sy = CVB - 6 + ph * 46 - ph * ph * 30, rad = 5 + ph * 12;
        c.fillStyle = `rgba(${90 + i * 8},40,${130 + i * 6},${(1 - ph) * 0.32})`; c.beginPath(); c.arc(sx, sy, rad, 0, 7); c.fill();
      }
    } });
    const ws = warnSign();
    objects.push({ y: CVB + 46, x: CVX + 64, draw: (c) => blit(c, ws, CVX + 44, CVB + 2) });
    colliders.push([CVX + 60, CVB + 40, 10, 8]);
    // 나비
    objects.push({ y: H + 100, x: 0, anim: true, draw: (c, t) => {
      for (let i = 0; i < 7; i++) {
        const tt = (t || 0) / 1000 + i * 13, bx = 160 + ((i * 173 + tt * 22) % 900), by = 300 + i * 80 + Math.sin(tt * 1.7) * 18;
        if (Math.hypot(bx - CVX, by - CVB) < 150) continue;
        const flap = Math.sin(tt * 14) > 0 ? 3 : 1; c.fillStyle = ["#ffd1e1", "#fff3a8", "#c9b0ff", "#9fe8ff"][i % 4];
        c.fillRect(bx - 3, by - flap, 3, flap * 2); c.fillRect(bx + 1, by - flap, 3, flap * 2); c.fillStyle = OUT; c.fillRect(bx, by - 1, 1, 3);
      }
    } });
    const collide = (px, py) => colliders.some(([a, b, w, h]) => px > a && px < a + w && py > b && py < b + h);
    return {
      id: "meadow", W, H, ground: g, objects, colliders: [], seats: [],
      zones: [],
      triggers: [{ id: "toPlaza", x: 0, y: 400, w: 12, h: 100 }, { id: "cave", x: CVX - 34, y: CVB + 4, w: 68, h: 26 }],
      walkable: (px, py) => px > 4 && px < W - 24 && py < H - 20 && py > cliffY(px) + 8 && !collide(px, py),
      spawn: { x: 40, y: 450 }, artist: null, icons: [{ x: CVX, y: CVB - 74, icon: "❓" }],
      signs: [{ x: CVX, y: CVB - 92, key: "caveSign", bg: "#e8dcfa", type: true }],
      clickables: [{ x: CVX, y: CVB - 20, r: 44, go: "cave", front: { x: CVX, y: CVB + 24 } }],
    };
  }

  // ---------------- 🫧 분수대 속 바닷속 (보물상자) ----------------
  function chestSprites() {
    const mk = (open) => {
      const [c, x] = cv(40, 40);
      x.fillStyle = "rgba(10,30,50,.35)"; x.fillRect(3, 34, 36, 5);
      // 몸통
      x.fillStyle = OUT; x.fillRect(2, 18, 36, 18);
      x.fillStyle = "#9a5b2e"; x.fillRect(3, 19, 34, 16); x.fillStyle = "#b8743e"; x.fillRect(3, 19, 34, 3);
      x.fillStyle = "#f2c14e"; x.fillRect(3, 26, 34, 3); x.fillRect(8, 19, 3, 16); x.fillRect(29, 19, 3, 16);
      if (!open) {
        x.fillStyle = OUT; x.fillRect(2, 6, 36, 14); x.fillStyle = "#b8743e"; x.fillRect(3, 7, 34, 12); x.fillStyle = "#d18b4f"; x.fillRect(3, 7, 34, 3);
        x.fillStyle = "#f2c14e"; x.fillRect(8, 7, 3, 12); x.fillRect(29, 7, 3, 12); x.fillRect(3, 16, 34, 3);
        x.fillStyle = OUT; x.fillRect(16, 14, 8, 10); x.fillStyle = "#ffe07a"; x.fillRect(17, 15, 6, 8); x.fillStyle = OUT; x.fillRect(19, 17, 2, 4);
      } else {
        // 열린 뚜껑 + 반짝이는 코인
        x.fillStyle = OUT; x.fillRect(2, 0, 36, 10); x.fillStyle = "#7a4522"; x.fillRect(3, 1, 34, 8); x.fillStyle = "#f2c14e"; x.fillRect(8, 1, 3, 8); x.fillRect(29, 1, 3, 8);
        x.fillStyle = "#ffe07a"; x.fillRect(4, 14, 32, 6); x.fillStyle = "#fff3a8"; [[7, 13], [14, 12], [22, 13], [29, 12], [18, 15]].forEach(([a, b]) => x.fillRect(a, b, 4, 3));
        x.fillStyle = "#ff8fb8"; x.fillRect(12, 14, 3, 3); x.fillStyle = "#7fe3ff"; x.fillRect(25, 14, 3, 3);
      }
      return c;
    };
    return [mk(false), mk(true)];
  }
  function buildSea() {
    const W = 640, H = 420;
    const [g, x] = cv(W, H);
    // 물 (위는 밝고 아래로 갈수록 깊은 파랑)
    for (let yy = 0; yy < H; yy++) {
      const k = yy / H;
      x.fillStyle = `rgb(${Math.round(70 - 50 * k)},${Math.round(175 - 95 * k)},${Math.round(225 - 70 * k)})`;
      x.fillRect(0, yy, W, 1);
    }
    // 수면 물결
    for (let xx = 0; xx < W; xx += 2) { const h = 3 + Math.round(Math.sin(xx / 14) * 2); x.fillStyle = "#bff0ff"; x.fillRect(xx, 0, 2, h); x.fillStyle = "#8fdcf5"; x.fillRect(xx, h, 2, 2); }
    // 모래 바닥
    const r = rng(33);
    for (let xx = 0; xx < W; xx++) {
      const top = H - 58 + Math.round(Math.sin(xx / 37) * 6 + Math.sin(xx / 13) * 2);
      for (let yy = top; yy < H; yy++) { x.fillStyle = yy === top ? "#f7e2a8" : r() < 0.08 ? "#d9b977" : r() < 0.5 ? "#ecd08f" : "#e5c885"; x.fillRect(xx, yy, 1, 1); }
    }
    // 조개 · 불가사리
    [[70, 392, "#ff9fc8"], [190, 404, "#ffd34d"], [520, 398, "#ff7f7f"], [590, 410, "#fff3a8"], [330, 406, "#bfe9ff"]].forEach(([sx, sy, col], i) => {
      x.fillStyle = OUT; x.fillRect(sx - 1, sy - 1, 9, 7); x.fillStyle = col; x.fillRect(sx, sy, 7, 5); x.fillStyle = "rgba(255,255,255,.6)"; x.fillRect(sx + 1 + (i % 2) * 3, sy + 1, 2, 3);
    });
    const objects = [], colliders = [];
    // 바위
    const rock = (rx, ry, rw, rh) => {
      objects.push({ y: ry + rh, x: rx, draw: (c) => {
        c.fillStyle = OUT; c.fillRect(rx - 1, ry + 3, rw + 2, rh - 2); c.fillRect(rx + 3, ry - 1, rw - 6, 5);
        c.fillStyle = "#5d6b82"; c.fillRect(rx, ry + 3, rw, rh - 3); c.fillRect(rx + 3, ry, rw - 6, 4);
        c.fillStyle = "#7d8ca3"; c.fillRect(rx + 3, ry + 1, rw - 10, 3); c.fillStyle = "#46526a"; c.fillRect(rx, ry + rh - 4, rw, 3);
        c.fillStyle = "#6fc28a"; c.fillRect(rx + 4, ry + 2, 4, 2); c.fillRect(rx + rw - 10, ry + 5, 3, 2);
      } });
      colliders.push([rx, ry + rh - 10, rw, 10]);
    };
    rock(46, 336, 64, 32); rock(540, 314, 52, 30); rock(236, 362, 34, 16);
    // 해초 (살랑살랑)
    [[30, 392], [140, 382], [270, 390], [370, 396], [480, 386], [610, 390], [120, 378], [580, 380], [210, 384]].forEach(([sx, sy], i) => {
      const hgt = 30 + (i * 7) % 22, col = i % 3 === 0 ? "#3fa36b" : i % 3 === 1 ? "#5cc48a" : "#2f8a5a";
      objects.push({ y: sy, x: sx, anim: true, draw: (c, t) => {
        for (let k = 0; k < hgt; k += 2) { const sw = Math.round(Math.sin(t / 500 + i + k / 9) * (k / 10)); c.fillStyle = OUT; c.fillRect(sx + sw - 1, sy - k - 2, 5, 3); c.fillStyle = col; c.fillRect(sx + sw, sy - k - 2, 3, 2); }
      } });
    });
    // 보물상자
    const [chC, chO] = chestSprites();
    // 보물상자 자리: 들어올 때마다 이 중 한 곳으로 바뀜 (모래 바닥 여러 곳)
    const SPOTS = [[150, 352], [196, 346], [318, 358], [382, 350], [440, 352], [500, 355], [612, 356], [130, 362], [260, 350], [540, 366]];
    let CX = 440, CY = 352;
    const sea = { chestOpen: false, locked: false };
    const chestObj = { y: CY, x: CX, anim: true, draw: (c, t) => {
      c.drawImage(sea.chestOpen ? chO : chC, CX - 20, CY - 36);
      if (!sea.chestOpen && !sea.locked) { const a = (Math.sin(t / 250) + 1) / 2; c.fillStyle = `rgba(255,243,168,${0.25 + a * 0.5})`; [[-24, -30], [22, -24], [-4, -44]].forEach(([dx, dy], j) => c.fillRect(CX + dx + ((t / 200 + j) % 2 | 0), CY + dy, 2, 2)); }
    } };
    objects.push(chestObj);
    const chestCol = [CX - 18, CY - 16, 36, 14];
    colliders.push(chestCol);
    // 물고기 · 물방울 · 빛줄기 (맨 위에 그림)
    const fish = [[0, 110, "#ffb347", 26], [1, 190, "#ff7fae", 34], [2, 262, "#7fe3ff", 22], [3, 150, "#ffe07a", 40], [4, 300, "#b58cff", 30]];
    objects.push({ y: 99999, x: 0, anim: true, draw: (c, t) => {
      // 빛줄기
      c.save(); c.globalAlpha = 0.08;
      for (let k = 0; k < 7; k++) { const bx = 30 + k * 96 + Math.sin(t / 2000 + k) * 16; c.fillStyle = "#ffffff"; c.beginPath(); c.moveTo(bx, 0); c.lineTo(bx + 26, 0); c.lineTo(bx + 70, H); c.lineTo(bx + 30, H); c.fill(); }
      c.restore();
      for (const [i, fy, col, sp] of fish) {
        const dir = i % 2 ? -1 : 1, span = W + 60, p = ((t / 1000) * sp + i * 137) % span;
        const fx = dir > 0 ? p - 30 : W + 30 - p, yy = fy + Math.sin(t / 400 + i) * 4;
        c.fillStyle = OUT; c.fillRect(fx - 7, yy - 3, 14, 7); c.fillStyle = col; c.fillRect(fx - 6, yy - 2, 12, 5);
        c.fillStyle = OUT; c.fillRect(fx - dir * 9 - 2, yy - 3, 4, 7); c.fillStyle = col; c.fillRect(fx - dir * 9 - 1, yy - 2, 2, 5);
        c.fillStyle = "#fff"; c.fillRect(fx + dir * 3 - 1, yy - 1, 2, 2); c.fillStyle = OUT; c.fillRect(fx + dir * 3, yy - 1, 1, 1);
      }
      c.fillStyle = "rgba(220,250,255,.75)";
      for (let k = 0; k < 26; k++) { const bx = (k * 53) % W + Math.sin(t / 700 + k) * 4, by = H - ((t / 1000) * (20 + (k % 5) * 6) + k * 71) % (H + 20); const s = k % 3 ? 2 : 3; c.fillRect(bx, by, s, s); }
    } });
    const collide = (px, py) => colliders.some(([a, b, w, h]) => px > a && px < a + w && py > b && py < b + h);
    const chestZone = { id: "chest", x: CX - 30, y: CY - 8, w: 60, h: 28, label: T("zChest") };
    const chestClick = { x: CX, y: CY - 16, r: 26, go: "chest", front: { x: CX, y: CY + 12 } };
    const chestIcon = { x: CX, y: CY - 40, icon: "❓" };
    const world = {
      id: "sea", W, H, ground: g, objects, colliders: [], sea,
      zones: [chestZone, { id: "surface", x: 270, y: 36, w: 100, h: 30, label: T("zSurface") }],
      walkable: (px, py) => px > 12 && px < W - 12 && py > 36 && py < H - 6 && !collide(px, py),
      spawn: { x: 320, y: 140 }, artist: null, chest: { x: CX, y: CY },
      clickables: [chestClick],
      icons: [chestIcon],
    };
    // 🎲 보물상자를 무작위 자리로 옮김 (이전 자리와는 다르게)
    world.placeChest = (idx) => {
      let k = idx ?? ((Math.random() * SPOTS.length) | 0);
      if (idx == null && SPOTS[k][0] === CX && SPOTS[k][1] === CY) k = (k + 1 + ((Math.random() * (SPOTS.length - 1)) | 0)) % SPOTS.length;
      [CX, CY] = SPOTS[k];
      chestObj.x = CX; chestObj.y = CY;
      chestCol[0] = CX - 18; chestCol[1] = CY - 16;
      Object.assign(chestZone, { x: CX - 30, y: CY - 8 });
      Object.assign(chestClick, { x: CX, y: CY - 16, front: { x: CX, y: CY + 12 } });
      chestIcon.x = CX; chestIcon.y = CY - 40;
      world.chest.x = CX; world.chest.y = CY; world.chestSpot = k;
    };
    return world;
  }

  window.World = { buildPlaza, buildLounge, buildSea, buildShop, buildCinema, buildMeadow, rankTops: {}, blitText };
})();
