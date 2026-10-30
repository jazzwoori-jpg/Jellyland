/* 🧱 젤리 블록 — 젤리게임월드의 블록 쌓기 게임 (테트리스와 같은 규칙)
   - 10 × 20 판, 7가지 블록(I O T S Z J L), 7개 묶음 무작위(7-bag), SRS 회전 + 벽 차기(wall kick)
   - 홀드(블록마다 1번), 다음 블록 5개 미리보기, 고스트(떨어질 자리 표시), 잠금 지연 0.5초(움직이면 최대 15번 연장)
   - 점수: 1줄 100 · 2줄 300 · 3줄 500 · 4줄(젤리 블록!) 800 × 레벨, 연속 4줄(B2B) ×1.5, 콤보 50 × 콤보 × 레벨
           소프트 드롭 1칸 1점 · 하드 드롭 1칸 2점 · 10줄마다 레벨 업 (점점 빨리 떨어짐)
   - 1000점마다 5코인 (한 판 최대 200 · 미니게임 합쳐 하루 최대 600)
   - 조작: ← → 이동 · ↓ 소프트 드롭 · ↑ / X 오른쪽 회전 · Z 왼쪽 회전 · 스페이스 하드 드롭 · C / Shift 홀드 · P 일시정지
           휴대폰은 화면 아래 버튼 (판을 탭하면 회전, 아래로 쓸면 하드 드롭) */
(function () {
  const COLS = 10, ROWS = 20, HID = 2, C = 14;            // 칸 크기 14 (논리 픽셀)
  const BX = 66, BY = 8, W = BX + COLS * C + 66, H = BY + ROWS * C + 8;
  const R = Math.min(4, Math.max(2, Math.ceil((window.devicePixelRatio || 1) * 2)));
  const FONT = "'Galmuri11', 'Galmuri9', 'Apple SD Gothic Neo', 'Hiragino Sans', sans-serif";
  const OUT = "#3a2530";
  const LOCK_DELAY = 0.5, MAX_RESETS = 15, DAS = 0.17, ARR = 0.05, SOFT = 20;
  // 젤리 색 (본색, 밝은색, 어두운색)
  const COL = {
    I: ["#5fd3f0", "#b8f1ff", "#2d9ab8"], O: ["#ffd34d", "#fff3a8", "#d9a300"], T: ["#b58cff", "#e2d1ff", "#7a52c9"],
    S: ["#6fdc7a", "#c8f7c8", "#3a9e48"], Z: ["#ff6f8f", "#ffc2d0", "#c93d5d"], J: ["#5f8fff", "#c6d6ff", "#3557c4"], L: ["#ffa04d", "#ffd8a8", "#c96a1d"],
  };
  const SHAPES = {
    I: [[0, 1], [1, 1], [2, 1], [3, 1]], O: [[1, 0], [2, 0], [1, 1], [2, 1]], T: [[1, 0], [0, 1], [1, 1], [2, 1]],
    S: [[1, 0], [2, 0], [0, 1], [1, 1]], Z: [[0, 0], [1, 0], [1, 1], [2, 1]], J: [[0, 0], [0, 1], [1, 1], [2, 1]], L: [[2, 0], [0, 1], [1, 1], [2, 1]],
  };
  const SIZE = { I: 4, O: 4, T: 3, S: 3, Z: 3, J: 3, L: 3 };
  // SRS 벽 차기 표 (y 는 아래가 + 방향이라 표준 표의 y 부호를 뒤집음)
  const KICK = {
    "0>1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]], "1>0": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
    "1>2": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]], "2>1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    "2>3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]], "3>2": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    "3>0": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]], "0>3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  };
  const KICK_I = {
    "0>1": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]], "1>0": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
    "1>2": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]], "2>1": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
    "2>3": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]], "3>2": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
    "3>0": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]], "0>3": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  };
  const LINE_PTS = [0, 100, 300, 500, 800];
  // 레벨별 한 칸 떨어지는 시간(초) — 표준 공식
  const gravity = (lv) => Math.max(0.012, Math.pow(0.8 - (lv - 1) * 0.007, lv - 1));
  function cellsOf(type, rot) {
    const n = SIZE[type];
    return SHAPES[type].map(([x, y]) => {
      for (let i = 0; i < rot; i++) [x, y] = [n - 1 - y, x];
      return [x, y];
    });
  }
  const snd = (n) => { try { window.SFX && window.SFX[n] && window.SFX[n](); } catch {} };

  function mount(root, opts) {
    const t = opts.t;
    const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    root.innerHTML = `<div class="tg-wrap"><canvas class="tg" width="${W * R}" height="${H * R}"></canvas>
      <div class="tg-pad${touch ? "" : " desk"}">
        <button data-k="hold">${esc(t("tgHold"))}</button><button data-k="ccw">⟲</button><button data-k="cw">⟳</button><button data-k="hard">⤓</button>
        <button data-k="left">◀</button><button data-k="soft">▼</button><button data-k="right">▶</button><button data-k="pause">⏸</button>
      </div>
      <div class="ug-help"><span>${esc(t(touch ? "tgHow2" : "tgHow"))}</span><span>${esc(t("tgHow3"))}</span></div></div>`;
    const cv = root.querySelector("canvas"), ctx = cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    let best = +(localStorage.getItem("jl_best_tet") || 0) || 0;
    let dayLeft = opts.dayLeft == null ? 600 : opts.dayLeft;
    let S = null, raf = 0, last = 0, alive = true;

    function reset() {
      S = { state: "ready", grid: Array.from({ length: ROWS + HID }, () => Array(COLS).fill(null)), bag: [], queue: [], cur: null, hold: null, canHold: true,
        score: 0, lines: 0, level: 1, combo: -1, b2b: false, fall: 0, lock: 0, resets: 0, lowest: 0, fx: [], pops: [], clearing: null, shake: 0, anim: 0,
        coins: 0, cap: Math.min(200, dayLeft), milestone: 0, run: null, result: null, time: 0, paused: false };
      refill();
    }
    function refill() { while (S.queue.length < 7) { if (!S.bag.length) { S.bag = "IOTSZJL".split(""); for (let i = 6; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [S.bag[i], S.bag[j]] = [S.bag[j], S.bag[i]]; } } S.queue.push(S.bag.pop()); } }
    function spawn(type) {
      type = type || S.queue.shift(); refill();
      S.cur = { type, rot: 0, x: type === "O" ? 3 : 3, y: type === "I" ? 0 : 0 };
      S.fall = 0; S.lock = 0; S.resets = 0; S.lowest = S.cur.y;
      if (!fits(S.cur.x, S.cur.y, S.cur.rot)) { gameOver(); return false; }
      // 위쪽 숨은 칸에서 나오면 바로 한 칸 내려 보이게
      if (fits(S.cur.x, S.cur.y + 1, S.cur.rot)) S.cur.y++;
      return true;
    }
    function fits(x, y, rot, type = S.cur.type) {
      for (const [cx, cy] of cellsOf(type, rot)) {
        const gx = x + cx, gy = y + cy;
        if (gx < 0 || gx >= COLS || gy >= ROWS + HID) return false;
        if (gy >= 0 && S.grid[gy][gx]) return false;
      }
      return true;
    }
    const onGround = () => !fits(S.cur.x, S.cur.y + 1, S.cur.rot);
    function moved() { // 바닥에 닿은 채로 움직이면 잠금 시간 다시 (최대 15번)
      if (onGround() && S.resets < MAX_RESETS) { S.lock = 0; S.resets++; }
    }
    function move(dx) {
      if (!S.cur || S.clearing) return false;
      if (fits(S.cur.x + dx, S.cur.y, S.cur.rot)) { S.cur.x += dx; snd("tMove"); moved(); return true; }
      return false;
    }
    function rotate(dir) {
      if (!S.cur || S.clearing || S.cur.type === "O") { if (S.cur && S.cur.type === "O") snd("tRot"); return; }
      const from = S.cur.rot, to = (from + (dir > 0 ? 1 : 3)) % 4;
      const table = (S.cur.type === "I" ? KICK_I : KICK)[`${from}>${to}`];
      for (const [kx, ky] of table) {
        if (fits(S.cur.x + kx, S.cur.y + ky, to)) { S.cur.x += kx; S.cur.y += ky; S.cur.rot = to; snd("tRot"); moved(); return; }
      }
    }
    function softStep() {
      if (fits(S.cur.x, S.cur.y + 1, S.cur.rot)) { S.cur.y++; if (S.cur.y > S.lowest) { S.lowest = S.cur.y; S.resets = 0; } return true; }
      return false;
    }
    function hardDrop() {
      if (!S.cur || S.clearing) return;
      let n = 0; while (fits(S.cur.x, S.cur.y + 1, S.cur.rot)) { S.cur.y++; n++; }
      S.score += n * 2; snd("tHard"); S.shake = 0.08;
      for (const [cx, cy] of cellsOf(S.cur.type, S.cur.rot)) for (let k = 0; k < 2; k++) S.fx.push({ x: BX + (S.cur.x + cx + Math.random()) * C, y: BY + (S.cur.y + cy - HID + 1) * C, vx: (Math.random() - 0.5) * 40, vy: -20 - Math.random() * 40, g: 120, life: 0.35, col: COL[S.cur.type][1], s: 2 });
      lockPiece();
    }
    function doHold() {
      if (!S.cur || !S.canHold || S.clearing) return;
      const ty = S.cur.type; snd("tHold");
      if (S.hold) { const h = S.hold; S.hold = ty; spawn(h); } else { S.hold = ty; spawn(); }
      S.canHold = false;
    }
    function lockPiece() {
      let above = true;
      for (const [cx, cy] of cellsOf(S.cur.type, S.cur.rot)) { const gy = S.cur.y + cy; if (gy >= 0) S.grid[gy][S.cur.x + cx] = S.cur.type; if (gy >= HID) above = false; }
      S.cur = null; S.canHold = true; snd("tLock");
      if (above) return gameOver(); // 판 위로 완전히 넘쳐서 잠김
      const full = []; for (let y = 0; y < ROWS + HID; y++) if (S.grid[y].every(Boolean)) full.push(y);
      if (full.length) {
        const n = full.length, tetris = n === 4;
        let pts = LINE_PTS[n] * S.level;
        if (tetris && S.b2b) { pts = Math.floor(pts * 1.5); S.pops.push({ x: BX + COLS * C / 2, y: BY + 120, text: "B2B!", life: 1.2, col: "#ff4f9a", big: false }); }
        S.b2b = tetris ? true : false;
        S.combo++;
        if (S.combo > 0) { pts += 50 * S.combo * S.level; S.pops.push({ x: BX + COLS * C / 2, y: BY + 150, text: `${S.combo} COMBO`, life: 1, col: "#7a3fc0" }); }
        S.score += pts;
        S.clearing = { rows: full, t: 0 };
        snd(tetris ? "tTetris" : "tClear"); if (tetris) S.shake = 0.35;
        S.pops.push({ x: BX + COLS * C / 2, y: BY + (full[0] - HID) * C, text: tetris ? t("tgTetris") : n === 3 ? "TRIPLE!" : n === 2 ? "DOUBLE!" : "+" + pts, life: 1.2, col: tetris ? "#ff4f9a" : "#3a2530", big: tetris });
        for (const y of full) for (let x = 0; x < COLS; x++) for (let k = 0; k < 3; k++) S.fx.push({ x: BX + (x + 0.5) * C, y: BY + (y - HID + 0.5) * C, vx: (Math.random() - 0.5) * 220, vy: -60 - Math.random() * 160, g: 400, life: 0.7 + Math.random() * 0.3, col: COL[S.grid[y][x]][(k % 2)], s: 3 });
      } else { S.combo = -1; spawn(); }
    }
    function finishClear() {
      const rows = S.clearing.rows; S.clearing = null;
      for (const y of rows.sort((a, b) => a - b)) { S.grid.splice(y, 1); S.grid.unshift(Array(COLS).fill(null)); }
      const before = S.level;
      S.lines += rows.length; S.level = 1 + Math.floor(S.lines / 10);
      if (S.level > before) { snd("star"); S.pops.push({ x: BX + COLS * C / 2, y: BY + 100, text: `LEVEL ${S.level}!`, life: 1.5, col: "#d9a300", big: true }); }
      spawn();
    }
    function gameOver() { if (S.state !== "run") return; S.cur = null; snd("laugh"); finish(); }

    // ---------- 입력 ----------
    const held = { left: 0, right: 0, soft: 0 };
    let dasDir = 0, dasT = 0, arrT = 0;
    function act(k, down) {
      if (!S) return;
      if (down && (S.state === "ready" || (S.state === "over" && S.result && performance.now() - S.overAt > 700))) { if (S.state === "over") reset(); start(); return; }
      if (S.state !== "run") return;
      if (k === "pause") { if (down) { S.paused = !S.paused; } return; }
      if (S.paused) return;
      if (k === "left" || k === "right") {
        held[k] = down;
        if (down) { move(k === "left" ? -1 : 1); dasDir = k === "left" ? -1 : 1; dasT = 0; arrT = 0; }
        else if (dasDir === (k === "left" ? -1 : 1)) { dasDir = held.left ? -1 : held.right ? 1 : 0; dasT = 0; }
        return;
      }
      if (k === "soft") { held.soft = down; return; }
      if (!down) return;
      if (k === "cw") rotate(1); else if (k === "ccw") rotate(-1); else if (k === "hard") hardDrop(); else if (k === "hold") doHold();
    }
    const KEYS = { ArrowLeft: "left", ArrowRight: "right", ArrowDown: "soft", ArrowUp: "cw", KeyX: "cw", KeyZ: "ccw", ControlLeft: "ccw", Space: "hard", KeyC: "hold", ShiftLeft: "hold", ShiftRight: "hold", KeyP: "pause", Escape: "pause", KeyA: "left", KeyD: "right", KeyS: "soft", KeyW: "cw" };
    const kd = (e) => {
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
      const k = KEYS[e.code]; if (!k) { if (e.code === "Enter" && S.state !== "run") act("cw", true); return; }
      if (k === "pause" && e.code === "Escape" && S.state !== "run") return; // Esc 는 창 닫기에 양보
      e.preventDefault(); e.stopPropagation();
      if (e.repeat) return;
      act(k, true);
    };
    const ku = (e) => { const k = KEYS[e.code]; if (k) act(k, false); };
    window.addEventListener("keydown", kd, true); window.addEventListener("keyup", ku, true);
    // 화면 버튼 (누르고 있으면 계속)
    root.querySelectorAll(".tg-pad [data-k]").forEach((b) => {
      const k = b.dataset.k;
      b.addEventListener("pointerdown", (e) => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch {} b.classList.add("on"); act(k, true); });
      const up = () => { b.classList.remove("on"); act(k, false); };
      b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up); b.addEventListener("lostpointercapture", up);
      b.addEventListener("contextmenu", (e) => e.preventDefault());
    });
    // 판 터치: 탭 = 회전, 아래로 쓸기 = 하드 드롭, 좌우로 끌기 = 이동
    let sw = null;
    cv.addEventListener("pointerdown", (e) => { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch {} if (S.state !== "run") { act("cw", true); return; } sw = { x: e.clientX, y: e.clientY, t: performance.now(), mx: 0, moved: false }; });
    cv.addEventListener("pointermove", (e) => {
      if (!sw) return; const r = cv.getBoundingClientRect(), cell = (r.width / W) * C;
      const steps = Math.trunc((e.clientX - sw.x) / cell) - sw.mx;
      if (steps) { for (let i = 0; i < Math.abs(steps); i++) move(Math.sign(steps)); sw.mx += steps; sw.moved = true; }
    });
    cv.addEventListener("pointerup", (e) => {
      if (!sw) return; const dy = e.clientY - sw.y, dt = performance.now() - sw.t;
      if (dy > 50 && dy / Math.max(1, dt) > 0.4) hardDrop(); else if (!sw.moved && Math.abs(dy) < 12) rotate(1);
      sw = null;
    });
    cv.addEventListener("contextmenu", (e) => e.preventDefault());

    function start() {
      S.state = "run"; S.time = 0; spawn();
      opts.onStart && opts.onStart().then((r) => { if (!S) return; S.run = r && r.run; if (r && r.dayLeft != null) { dayLeft = r.dayLeft; S.cap = Math.min(200, dayLeft); S.coins = Math.min(S.coins, S.cap); } }).catch(() => {});
    }
    async function finish() {
      S.state = "over"; S.overAt = performance.now();
      const m = S.score;
      if (m > best) { best = m; try { localStorage.setItem("jl_best_tet", String(m)); } catch {} }
      S.result = { m, coins: S.coins, saving: true };
      const my = S;
      try {
        for (let i = 0; i < 20 && !my.run; i++) await new Promise((r) => setTimeout(r, 150));
        const r = my.run ? await opts.onFinish(my.run, m) : null;
        if (r) { my.result.coins = r.coins; if (r.best > best) best = r.best; if (r.dayLeft != null) dayLeft = r.dayLeft; }
      } catch {}
      my.result.saving = false;
    }

    // ---------- 진행 ----------
    function step(dt) {
      S.anim += dt;
      for (const f of S.fx) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += (f.g || 0) * dt; f.life -= dt; }
      S.fx = S.fx.filter((f) => f.life > 0);
      for (const p of S.pops) { p.y -= 18 * dt; p.life -= dt; }
      S.pops = S.pops.filter((p) => p.life > 0);
      if (S.shake > 0) S.shake -= dt;
      if (S.state !== "run" || S.paused) return;
      S.time += dt;
      if (S.clearing) { S.clearing.t += dt; if (S.clearing.t > 0.32) finishClear(); return; }
      if (!S.cur) return;
      // 좌우 자동 반복 (DAS/ARR)
      if (dasDir && (dasDir < 0 ? held.left : held.right)) {
        dasT += dt;
        if (dasT >= DAS) { arrT += dt; while (arrT >= ARR) { arrT -= ARR; if (!move(dasDir)) break; } }
      }
      // 중력
      const g = gravity(S.level) / (held.soft ? SOFT : 1);
      S.fall += dt;
      while (S.fall >= g && S.cur) {
        S.fall -= g;
        if (softStep()) { if (held.soft) S.score += 1; }
        else { S.fall = 0; break; }
      }
      if (!S.cur) return;
      if (onGround()) { S.lock += dt; if (S.lock >= LOCK_DELAY || S.resets >= MAX_RESETS && S.lock >= 0.05) lockPiece(); }
      else S.lock = 0;
      // 1000점마다 5코인
      const ms = Math.floor(S.score / 1000);
      while (S.milestone < ms) {
        S.milestone++;
        if (S.coins < S.cap) { S.coins = Math.min(S.cap, S.coins + 5); snd("coin"); }
      }
    }

    // ---------- 그리기 ----------
    function block(x, y, type, alpha = 1, size = C) {
      const [c1, c2, c3] = COL[type];
      ctx.globalAlpha = alpha;
      ctx.fillStyle = OUT; ctx.fillRect(x, y, size, size);
      ctx.fillStyle = c3; ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
      ctx.fillStyle = c1; ctx.fillRect(x + 1, y + 1, size - 3, size - 3);
      ctx.fillStyle = c2; ctx.fillRect(x + 2, y + 2, size - 6, 2); ctx.fillRect(x + 2, y + 2, 2, size - 7); // 젤리 반짝임
      ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.fillRect(x + 3, y + 3, 2, 2);
      ctx.globalAlpha = 1;
    }
    function mini(type, cx, cy, s = 9) {
      const cells = cellsOf(type, 0);
      const xs = cells.map((c) => c[0]), ys = cells.map((c) => c[1]);
      const w = (Math.max(...xs) - Math.min(...xs) + 1) * s, h = (Math.max(...ys) - Math.min(...ys) + 1) * s;
      for (const [x, y] of cells) block(Math.round(cx - w / 2 + (x - Math.min(...xs)) * s), Math.round(cy - h / 2 + (y - Math.min(...ys)) * s), type, 1, s);
    }
    function panelBox(x, y, w, h, title) {
      ctx.fillStyle = "rgba(58,37,48,.18)"; ctx.fillRect(x + 2, y + 2, w, h);
      ctx.fillStyle = OUT; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
      ctx.fillStyle = "#fff8ea"; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#b58cff"; ctx.fillRect(x, y, w, 11);
      ctx.font = `bold 8px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#fff"; ctx.fillText(title, x + w / 2, y + 6);
    }
    function draw() {
      ctx.setTransform(R, 0, 0, R, 0, 0);
      if (S.shake > 0) ctx.translate((Math.random() - 0.5) * 4 * Math.min(1, S.shake * 6), (Math.random() - 0.5) * 3 * Math.min(1, S.shake * 6));
      // 배경: 레벨이 오를수록 하늘 → 노을 → 밤
      const k = Math.min(1, (S.level - 1) / 12);
      const mix = (a, b) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, `rgb(${mix([255, 225, 240], [60, 40, 110])})`); g.addColorStop(1, `rgb(${mix([214, 236, 255], [140, 80, 170])})`);
      ctx.fillStyle = g; ctx.fillRect(-10, -10, W + 20, H + 20);
      ctx.fillStyle = "rgba(255,255,255,.5)";
      for (let i = 0; i < 14; i++) { const x = (i * 53 + S.anim * (6 + (i % 3) * 4)) % (W + 20) - 10, y = (i * 37) % H; const s = i % 3 ? 1 : 2; ctx.fillRect(x, y, s, s); }
      // 판
      ctx.fillStyle = OUT; ctx.fillRect(BX - 3, BY - 3, COLS * C + 6, ROWS * C + 6);
      ctx.fillStyle = "#2b2140"; ctx.fillRect(BX, BY, COLS * C, ROWS * C);
      ctx.fillStyle = "rgba(255,255,255,.05)";
      for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) if ((x + y) % 2) ctx.fillRect(BX + x * C, BY + y * C, C, C);
      ctx.fillStyle = "rgba(255,255,255,.07)";
      for (let x = 1; x < COLS; x++) ctx.fillRect(BX + x * C, BY, 1, ROWS * C);
      // 쌓인 블록
      const clr = S.clearing ? new Set(S.clearing.rows) : null;
      for (let y = HID; y < ROWS + HID; y++) for (let x = 0; x < COLS; x++) {
        const c = S.grid[y][x]; if (!c) continue;
        if (clr && clr.has(y)) { const p = S.clearing.t / 0.32; if (Math.floor(p * 8) % 2 === 0) { ctx.fillStyle = "#fff"; ctx.fillRect(BX + x * C, BY + (y - HID) * C, C, C); } else block(BX + x * C, BY + (y - HID) * C, c, 1 - p); continue; }
        block(BX + x * C, BY + (y - HID) * C, c);
      }
      // 고스트 + 지금 블록
      if (S.cur && S.state === "run") {
        let gy = S.cur.y; while (fits(S.cur.x, gy + 1, S.cur.rot)) gy++;
        for (const [cx, cy] of cellsOf(S.cur.type, S.cur.rot)) {
          const yy = gy + cy - HID; if (yy < 0) continue;
          const X = BX + (S.cur.x + cx) * C, Y = BY + yy * C;
          ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.fillRect(X + 1, Y + 1, C - 2, C - 2);
          ctx.strokeStyle = COL[S.cur.type][1]; ctx.globalAlpha = 0.7; ctx.lineWidth = 1; ctx.strokeRect(X + 1.5, Y + 1.5, C - 3, C - 3); ctx.globalAlpha = 1;
        }
        const lockFlash = onGround() ? 0.75 + 0.25 * Math.cos(S.lock * 30) : 1;
        for (const [cx, cy] of cellsOf(S.cur.type, S.cur.rot)) { const yy = S.cur.y + cy - HID; if (yy < 0) continue; block(BX + (S.cur.x + cx) * C, BY + yy * C, S.cur.type, lockFlash); }
      }
      // 왼쪽: 홀드 · 점수
      panelBox(6, BY, 52, 44, t("tgHold"));
      if (S.hold) { ctx.globalAlpha = S.canHold ? 1 : 0.4; mini(S.hold, 32, BY + 28); ctx.globalAlpha = 1; }
      panelBox(6, BY + 54, 52, 110, t("tgInfo"));
      const stat = (label, val, y) => { ctx.textAlign = "center"; ctx.font = `8px ${FONT}`; ctx.fillStyle = "#7a6a78"; ctx.fillText(label, 32, y); ctx.font = `bold 10px ${FONT}`; ctx.fillStyle = OUT; ctx.fillText(val, 32, y + 11); };
      stat(t("tgScore"), S.score.toLocaleString(), BY + 72);
      stat(t("tgLines"), String(S.lines), BY + 98);
      stat("LEVEL", String(S.level), BY + 124);
      stat("🪙", `${S.coins}/${S.cap}`, BY + 150);
      panelBox(6, BY + 174, 52, 34, t("gameBest"));
      ctx.font = `bold 9px ${FONT}`; ctx.fillStyle = "#7a3fc0"; ctx.textAlign = "center"; ctx.fillText(best.toLocaleString(), 32, BY + 196);
      // 오른쪽: 다음 블록 5개
      const NX = BX + COLS * C + 8;
      panelBox(NX, BY, 52, 168, t("tgNext"));
      S.queue.slice(0, 5).forEach((q, i) => mini(q, NX + 26, BY + 30 + i * 30, i ? 8 : 10));
      // 효과
      for (const f of S.fx) { ctx.globalAlpha = Math.min(1, f.life * 2); ctx.fillStyle = f.col; ctx.fillRect(Math.round(f.x), Math.round(f.y), f.s, f.s); }
      ctx.globalAlpha = 1;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (const p of S.pops) {
        ctx.font = `bold ${p.big ? 15 : 10}px ${FONT}`; ctx.globalAlpha = Math.min(1, p.life * 2);
        ctx.fillStyle = OUT; ctx.fillText(p.text, p.x + 1, p.y + 1); ctx.fillStyle = "#fff"; ctx.fillText(p.text, p.x, p.y - 1); ctx.fillStyle = p.col; ctx.fillText(p.text, p.x, p.y);
        ctx.globalAlpha = 1;
      }
      if (S.paused && S.state === "run") panel([t("tgPaused"), t("tgResume")]);
      if (S.state === "ready") panel([t("tgTitle"), dayLeft > 0 ? t("gameDayLeft", { n: dayLeft }) : t("gameDayDone"), t("tgLegend"), t("gameStart")]);
      if (S.state === "over") {
        const r = S.result || { m: S.score, coins: S.coins };
        panel([t("gameOver"), `${t("tgScore")} ${r.m.toLocaleString()} · ${t("gameBest")} ${best.toLocaleString()}`, `${t("gameEarn")} 🪙 ${r.coins}${r.saving ? "  (" + t("gameSaving") + ")" : ""}`, r.saving ? "" : dayLeft > 0 ? t("gameDayLeft", { n: dayLeft }) : t("gameDayDone"), performance.now() - S.overAt > 700 ? t("gameAgain") : ""]);
      }
    }
    function panel(lines) {
      const w = 170, h = 22 + lines.length * 16, x = BX + (COLS * C - w) / 2, y = BY + (ROWS * C - h) / 2 - 10;
      ctx.fillStyle = "rgba(20,10,30,.35)"; ctx.fillRect(BX, BY, COLS * C, ROWS * C);
      ctx.fillStyle = "rgba(58,37,48,.25)"; ctx.fillRect(x + 3, y + 3, w, h);
      ctx.fillStyle = OUT; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
      ctx.fillStyle = "#fff8ea"; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#b58cff"; ctx.fillRect(x, y, w, 4);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      lines.forEach((ln, i) => {
        const first = i === 0, lastL = i === lines.length - 1 && ln;
        let fs = first ? 13 : lastL ? 10 : 8;
        ctx.font = `${first || lastL ? "bold " : ""}${fs}px ${FONT}`;
        while (ctx.measureText(ln).width > w - 10 && fs > 6) { fs--; ctx.font = `${first || lastL ? "bold " : ""}${fs}px ${FONT}`; }
        ctx.fillStyle = first ? "#7a3fc0" : lastL ? (Math.floor(S.anim * 2) % 2 ? "#ff4f9a" : "#7a3fc0") : OUT;
        ctx.fillText(ln, x + w / 2, y + 16 + i * 16);
      });
    }
    function loop(now) {
      if (!alive) return;
      const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      step(dt); draw();
      raf = requestAnimationFrame(loop);
    }
    reset();
    raf = requestAnimationFrame(loop);
    const onVis = () => { if (document.hidden && S && S.state === "run") S.paused = true; };
    document.addEventListener("visibilitychange", onVis);
    return {
      destroy() { alive = false; cancelAnimationFrame(raf); window.removeEventListener("keydown", kd, true); window.removeEventListener("keyup", ku, true); document.removeEventListener("visibilitychange", onVis); S = null; },
      _debug: () => S,
    };
  }
  function esc(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  window.TetrisGame = { mount };
})();
