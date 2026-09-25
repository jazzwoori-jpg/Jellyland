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
    const gardens = [[420, 380], [860, 380], [420, 650], [860, 650]];
    const buildings = [
      { id: "gallery", name: T("bGallery"), x: 250, y: 118, w: 190, h: 130, roof: "#d8434e", wall: "#fffaf2", trim: "#c98b5a", icon: "📷" },
      { id: "albums", name: T("bAlbums"), x: 840, y: 118, w: 190, h: 130, roof: "#a77ce0", wall: "#fffaf2", trim: "#a86d42", icon: "💿" },
      { id: "cinema", name: T("bCinema"), x: 150, y: 420, w: 170, h: 130, roof: "#f2a93b", wall: "#fff6e8", trim: "#8f5a34", icon: "🎬" },
      { id: "lounge", name: T("bLounge"), x: 960, y: 420, w: 176, h: 136, roof: "#5fb8c9", wall: "#fffaf2", trim: "#a86d42", icon: "💬" },
    ];
    const paving = (x, y) => {
      const dx = Math.abs(x - CX), dy = Math.abs(y - CY);
      let p = (dx <= 520 && dy <= 400 && dx + dy <= 780) || (Math.abs(x - CX) <= 60 && y > CY);
      if (!p) return false;
      for (const [gx, gy] of gardens) if ((x - gx) ** 2 + (y - gy) ** 2 < 46 * 46) return false;
      return true;
    };
    const mask = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) mask[y * W + x] = paving(x, y) ? 1 : 0;
    const isP = (x, y) => x >= 0 && y >= 0 && x < W && y < H && mask[y * W + x] === 1;

    const [g, gx] = cv(W, H);
    const img = gx.createImageData(W, H);
    const d = img.data;
    const r = rng(7);
    const C = {
      grassA: hex("#5aa04a"), grassB: hex("#4c9041"), grassC: hex("#6db85a"),
      pA: hex("#f0e0bf"), pB: hex("#e6d1a6"), pL: hex("#d3b986"), edge: hex("#a8845a"), edge2: hex("#c7a574"),
      brick: hex("#b8473c"), brick2: hex("#cf5f4c"), rim: hex("#7a2f2a"), gold: hex("#f2c14e"), carpet: hex("#c9384a"), center: hex("#f3dcae"), center2: hex("#e7c68d"),
    };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      let col;
      if (!mask[y * W + x]) {
        const n = r();
        col = n < 0.06 ? C.grassB : n < 0.1 ? C.grassC : C.grassA;
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
      if (mask[y * W + x]) continue;
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
    const tr = rng(99);
    const forest = [];
    for (let y = -6; y < H + 30; y += 22) for (let x = -6; x < W + 10; x += 24) {
      const px = x + ((tr() * 12) | 0) + ((y / 22) % 2 ? 12 : 0), py = y + ((tr() * 8) | 0);
      if (px < 0 || py < 0 || px >= W || py >= H) { forest.push([px, py]); continue; }
      let clear = true, nearP = false;
      for (let a = -14; a <= 14 && clear; a += 7) for (let b = -6; b <= 4; b += 5) { if (isP(px + a, py + b)) clear = false; }
      if (!clear || inB(px, py)) continue;
      for (let a = -40; a <= 40 && !nearP; a += 10) for (let b = -40; b <= 10; b += 10) if (isP(px + a, py + b)) nearP = true;
      if (nearP) objects.push({ y: py, x: px, draw: (c) => c.drawImage(TREES[(px + py) % 3], px - 17, py - 40) });
      else forest.push([px, py]);
    }
    for (const [cx, cy] of gardens) objects.push({ y: cy + 6, x: cx, draw: (c) => c.drawImage(TREES[1], cx - 17, cy - 34) });
    forest.sort((a, b) => a[1] - b[1]).forEach(([px, py]) => gx.drawImage(TREES[Math.abs(px * 7 + py) % 3], px - 17, py - 40));

    // 건물
    for (const b of buildings) {
      b.sprite = buildingSprite(b);
      objects.push({ y: b.y + b.h, x: b.x, draw: (c) => c.drawImage(b.sprite, b.x - 2, b.y) });
      const wt = Math.round(b.h * 0.42);
      colliders.push([b.x, b.y + wt - 10, b.w, b.h - wt + 8]);
      b.door = { x: b.x + b.w / 2, y: b.y + b.h + 4 };
    }

    // 피아노 (무대 중앙)
    const piano = pianoSprite();
    objects.push({ y: CY + 6, x: CX, draw: (c) => c.drawImage(piano, CX - 22, CY - 30) });
    colliders.push([CX - 22, CY - 14, 44, 20]);

    // 분수 (북쪽)
    const FX = 640, FY = 215;
    objects.push({ y: FY + 20, x: FX, anim: true, draw: (c, t) => drawFountain(c, FX, FY, t) });
    colliders.push([FX - 36, FY - 18, 72, 38]);

    // 가판대
    const stalls = [
      [520, 300, "#ff8fb8", "#fff", ["#ffd34d", "#ff6b6b", "#8fe3cf"]],
      [720, 300, "#9d7cf0", "#fff", ["#ff8fb8", "#ffd34d", "#62c3cf"]],
      [300, 720, "#4fc3b0", "#fff", ["#ff6b6b", "#fff3a8", "#9d7cf0"]],
      [940, 720, "#ffb347", "#fff", ["#8fe3cf", "#ff8fb8", "#ffd34d"]],
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
    const seats = [];
    [[462, 470], [818, 470], [462, 560], [818, 560]].forEach(([bx, by], i) => addBench(objects, colliders, seats, "b" + i, bx, by));
    // 테이블 세트 5개 (광장 바닥 위에 있는지 확인하고 배치)
    const okArea = (x0, y0, w, h) => { for (let yy = y0; yy <= y0 + h; yy += 6) for (let xx = x0; xx <= x0 + w; xx += 6) if (!isP(xx, yy)) return false; return true; };
    const tableSpots = [[335, 330], [945, 330], [300, 640], [985, 640], [530, 700], [750, 700], [640, 360]];
    let tCount = 0;
    for (const [tx, ty] of tableSpots) { if (tCount >= 5) break; if (!okArea(tx - 30, ty - 44, 60, 94)) continue; addTableSet(objects, colliders, seats, "t" + tCount, tx, ty); tCount++; }
    [[560, 860, "#ff8fb8"], [720, 860, "#ffd34d"], [250, 600, "#b58cff"], [1030, 600, "#ff8fb8"], [480, 200, "#ffd34d"], [800, 200, "#b58cff"]].forEach(([px, py, col]) => {
      const sp = flowerPot(col); objects.push({ y: py + 16, x: px, draw: (c) => c.drawImage(sp, px - 7, py) }); colliders.push([px - 6, py + 8, 12, 8]);
    });

    // 남쪽 게이트
    const gate = gateSprite();
    objects.push({ y: 914, x: 640, draw: (c) => c.drawImage(gate, 640 - 80, 860) });
    colliders.push([560, 900, 18, 14], [702, 900, 18, 14]);

    // 안내 게시판
    const board = boardSprite();
    objects.push({ y: 806, x: 560, draw: (c) => c.drawImage(board, 540, 780) });
    colliders.push([542, 796, 36, 10]);

    const zones = [
      ...buildings.map((b) => ({ id: b.id, x: b.door.x - 20, y: b.door.y - 8, w: 40, h: 26, label: b.name })),
      { id: "profile", x: CX - 60, y: CY - 10, w: 120, h: 70, label: T("zProfile") },
      { id: "guide", x: 530, y: 800, w: 60, h: 26, label: T("zGuide") },
    ];

    return {
      id: "plaza", W, H, ground: g, objects, colliders, zones, buildings, seats,
      walkable: (x, y) => isP(x | 0, y | 0),
      spawn: { x: 640, y: 840 },
      artist: { x: 604, y: 506, dir: "down" },
      icons: buildings.map((b) => ({ x: b.x + b.w / 2 + 2, y: b.y - 4, icon: b.icon, label: b.name })),
      npcArea: [300, 300, 700, 500],
    };
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
  function boardSprite() {
    const [c, x] = cv(40, 30);
    x.fillStyle = "rgba(40,30,20,.25)"; x.fillRect(4, 26, 34, 4);
    x.fillStyle = OUT; x.fillRect(8, 16, 3, 12); x.fillRect(29, 16, 3, 12); x.fillRect(0, 0, 40, 20);
    x.fillStyle = "#c98b5a"; x.fillRect(1, 1, 38, 18); x.fillStyle = "#fff8ea"; x.fillRect(4, 3, 14, 12); x.fillRect(21, 4, 15, 9);
    x.fillStyle = "#ff8fb8"; x.fillRect(6, 5, 10, 2); x.fillStyle = "#9d7cf0"; x.fillRect(23, 6, 11, 2);
    x.fillStyle = "#e0405a"; x.fillRect(10, 2, 2, 2); x.fillRect(28, 3, 2, 2);
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
    // 소파
    const sofa = (sx, sy, col) => { const [c, s] = cv(56, 26); s.fillStyle = OUT; s.fillRect(0, 0, 56, 24); s.fillStyle = col; s.fillRect(1, 1, 54, 10); s.fillStyle = Avatar.mix(col, "#ffffff", 0.25); s.fillRect(4, 11, 48, 10); s.fillStyle = col; s.fillRect(1, 8, 5, 15); s.fillRect(50, 8, 5, 15); objects.push({ y: sy + 24, x: sx, draw: (cc) => cc.drawImage(c, sx, sy) }); colliders.push([sx, sy + 6, 56, 18]); };
    sofa(40, 120, "#9d7cf0"); sofa(544, 120, "#4fc3b0"); sofa(40, 360, "#ff7fae"); sofa(544, 360, "#ffb347");
    // 테이블
    const table = (tx, ty) => { const [c, s] = cv(30, 22); s.fillStyle = "rgba(40,30,20,.25)"; s.fillRect(3, 17, 26, 5); s.fillStyle = OUT; s.fillRect(0, 0, 30, 12); s.fillRect(13, 10, 4, 10); s.fillStyle = "#fff8ea"; s.fillRect(1, 1, 28, 9); s.fillStyle = "#ff8fb8"; s.fillRect(10, 3, 4, 4); s.fillStyle = "#ffd34d"; s.fillRect(17, 4, 3, 3); objects.push({ y: ty + 20, x: tx, draw: (cc) => cc.drawImage(c, tx, ty) }); colliders.push([tx, ty + 4, 30, 14]); };
    table(80, 240); table(530, 240); table(120, 170); table(490, 170);
    // 방명록 (조젤리에게 남기는 글)
    const gb = (() => { const [c, s] = cv(30, 34); s.fillStyle = "rgba(40,30,20,.25)"; s.fillRect(4, 29, 24, 5); s.fillStyle = OUT; s.fillRect(12, 14, 6, 18); s.fillRect(6, 29, 18, 4); s.fillStyle = "#8f5a34"; s.fillRect(13, 15, 4, 16); s.fillStyle = OUT; s.fillRect(0, 2, 30, 14); s.fillStyle = "#a77ce0"; s.fillRect(1, 3, 28, 12); s.fillStyle = "#fffaf2"; s.fillRect(3, 4, 11, 9); s.fillRect(16, 4, 11, 9); s.fillStyle = "#c9b8e8"; for (let i = 0; i < 3; i++) { s.fillRect(5, 6 + i * 2, 7, 1); s.fillRect(18, 6 + i * 2, 7, 1); } s.fillStyle = "#d8434e"; s.fillRect(14, 0, 2, 6); return c; })();
    objects.push({ y: 146, x: 470, draw: (c) => c.drawImage(gb, 455, 114) });
    colliders.push([457, 130, 26, 16]);
    [[20, 100, "#ff8fb8"], [608, 100, "#b58cff"], [20, 390, "#ffd34d"], [608, 390, "#ff8fb8"]].forEach(([px, py, col]) => { const sp = flowerPot(col); objects.push({ y: py + 16, x: px, draw: (c) => c.drawImage(sp, px - 7, py) }); colliders.push([px - 7, py + 6, 14, 10]); });

    const collide = (px, py) => colliders.some(([a, b, w, h]) => px > a && px < a + w && py > b && py < b + h);
    return {
      id: "lounge", W, H, ground: g, objects, colliders: [], zones: [{ id: "exit", x: 290, y: 388, w: 60, h: 32, label: T("zExit") }, { id: "guestbook", x: 450, y: 146, w: 40, h: 26, label: T("zGuestbook") }], seats: [],
      walkable: (px, py) => px > 10 && px < W - 10 && py > 92 && py < H - 4 && !collide(px, py),
      spawn: { x: 320, y: 380 }, artist: null, icons: [{ x: 470, y: 112, icon: "📖" }],
    };
  }

  window.World = { buildPlaza, buildLounge };
})();
