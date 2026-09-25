/* JELLY LAND 맵 생성 — 광장(plaza) & 팬 라운지(lounge) */
(function () {
  const OUT = "#3a2530";
  const FONT = "'Galmuri11', 'Galmuri9', 'Apple SD Gothic Neo', 'Hiragino Sans', 'Noto Sans JP', monospace";
  const T = (k) => window.I18N.t(k);
  function rng(seed) { return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); }
  function cv(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d"); x.imageSmoothingEnabled = false; return [c, x]; }
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
    const paving = (x, y) => {
      const dx = Math.abs(x - CX), dy = Math.abs(y - CY);
      let p = (dx <= 520 && dy <= 400 && dx + dy <= 780) || (Math.abs(x - CX) <= 60 && y > CY);
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
      objects.push({ y: b.y + b.h, x: b.x, draw: (c) => c.drawImage(b.sprite, b.x - 2, b.y) });
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
    objects.push({ y: RY, x: RX, draw: (c) => c.drawImage(recB, RX - 40, RY - 44) });
    colliders.push([RX - 24, RY - 8, 48, 10]);
    // 랭킹 1위 게시판 (젤리게임월드 옆)
    const BX = 866, BY = 770; // 젤리게임월드 바로 왼쪽, 건물 앞면과 같은 선
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
      objects.push({ y: ly, x: lx, draw: (c) => c.drawImage(LAMP, lx - 5, ly - 28) });
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
    objects.push({ y: 914, x: 640, draw: (c) => c.drawImage(gate, 640 - 80, 860) });
    colliders.push([560, 900, 18, 14], [702, 900, 18, 14]);

    // 안내 게시판
    const board = boardSprite(T("zGuide"));
    objects.push({ y: 812, x: 532, draw: (c) => c.drawImage(board, 492, 748) });
    colliders.push([498, 798, 70, 12]);

    const zones = [
      ...buildings.map((b) => ({ id: b.id, x: b.door.x - 20, y: b.door.y - 8, w: 40, h: 26, label: b.name })),
      { id: "piano", x: PX - 34, y: PY + 6, w: 68, h: 30, label: T("zPiano") },
      { id: "recboard", x: RX - 30, y: RY + 2, w: 60, h: 30, label: T("recBoard") },
      { id: "rankboard", x: BX - 50, y: BY + 2, w: 100, h: 30, label: T("rankBoardZ") },
      { id: "guide", x: 494, y: 810, w: 76, h: 26, label: T("zGuide") },
    ];

    return {
      id: "plaza", W, H, ground: g, objects, colliders, zones, buildings, seats,
      walkable: (x, y) => isP(x | 0, y | 0),
      spawn: { x: 640, y: 840 },
      artist: null, // 조젤리 NPC 는 없앰 (피아노를 직접 연주)
      piano: { x: PX, y: PY - 10, front: { x: PX, y: PY + 20 } },
      clickables: [{ x: RX, y: RY - 20, r: 24, go: "recboard", front: { x: RX, y: RY + 16 } }, { x: BX, y: BY - 50, r: 56, go: "rankboard", front: { x: BX, y: BY + 16 } }],
      icons: [...buildings.map((b) => ({ x: b.x + b.w / 2 + 2, y: b.y - 4, icon: b.icon, label: b.name })), { x: PX, y: PY - 34, icon: "🎹" }, { x: RX, y: RY - 48, icon: "📼" }, { x: BX, y: BY - 122, icon: "🏆" }, { x: 532, y: 744, icon: "ℹ️" }],
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
  // 🏆 점프점프 랭킹 1위 게시판 — 1위가 바뀌면 자동으로 바뀜 (World.rankTop 을 게임에서 채워 줌)
  function drawRankBoard(c, bx, by, t) {
    const W = 116, H = 104, x0 = bx - W / 2, y0 = by - H - 6;
    c.fillStyle = "rgba(40,30,20,.28)"; c.fillRect(x0 + 6, by - 4, W - 4, 8);
    c.fillStyle = OUT; c.fillRect(x0 + 16, by - 30, 6, 30); c.fillRect(x0 + W - 22, by - 30, 6, 30);
    c.fillStyle = "#8f5a34"; c.fillRect(x0 + 17, by - 29, 4, 28); c.fillRect(x0 + W - 21, by - 29, 4, 28);
    c.fillStyle = OUT; c.fillRect(x0, y0, W, H - 18);
    c.fillStyle = "#f2c14e"; c.fillRect(x0 + 1, y0 + 1, W - 2, H - 20);
    c.fillStyle = "#fff3a8"; c.fillRect(x0 + 1, y0 + 1, W - 2, 3);
    c.fillStyle = "#fffaf2"; c.fillRect(x0 + 5, y0 + 18, W - 10, H - 40);
    c.textAlign = "center"; c.textBaseline = "middle";
    let fs = 10; c.font = `bold ${fs}px ${FONT}`; while (c.measureText(T("rankBoard")).width > W - 10 && fs > 6) { fs--; c.font = `bold ${fs}px ${FONT}`; }
    c.fillStyle = OUT; c.fillText(T("rankBoard"), bx, y0 + 10);
    const top = window.World.rankTop;
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
      c.fillStyle = "#7a3fc0"; c.font = `bold 9px ${FONT}`; c.fillText(`${Number(top.m).toLocaleString()} m`, bx, y0 + H - 22 + 2);
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
    // 물줄기
    c.fillStyle = "rgba(199,241,250,.9)";
    for (let i = 0; i < 6; i++) { const k = ((t / 90 + i * 3) % 18); c.fillRect(x - 12 - k * 0.6, y - 30 + k * 1.4, 2, 2); c.fillRect(x + 11 + k * 0.6, y - 30 + k * 1.4, 2, 2); }
  }

  // ---------------- 팬 라운지 (커뮤니티 룸) ----------------
  function buildLounge() {
    const W = 640, H = 420;
    const [g, x] = cv(W, H);
    // 바닥 (나무)
    for (let yy = 0; yy < H; yy += 12) for (let xx = 0; xx < W; xx += 48) {
      const off = (yy / 12) % 2 ? 24 : 0;
      x.fillStyle = ((xx + off + yy) / 12) % 3 === 0 ? "#c68757" : "#cf915f"; x.fillRect(xx - off, yy, 48, 12);
      x.fillStyle = "#a86d42"; x.fillRect(xx - off, yy + 11, 48, 1); x.fillRect(xx - off, yy, 1, 12);
    }
    // 벽
    x.fillStyle = OUT; x.fillRect(0, 0, W, 84);
    for (let xx = 0; xx < W; xx += 16) { x.fillStyle = (xx / 16) % 2 ? "#efe4f7" : "#e2d3f3"; x.fillRect(xx, 0, 16, 78); }
    x.fillStyle = "#c98b5a"; x.fillRect(0, 70, W, 10); x.fillStyle = "#a86d42"; x.fillRect(0, 78, W, 4);
    // 창문
    [[40, 16], [520, 16]].forEach(([wx, wy]) => {
      x.fillStyle = OUT; x.fillRect(wx, wy, 80, 44); x.fillStyle = "#9fdcf2"; x.fillRect(wx + 2, wy + 2, 76, 40);
      x.fillStyle = "#ffffff"; x.fillRect(wx + 10, wy + 8, 14, 5); x.fillRect(wx + 50, wy + 16, 18, 5);
      x.fillStyle = OUT; x.fillRect(wx + 39, wy, 2, 44); x.fillStyle = "#ff8fb8"; x.fillRect(wx - 4, wy - 4, 88, 6);
    });
    // 스크린
    x.fillStyle = OUT; x.fillRect(220, 6, 200, 60); x.fillStyle = "#2a2433"; x.fillRect(223, 9, 194, 54);
    x.font = `bold 16px ${FONT}`; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillStyle = "#ff8fb8"; x.fillText("JELLY TALK ♪", 320, 30);
    x.font = `11px ${FONT}`; x.fillStyle = "#8fe3cf"; x.fillText(T("loungeScreen"), 320, 50);
    // 포스터
    [[150, 20, "#9d7cf0"], [460, 20, "#ffd34d"]].forEach(([px, py, col]) => { x.fillStyle = OUT; x.fillRect(px, py, 30, 40); x.fillStyle = col; x.fillRect(px + 2, py + 2, 26, 36); x.fillStyle = "#fff"; x.fillRect(px + 8, py + 10, 14, 14); x.fillStyle = OUT; x.fillRect(px + 13, py + 13, 4, 8); });
    // 무대
    x.fillStyle = OUT; x.fillRect(230, 84, 180, 70); x.fillStyle = "#7a4a8f"; x.fillRect(232, 84, 176, 66); x.fillStyle = "#9d6bb3"; x.fillRect(232, 84, 176, 6);
    x.fillStyle = "#ffd34d"; for (let i = 0; i < 9; i++) x.fillRect(240 + i * 20, 146, 6, 3);
    // 카펫
    x.fillStyle = OUT; x.fillRect(150, 190, 340, 150); x.fillStyle = "#f3a6c0"; x.fillRect(152, 192, 336, 146);
    x.fillStyle = "#ffd1e1"; for (let yy = 200; yy < 332; yy += 16) for (let xx = 160; xx < 480; xx += 16) if (((xx + yy) / 16) % 2) x.fillRect(xx, yy, 6, 6);
    x.fillStyle = "#e07aa0"; x.fillRect(156, 196, 328, 2); x.fillRect(156, 332, 328, 2);
    // 출입문
    x.fillStyle = OUT; x.fillRect(296, 402, 48, 18); x.fillStyle = "#6a3f28"; x.fillRect(298, 404, 44, 16); x.fillStyle = "#ffe8a3"; x.fillRect(306, 408, 28, 4);

    const objects = [], colliders = [];
    const piano = pianoSprite();
    objects.push({ y: 136, x: 300, draw: (c) => c.drawImage(piano, 300, 100) });
    colliders.push([300, 110, 44, 22], [0, 0, W, 90]);
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
    sofa(34, 118, "#9d7cf0", "sA"); sofa(528, 118, "#4fc3b0", "sB"); sofa(34, 352, "#ff7fae", "sC"); sofa(528, 352, "#ffb347", "sD");
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
    const GBX = 124, GBY = 86;
    objects.push({ y: GBY + 68, x: GBX + 48, draw: (c) => c.drawImage(gbBoard, GBX, GBY) });
    colliders.push([GBX + 8, GBY + 44, 80, 24]);
    [[20, 100, "#ff8fb8"], [608, 100, "#b58cff"], [20, 390, "#ffd34d"], [608, 390, "#ff8fb8"]].forEach(([px, py, col]) => { const sp = flowerPot(col); objects.push({ y: py + 16, x: px, draw: (c) => c.drawImage(sp, px - 7, py) }); colliders.push([px - 7, py + 6, 14, 10]); });

    const collide = (px, py) => colliders.some(([a, b, w, h]) => px > a && px < a + w && py > b && py < b + h);
    return {
      id: "lounge", W, H, ground: g, objects, colliders: [], zones: [{ id: "exit", x: 290, y: 388, w: 60, h: 32, label: T("zExit") }, { id: "guestbook", x: 118, y: 150, w: 108, h: 30, label: T("zGuestbook") }, { id: "piano", x: 290, y: 132, w: 64, h: 22, label: T("zPiano") }], seats,
      walkable: (px, py) => px > 10 && px < W - 10 && py > 92 && py < H - 4 && !collide(px, py),
      spawn: { x: 320, y: 380 }, artist: null, piano: { x: 322, y: 118, front: { x: 322, y: 142 } }, icons: [{ x: 172, y: 84, icon: "✍️" }, { x: 322, y: 96, icon: "🎹" }], signs: [{ x: 172, y: 76, key: "gbSign" }],
    };
  }

  window.World = { buildPlaza, buildLounge, rankTop: null };
})();
