/* 🍬 젤리X젤리 — 젤리게임월드의 매치3 퍼즐 (주주클럽 방식)
   - 8 × 8 판, 7가지 젤리 (딸기·오렌지·레몬·사과·소다·포도·복숭아)
   - 이웃한 젤리 2개를 바꿔서 같은 젤리를 가로·세로로 3개 이상 맞추면 터져요 (못 맞추면 제자리로)
   - 점수: 3개 30 · 4개 60 · 5개 100 · 6개 150 · 7개 이상 200 (× 레벨 × 연쇄 콤보)
   - 시간 막대가 계속 줄어들고, 젤리를 터뜨리면 다시 채워져요. 막대가 다 줄면 게임 끝
   - 레벨마다 정해진 횟수만큼 맞추면 레벨 업 (막대가 가득 차고, 점점 빨리 줄어요)
   - 1000점마다 5코인 (한 판 최대 200 · 미니게임 합쳐 하루 최대 600)
   - 조작: 젤리를 눌러서 옆 젤리 쪽으로 밀기(또는 두 번 눌러 바꾸기) · 키보드 방향키 + 스페이스 · P 일시정지 */
(function () {
  const N = 8, TYPES = 7, C = 30;                        // 칸 크기 30 (논리 픽셀)
  const BX = 8, BY = 40, W = BX * 2 + N * C, H = BY + N * C + 76;
  const IY = BY + N * C + 42, ITEMS = ["bomb", "laser", "sweep"], ICON = { bomb: "💣", laser: "⚡", sweep: "🧹" }; // 아이템 칸
  const R = Math.min(4, Math.max(2, Math.ceil((window.devicePixelRatio || 1) * 2)));
  const FONT = "'Galmuri11', 'Galmuri9', 'Apple SD Gothic Neo', 'Hiragino Sans', sans-serif";
  const OUT = "#3a2530";
  const T_MAX = 40;                                       // 시간 막대 (초)
  const SWAP_T = 0.14, CLEAR_T = 0.28;
  const PTS = (n) => (n >= 7 ? 200 : [0, 0, 0, 30, 60, 100, 150][n]);
  // 젤리 색 (본색, 밝은색, 어두운색)
  const COL = [
    ["#ff5d6c", "#ffb3bb", "#c9303f"], // 딸기
    ["#ff9a3c", "#ffd2a3", "#c9661a"], // 오렌지
    ["#ffd84a", "#fff3b0", "#c9a414"], // 레몬
    ["#6fd36a", "#c8f5c0", "#3a9a3a"], // 사과
    ["#57b8ff", "#bfe4ff", "#2a7cc4"], // 소다
    ["#a77cf0", "#ddccff", "#6e48b8"], // 포도
    ["#ff8fc8", "#ffd0e8", "#d1559a"], // 복숭아
  ];
  // 젤리 모양 (가운데 0,0 · 반지름 약 12)
  let SCTX = null; // 그릴 때 쓰는 ctx
  const P = () => SCTX;
  const SHAPE = [
    () => { const c = P(); c.beginPath(); c.moveTo(0, 12); c.bezierCurveTo(-15, 2, -13, -12, -6, -12); c.bezierCurveTo(-2, -12, 0, -9, 0, -6); c.bezierCurveTo(0, -9, 2, -12, 6, -12); c.bezierCurveTo(13, -12, 15, 2, 0, 12); c.closePath(); }, // 하트
    () => { const c = P(); c.beginPath(); c.arc(0, 0, 12, 0, 7); c.closePath(); }, // 동그라미
    () => { const c = P(); c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 6.6 : 14; c.lineTo(Math.cos(a) * r, Math.sin(a) * r + 1); } c.closePath(); }, // 별
    () => { const c = P(); c.beginPath(); if (c.roundRect) c.roundRect(-11, -11, 22, 22, 5); else c.rect(-11, -11, 22, 22); c.closePath(); }, // 네모
    () => { const c = P(); c.beginPath(); c.moveTo(0, -14); c.lineTo(13, 0); c.lineTo(0, 14); c.lineTo(-13, 0); c.closePath(); }, // 다이아
    () => { const c = P(); c.beginPath(); c.moveTo(0, -13); c.lineTo(13, 11); c.lineTo(-13, 11); c.closePath(); }, // 세모
    () => { const c = P(); c.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; c.moveTo(Math.cos(a) * 7 + 6, Math.sin(a) * 7); c.arc(Math.cos(a) * 7, Math.sin(a) * 7, 6, 0, 7); } c.moveTo(7.5, 0); c.arc(0, 0, 7.5, 0, 7); }, // 꽃
  ];
  const FACE_Y = [-1, 0, 2, 0, 0, 4, 0];
  const snd = (n) => { try { window.SFX && window.SFX[n] && window.SFX[n](); } catch {} };
  const quota = (lv) => 6 + lv * 2;                       // 레벨 업에 필요한 맞추기 횟수
  const drain = (lv) => 1 + (lv - 1) * 0.16;              // 초당 줄어드는 시간

  function mount(root, opts) {
    const t = opts.t;
    const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    root.innerHTML = `<div class="tg-wrap jx-wrap"><canvas class="tg jx" width="${W * R}" height="${H * R}"></canvas>
      <div class="ug-help"><span>${esc(t(touch ? "jxHow2" : "jxHow"))}</span><span>${esc(t("jxHow3"))}</span></div></div>`;
    const cv = root.querySelector("canvas"), ctx = cv.getContext("2d");
    SCTX = ctx;
    ctx.imageSmoothingEnabled = false;
    let best = +(localStorage.getItem("jl_best_jx") || 0) || 0;
    let dayLeft = opts.dayLeft == null ? 600 : opts.dayLeft;
    let S = null, raf = 0, last = 0, alive = true;

    const rnd = () => (Math.random() * TYPES) | 0;
    function reset() {
      S = { state: "ready", g: [], off: [], sel: null, cur: { r: 4, c: 3 }, phase: "idle", swap: null, clearing: null, chain: 0,
        score: 0, level: 1, done: 0, time: T_MAX, idle: 0, hint: null, fx: [], pops: [], shake: 0, anim: 0, lvFlash: 0,
        coins: 0, cap: Math.min(200, dayLeft), milestone: 0, run: null, result: null, paused: false, played: 0,
        items: { bomb: 0, laser: 0, sweep: 0 }, arm: null, hover: null, moveBig: 0, moveSteps: 0, fromItem: false, beams: [], booms: [] };
      newBoard();
    }
    // 처음부터 맞춰져 있지 않고, 움직일 곳이 하나 이상 있는 판
    function newBoard() {
      do {
        for (let r = 0; r < N; r++) {
          S.g[r] = []; S.off[r] = [];
          for (let c = 0; c < N; c++) {
            let k; do { k = rnd(); } while ((c >= 2 && S.g[r][c - 1] === k && S.g[r][c - 2] === k) || (r >= 2 && S.g[r - 1][c] === k && S.g[r - 2][c] === k));
            S.g[r][c] = k; S.off[r][c] = 0;
          }
        }
      } while (!findMove());
    }
    // 가로·세로 3개 이상 이어진 줄 찾기
    function findRuns() {
      const runs = [];
      for (let r = 0; r < N; r++) { let s = 0; for (let c = 1; c <= N; c++) { if (c < N && S.g[r][c] === S.g[r][s] && S.g[r][s] >= 0) continue; if (c - s >= 3 && S.g[r][s] >= 0) runs.push({ k: S.g[r][s], cells: Array.from({ length: c - s }, (_, i) => [r, s + i]) }); s = c; } }
      for (let c = 0; c < N; c++) { let s = 0; for (let r = 1; r <= N; r++) { if (r < N && S.g[r][c] === S.g[s][c] && S.g[s][c] >= 0) continue; if (r - s >= 3 && S.g[s][c] >= 0) runs.push({ k: S.g[s][c], cells: Array.from({ length: r - s }, (_, i) => [s + i, c]) }); s = r; } }
      return runs;
    }
    function swapCells(a, b) { const k = S.g[a.r][a.c]; S.g[a.r][a.c] = S.g[b.r][b.c]; S.g[b.r][b.c] = k; }
    function findMove() {
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const a = { r, c }, b = { r: r + dr, c: c + dc }; if (b.r >= N || b.c >= N) continue;
        swapCells(a, b); const ok = findRuns().length > 0; swapCells(a, b);
        if (ok) return [a, b];
      }
      return null;
    }
    const adj = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;

    // ---------- 조작 ----------
    function trySwap(a, b) {
      if (S.state !== "run" || S.paused || S.phase !== "idle" || !b || b.r < 0 || b.c < 0 || b.r >= N || b.c >= N || !adj(a, b)) return;
      S.sel = null; S.hint = null; S.idle = 0;
      S.phase = "swap"; S.swap = { a, b, t: 0, back: false }; snd("tRot");
    }
    function pick(cell) {
      if (S.state !== "run" || S.paused || S.phase !== "idle") return;
      if (S.sel && adj(S.sel, cell)) return trySwap(S.sel, cell);
      S.sel = S.sel && S.sel.r === cell.r && S.sel.c === cell.c ? null : cell; S.cur = { ...cell }; snd("tMove");
    }
    const KEYS = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0], KeyA: [0, -1], KeyD: [0, 1], KeyW: [-1, 0], KeyS: [1, 0] };
    const kd = (e) => {
      if (!S || !document.body.contains(cv)) return;
      const tag = (e.target && e.target.tagName) || ""; if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault(); e.stopPropagation();
        if (S.state === "ready") return start();
        if (S.state === "over") { if (performance.now() - S.overAt > 700) { reset(); start(); } return; }
        if (S.paused) { S.paused = false; return; }
        if (S.arm) return useItem(S.arm, { ...S.cur });
        return pick({ ...S.cur });
      }
      if (e.code === "Digit1" || e.code === "Digit2" || e.code === "Digit3") { if (S.state === "run") { e.preventDefault(); e.stopPropagation(); tapItem(ITEMS[+e.code.slice(-1) - 1]); } return; }
      if (e.code === "Escape" && S.arm) { e.preventDefault(); e.stopPropagation(); S.arm = null; return; }
      if (e.code === "KeyP" || e.code === "Escape") { if (S.state === "run") { e.preventDefault(); e.stopPropagation(); S.paused = !S.paused; } return; }
      const d = KEYS[e.code]; if (!d) return;
      e.preventDefault(); e.stopPropagation();
      if (S.state !== "run" || S.paused) return;
      const nx = { r: Math.max(0, Math.min(N - 1, S.cur.r + d[0])), c: Math.max(0, Math.min(N - 1, S.cur.c + d[1])) };
      if (S.sel && adj(S.sel, nx)) return trySwap(S.sel, nx);
      S.cur = nx; snd("tMove");
    };
    window.addEventListener("keydown", kd, true);
    // 터치·마우스: 누른 젤리를 옆으로 밀면 바꾸기, 그냥 누르면 고르기
    let drag = null;
    const cellAt = (e) => { const r = cv.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * W, y = ((e.clientY - r.top) / r.height) * H; return { c: Math.floor((x - BX) / C), r: Math.floor((y - BY) / C), x, y }; };
    cv.addEventListener("pointerdown", (e) => {
      e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch {}
      if (S.state === "ready") return start();
      if (S.state === "over") { if (performance.now() - S.overAt > 700) { reset(); start(); } return; }
      if (S.paused) { S.paused = false; return; }
      const p = cellAt(e);
      if (p.y >= IY && p.y <= IY + 30) { const i = Math.floor((p.x - BX) / (N * C / 3)); if (i >= 0 && i < 3) tapItem(ITEMS[i]); return; }
      if (p.r < 0 || p.c < 0 || p.r >= N || p.c >= N) return;
      if (S.arm) { useItem(S.arm, { r: p.r, c: p.c }); return; }
      drag = { r: p.r, c: p.c, x: p.x, y: p.y, used: false };
    });
    cv.addEventListener("pointermove", (e) => {
      if (S && S.arm) { const p = cellAt(e); S.hover = p.r >= 0 && p.c >= 0 && p.r < N && p.c < N ? { r: p.r, c: p.c } : null; }
      if (!drag || drag.used) return; const p = cellAt(e), dx = p.x - drag.x, dy = p.y - drag.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < C * 0.4) return;
      drag.used = true;
      const b = Math.abs(dx) > Math.abs(dy) ? { r: drag.r, c: drag.c + Math.sign(dx) } : { r: drag.r + Math.sign(dy), c: drag.c };
      trySwap({ r: drag.r, c: drag.c }, b);
    });
    cv.addEventListener("pointerup", () => { if (drag && !drag.used) pick({ r: drag.r, c: drag.c }); drag = null; });
    cv.addEventListener("pointercancel", () => { drag = null; });
    cv.addEventListener("contextmenu", (e) => e.preventDefault());

    function tapItem(kind) {
      if (S.state !== "run" || S.paused || S.phase !== "idle") return;
      if (!(S.items[kind] > 0)) { S.pops.push({ x: W / 2, y: BY + N * C - 14, text: t("jxNoItem"), col: "#ffffff", life: 1 }); return; }
      if (kind === "sweep") return useItem("sweep");
      S.arm = S.arm === kind ? null : kind; S.sel = null; snd("tHold");
      if (S.arm) S.pops.push({ x: W / 2, y: BY + N * C - 14, text: t(kind === "bomb" ? "jxAimBomb" : "jxAimLaser"), col: "#ffe07a", life: 1.4 });
    }
    function start() {
      S.state = "run"; S.played = 0;
      opts.onStart && opts.onStart().then((r) => { if (!S) return; S.run = r && r.run; if (r && r.dayLeft != null) { dayLeft = r.dayLeft; S.cap = Math.min(200, dayLeft); S.coins = Math.min(S.coins, S.cap); } }).catch(() => {});
    }
    async function finish() {
      S.state = "over"; S.overAt = performance.now(); S.sel = null; S.hint = null;
      snd("aww");
      const m = S.score;
      if (m > best) { best = m; try { localStorage.setItem("jl_best_jx", String(m)); } catch {} }
      S.result = { m, coins: S.coins, saving: true };
      const my = S;
      try {
        for (let i = 0; i < 20 && !my.run; i++) await new Promise((r) => setTimeout(r, 150));
        const r = my.run ? await opts.onFinish(my.run, m) : null;
        if (r) { my.result.coins = r.coins; if (r.best > best) best = r.best; if (r.dayLeft != null) dayLeft = r.dayLeft; }
      } catch {}
      my.result.saving = false;
    }

    // ---------- 맞추기 · 떨어지기 ----------
    function resolve() {
      const runs = findRuns();
      if (!runs.length) return false;
      S.chain++;
      const set = new Map();
      let pts = 0, biggest = 0;
      for (const run of runs) {
        const n = run.cells.length; biggest = Math.max(biggest, n);
        pts += PTS(n);
        run.cells.forEach(([r, c]) => set.set(r * N + c, run.k));
        S.done++;
      }
      S.moveBig = Math.max(S.moveBig, biggest); S.moveSteps++;
      const gain = pts * S.level * S.chain;
      S.score += gain;
      S.time = Math.min(T_MAX, S.time + set.size * 0.45 + (S.chain - 1) * 0.6);
      // 점수 표시: 터진 젤리들 가운데
      let sx = 0, sy = 0; set.forEach((_, key) => { sx += key % N; sy += Math.floor(key / N); });
      const cx = BX + (sx / set.size + 0.5) * C, cy = BY + (sy / set.size + 0.5) * C;
      S.pops.push({ x: cx, y: cy, text: "+" + gain.toLocaleString(), col: "#ffe07a", life: 0.9 });
      const word = biggest >= 7 ? "jxW7" : biggest === 6 ? "jxW6" : biggest === 5 ? "jxW5" : biggest === 4 ? "jxW4" : null;
      if (word) S.pops.push({ x: W / 2, y: BY + N * C / 2 - 14, text: t(word), col: biggest >= 6 ? "#ff5d9e" : "#7fd7ff", life: 1.1, big: true });
      if (S.chain >= 2) S.pops.push({ x: W / 2, y: BY + N * C / 2 + 10, text: t("jxCombo", { n: S.chain }), col: "#b58cff", life: 1, big: true });
      snd(biggest >= 5 || S.chain >= 3 ? "tTetris" : "tClear");
      if (biggest >= 5) S.shake = 0.18;
      // 반짝이 가루
      set.forEach((k, key) => {
        const r = Math.floor(key / N), c = key % N;
        for (let i = 0; i < 5; i++) S.fx.push({ x: BX + (c + 0.5) * C, y: BY + (r + 0.5) * C, vx: (Math.random() - 0.5) * 120, vy: -30 - Math.random() * 90, g: 220, life: 0.5 + Math.random() * 0.3, col: COL[k][i % 2 ? 1 : 0], s: 2 + (i % 2) });
      });
      S.clearing = { set, t: 0 };
      S.phase = "clear";
      return true;
    }
    // 💣 폭탄(4×4) · ⚡ 레이저(십자) · 🧹 젤리청소(전체)
    function itemCells(kind, cell) {
      const out = [];
      if (kind === "bomb") { const r0 = Math.max(0, Math.min(N - 4, cell.r - 1)), c0 = Math.max(0, Math.min(N - 4, cell.c - 1)); for (let r = r0; r < r0 + 4; r++) for (let c = c0; c < c0 + 4; c++) out.push([r, c]); }
      else if (kind === "laser") { for (let i = 0; i < N; i++) { out.push([cell.r, i]); if (i !== cell.r) out.push([i, cell.c]); } }
      else for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) out.push([r, c]);
      return out;
    }
    function useItem(kind, cell) {
      if (S.state !== "run" || S.paused || S.phase !== "idle" || !(S.items[kind] > 0)) return;
      cell = cell || { r: 3, c: 3 };
      const set = new Map();
      for (const [r, c] of itemCells(kind, cell)) if (S.g[r][c] >= 0) set.set(r * N + c, S.g[r][c]);
      S.items[kind]--; S.arm = null; S.sel = null; S.hint = null; S.idle = 0;
      S.fromItem = true; S.moveSteps = 0; S.moveBig = 0; S.chain = 0; S.done++;
      const gain = set.size * 15 * S.level; S.score += gain;
      S.time = Math.min(T_MAX, S.time + set.size * 0.2 + 2);
      const cx = BX + (cell.c + 0.5) * C, cy = BY + (cell.r + 0.5) * C;
      if (kind === "bomb") { S.booms.push({ x: BX + (Math.max(0, Math.min(N - 4, cell.c - 1)) + 2) * C, y: BY + (Math.max(0, Math.min(N - 4, cell.r - 1)) + 2) * C, t: 0 }); S.shake = 0.3; snd("smash"); }
      else if (kind === "laser") { S.beams.push({ r: cell.r, c: cell.c, t: 0 }); S.shake = 0.2; snd("superJump"); }
      else { S.booms.push({ x: BX + N * C / 2, y: BY + N * C / 2, t: 0, big: true }); S.shake = 0.4; snd("jackpot"); }
      S.pops.push({ x: kind === "sweep" ? W / 2 : cx, y: kind === "sweep" ? BY + N * C / 2 : cy, text: "+" + gain.toLocaleString(), col: "#ffe07a", life: 1.1, big: kind === "sweep" });
      set.forEach((k, key) => { const r = Math.floor(key / N), c = key % N; for (let i = 0; i < 3; i++) S.fx.push({ x: BX + (c + 0.5) * C, y: BY + (r + 0.5) * C, vx: (Math.random() - 0.5) * 160, vy: -40 - Math.random() * 110, g: 240, life: 0.5 + Math.random() * 0.3, col: kind === "laser" ? (i % 2 ? "#fff3a8" : "#7fd7ff") : COL[k][i % 2 ? 1 : 0], s: 2 + (i % 2) }); });
      S.clearing = { set, t: 0, item: kind }; S.phase = "clear";
    }
    function collapse() {
      for (const key of S.clearing.set.keys()) S.g[Math.floor(key / N)][key % N] = -1;
      S.clearing = null;
      for (let c = 0; c < N; c++) {
        let w = N - 1;
        for (let r = N - 1; r >= 0; r--) if (S.g[r][c] >= 0) { if (w !== r) { S.g[w][c] = S.g[r][c]; S.off[w][c] = w - r; S.g[r][c] = -1; } w--; }
        const empty = w + 1;
        for (let r = w; r >= 0; r--) { S.g[r][c] = rnd(); S.off[r][c] = empty; }
      }
      S.phase = "fall"; S.fallV = 0;
    }
    function settle() {
      if (resolve()) return;
      S.chain = 0; S.phase = "idle";
      // 🎁 아이템: 한 번 움직여서 맞춘 개수 = 가장 긴 줄 + 연달아 터진 횟수 (3개 + 연쇄 1번 = 4개)
      if (!S.fromItem && S.moveSteps > 0) {
        const eff = S.moveBig + S.moveSteps - 1;
        const kind = eff >= 6 ? "sweep" : eff === 5 ? "laser" : eff === 4 ? "bomb" : null;
        if (kind) { S.items[kind] = Math.min(9, S.items[kind] + 1); S.pops.push({ x: W / 2, y: BY + N * C - 16, text: t("jxGot_" + kind), col: "#ffe07a", life: 1.6, big: true }); snd("star"); S.itemFlash = { kind, t: 1.2 }; }
      }
      S.moveSteps = 0; S.moveBig = 0; S.fromItem = false;
      // 레벨 업
      if (S.done >= quota(S.level)) {
        S.done -= quota(S.level); S.level++; S.time = T_MAX; S.lvFlash = 1.4;
        const bonus = 500 * (S.level - 1); S.score += bonus;
        S.pops.push({ x: W / 2, y: BY + N * C / 2, text: t("jxLevelUp", { n: S.level }), col: "#ffe07a", life: 1.6, big: true });
        S.pops.push({ x: W / 2, y: BY + N * C / 2 + 22, text: "+" + bonus.toLocaleString(), col: "#fff", life: 1.6 });
        snd("star");
      }
      // 움직일 곳이 없으면 다시 섞기
      if (!findMove()) {
        S.pops.push({ x: W / 2, y: BY + N * C / 2 - 30, text: t("jxShuffle"), col: "#7fd7ff", life: 1.2, big: true });
        newBoard(); for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) S.off[r][c] = N;
        S.phase = "fall"; S.fallV = 0;
      }
    }

    // ---------- 진행 ----------
    function step(dt) {
      S.anim += dt;
      for (const f of S.fx) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += (f.g || 0) * dt; f.life -= dt; }
      S.fx = S.fx.filter((f) => f.life > 0);
      for (const p of S.pops) { p.y -= 16 * dt; p.life -= dt; }
      S.pops = S.pops.filter((p) => p.life > 0);
      if (S.shake > 0) S.shake -= dt;
      if (S.lvFlash > 0) S.lvFlash -= dt;
      for (const b of S.beams) b.t += dt; S.beams = S.beams.filter((b) => b.t < 0.5);
      for (const b of S.booms) b.t += dt; S.booms = S.booms.filter((b) => b.t < 0.6);
      if (S.itemFlash) { S.itemFlash.t -= dt; if (S.itemFlash.t <= 0) S.itemFlash = null; }
      if (S.state !== "run" || S.paused) return;
      S.played += dt;
      // 시간 막대 (맞추는 중에는 조금 천천히)
      S.time -= dt * drain(S.level) * (S.phase === "idle" ? 1 : 0.35);
      if (S.phase === "swap") {
        S.swap.t += dt;
        if (S.swap.t >= SWAP_T) {
          if (!S.swap.back) {
            swapCells(S.swap.a, S.swap.b);
            if (findRuns().length) { S.swap = null; S.chain = 0; S.moveBig = 0; S.moveSteps = 0; S.fromItem = false; resolve(); }
            else { swapCells(S.swap.a, S.swap.b); S.swap.back = true; S.swap.t = 0; snd("wrong"); }
          } else { S.swap = null; S.phase = "idle"; }
        }
      } else if (S.phase === "clear") {
        S.clearing.t += dt; if (S.clearing.t >= CLEAR_T) collapse();
      } else if (S.phase === "fall") {
        S.fallV = Math.min(28, (S.fallV || 0) + dt * 70);
        let moving = false;
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (S.off[r][c] > 0) { S.off[r][c] = Math.max(0, S.off[r][c] - S.fallV * dt); moving = true; }
        if (!moving) { snd("tLock"); settle(); }
      } else if (S.phase === "idle") {
        S.idle += dt;
        if (S.idle > 5 && !S.hint) S.hint = findMove();
        if (S.time <= 0) { S.time = 0; finish(); return; }
      }
      // 1000점마다 5코인
      const ms = Math.floor(S.score / 1000);
      while (S.milestone < ms) { S.milestone++; if (S.coins < S.cap) { S.coins = Math.min(S.cap, S.coins + 5); snd("coin"); } }
    }

    // ---------- 그리기 ----------
    // 젤리 하나: (x, y) = 칸 왼쪽 위, s = 크기 배율
    function jelly(k, x, y, s = 1, alpha = 1, bob = 0) {
      const [c1, c2, c3] = COL[k];
      const cx = x + C / 2, cy = y + C / 2 + 1 + bob;
      ctx.save(); ctx.globalAlpha = alpha; ctx.translate(cx, cy); ctx.scale(s, s);
      // 그림자
      ctx.fillStyle = "rgba(20,10,30,.25)"; ctx.beginPath(); ctx.ellipse(1, 11, 10, 3, 0, 0, 7); ctx.fill();
      // 몸통: 색마다 모양이 달라요 (하트 · 동그라미 · 별 · 네모 · 다이아 · 세모 · 꽃)
      const body = SHAPE[k];
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      body(); ctx.strokeStyle = OUT; ctx.lineWidth = 4.2; ctx.stroke();
      body(); ctx.strokeStyle = c3; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = c3; ctx.fill();
      ctx.save(); ctx.translate(-0.4, -0.9); ctx.scale(0.86, 0.86); body(); ctx.fillStyle = c1; ctx.fill(); ctx.strokeStyle = c1; ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore();
      // 반짝임
      ctx.fillStyle = c2; ctx.beginPath(); ctx.ellipse(-5, -5 + FACE_Y[k], 2.8, 1.9, -0.6, 0, 7); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.fillRect(-6.5, -7 + FACE_Y[k], 2, 2);
      ctx.translate(0, FACE_Y[k]);
      // 얼굴
      ctx.fillStyle = OUT;
      const blink = Math.floor((S.anim * 1.3 + k * 0.37 + x * 0.013) % 4.2 * 10) === 0;
      if (blink) { ctx.fillRect(-6, 1, 4, 1); ctx.fillRect(2, 1, 4, 1); }
      else { ctx.beginPath(); ctx.ellipse(-4, 1, 1.7, 2.3, 0, 0, 7); ctx.ellipse(4, 1, 1.7, 2.3, 0, 0, 7); ctx.fill(); ctx.fillStyle = "#fff"; ctx.fillRect(-4.6, -0.6, 1, 1); ctx.fillRect(3.4, -0.6, 1, 1); }
      ctx.fillStyle = "rgba(255,120,150,.55)"; ctx.beginPath(); ctx.ellipse(-7.5, 4.5, 2, 1.2, 0, 0, 7); ctx.ellipse(7.5, 4.5, 2, 1.2, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.beginPath();
      ctx.arc(0, 4.2, 2, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      ctx.restore();
    }
    function cellPos(r, c) {
      let x = BX + c * C, y = BY + r * C - (S.off[r] ? S.off[r][c] : 0) * C;
      const sw = S.swap;
      if (sw) {
        const p = Math.min(1, sw.t / SWAP_T), e = sw.back ? 1 - p : p, ease = e * e * (3 - 2 * e);
        if (sw.a.r === r && sw.a.c === c) { x += (sw.b.c - sw.a.c) * C * ease; y += (sw.b.r - sw.a.r) * C * ease; }
        else if (sw.b.r === r && sw.b.c === c) { x += (sw.a.c - sw.b.c) * C * ease; y += (sw.a.r - sw.b.r) * C * ease; }
      }
      return [x, y];
    }
    function draw() {
      ctx.setTransform(R, 0, 0, R, 0, 0);
      if (S.shake > 0) ctx.translate((Math.random() - 0.5) * 4 * Math.min(1, S.shake * 6), (Math.random() - 0.5) * 3 * Math.min(1, S.shake * 6));
      // 배경: 민트 → 레벨이 오를수록 노을빛
      const k = Math.min(1, (S.level - 1) / 10);
      const mix = (a, b) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, `rgb(${mix([150, 220, 170], [255, 170, 150])})`); g.addColorStop(1, `rgb(${mix([90, 180, 120], [200, 110, 170])})`);
      ctx.fillStyle = g; ctx.fillRect(-10, -10, W + 20, H + 20);
      // 상단: 로고 · 점수 · 레벨
      ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.font = `bold 15px ${FONT}`; const logo = "JELLY×JELLY";
      let lx = BX + 1;
      for (let i = 0; i < logo.length; i++) { const ch = logo[i]; ctx.fillStyle = OUT; ctx.fillText(ch, lx + 1, 17); ctx.fillStyle = ch === "×" ? "#fff" : COL[i % TYPES][0]; ctx.fillText(ch, lx, 16); lx += ctx.measureText(ch).width; }
      const box = (x, w, label, val) => {
        ctx.fillStyle = OUT; ctx.fillRect(x - 1, 5, w + 2, 28); ctx.fillStyle = "#fff8ea"; ctx.fillRect(x, 6, w, 26);
        ctx.fillStyle = "#b58cff"; ctx.fillRect(x, 6, w, 9); ctx.font = `bold 7px ${FONT}`; ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.fillText(label, x + w / 2, 11);
        ctx.font = `bold 10px ${FONT}`; ctx.fillStyle = OUT; ctx.fillText(val, x + w / 2, 24);
      };
      box(W - 128, 62, t("tgScore"), S.score.toLocaleString());
      box(W - 62, 54, "LEVEL", String(S.level));
      // 판
      ctx.fillStyle = OUT; ctx.fillRect(BX - 3, BY - 3, N * C + 6, N * C + 6);
      ctx.fillStyle = "#fff6ea"; ctx.fillRect(BX, BY, N * C, N * C);
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if ((r + c) % 2) { ctx.fillStyle = "#ffe9f1"; ctx.fillRect(BX + c * C, BY + r * C, C, C); }
      ctx.save(); ctx.beginPath(); ctx.rect(BX, BY, N * C, N * C); ctx.clip();
      // 힌트 · 선택
      const glow = (cell, col, a) => { if (!cell) return; ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fillRect(BX + cell.c * C + 1, BY + cell.r * C + 1, C - 2, C - 2); ctx.globalAlpha = 1; };
      if (S.hint && S.phase === "idle") { const a = 0.25 + 0.25 * Math.sin(S.anim * 8); glow(S.hint[0], "#ffe07a", a); glow(S.hint[1], "#ffe07a", a); }
      if (S.sel) glow(S.sel, "#7fd7ff", 0.45);
      // 젤리
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const kk = S.g[r][c]; if (kk < 0) continue;
        const [x, y] = cellPos(r, c);
        if (S.clearing && S.clearing.set.has(r * N + c)) {
          const p = S.clearing.t / CLEAR_T;
          jelly(kk, x, y, 1 + p * 0.5, 1 - p);
          if (Math.floor(p * 8) % 2 === 0) { ctx.globalAlpha = 0.6 * (1 - p); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x + C / 2, y + C / 2, 12 + p * 6, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
          continue;
        }
        const isSel = S.sel && S.sel.r === r && S.sel.c === c;
        jelly(kk, x, y, isSel ? 1.08 + Math.sin(S.anim * 10) * 0.04 : 1, 1, isSel ? -2 : Math.sin(S.anim * 2 + r * 0.7 + c) * 0.4);
      }
      // 아이템 범위 미리보기 (마우스를 올린 곳 · 키보드 커서)
      if (S.arm && S.phase === "idle") {
        const at = S.hover || (!touch ? S.cur : null);
        if (at) { const a = 0.35 + 0.15 * Math.sin(S.anim * 10); ctx.fillStyle = S.arm === "bomb" ? `rgba(255,120,60,${a})` : `rgba(120,220,255,${a})`; for (const [r, c] of itemCells(S.arm, at)) ctx.fillRect(BX + c * C + 1, BY + r * C + 1, C - 2, C - 2); }
      }
      // 💥 폭발 · ⚡ 레이저 효과
      for (const b of S.booms) {
        const p = b.t / 0.6, rad = (b.big ? 170 : 70) * (0.3 + p);
        ctx.globalAlpha = (1 - p) * 0.8; const gr = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, rad);
        gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.35, b.big ? "#ffe07a" : "#ffb347"); gr.addColorStop(1, "rgba(255,90,60,0)");
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(b.x, b.y, rad, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      }
      for (const b of S.beams) {
        const p = b.t / 0.5, wdt = C * (0.9 - p * 0.6), a = 1 - p;
        const bx = BX + (b.c + 0.5) * C, by = BY + (b.r + 0.5) * C;
        for (const [col, ww] of [["rgba(90,200,255," + a * 0.6 + ")", wdt], ["rgba(255,255,255," + a + ")", wdt * 0.4]]) {
          ctx.fillStyle = col; ctx.fillRect(BX, by - ww / 2, N * C, ww); ctx.fillRect(bx - ww / 2, BY, ww, N * C);
        }
      }
      // 키보드 커서
      if (S.state === "run" && S.phase === "idle" && !touch) { ctx.strokeStyle = S.sel ? "#2a7cc4" : "rgba(58,37,48,.6)"; ctx.lineWidth = 1.5; ctx.setLineDash([3, 2]); ctx.strokeRect(BX + S.cur.c * C + 1.5, BY + S.cur.r * C + 1.5, C - 3, C - 3); ctx.setLineDash([]); }
      ctx.restore();
      // 하단: 시간 막대 + 레벨 진행
      const TY = BY + N * C + 8;
      ctx.font = `14px sans-serif`; ctx.textAlign = "center"; ctx.fillText("⏰", BX + 8, TY + 8);
      const bw = N * C - 22, frac = Math.max(0, S.time / T_MAX);
      ctx.fillStyle = OUT; ctx.fillRect(BX + 19, TY + 1, bw + 2, 14); ctx.fillStyle = "#fff8ea"; ctx.fillRect(BX + 20, TY + 2, bw, 12);
      const low = frac < 0.25;
      ctx.fillStyle = low ? (Math.floor(S.anim * 6) % 2 ? "#ff3b5c" : "#ff8fa0") : frac < 0.5 ? "#ffb347" : "#6fd36a";
      ctx.fillRect(BX + 20, TY + 2, Math.round(bw * frac), 12);
      ctx.fillStyle = "rgba(255,255,255,.45)"; ctx.fillRect(BX + 20, TY + 3, Math.round(bw * frac), 3);
      const q = quota(S.level);
      ctx.font = `bold 8px ${FONT}`; ctx.fillStyle = OUT; ctx.textAlign = "left"; ctx.fillText(`${t("jxGoal")} ${Math.min(q, S.done)}/${q}`, BX + 2, TY + 24);
      ctx.textAlign = "right"; ctx.fillText(`🪙 ${S.coins}/${S.cap} · ${t("gameBest")} ${best.toLocaleString()}`, BX + N * C, TY + 24);
      // 🎁 아이템 칸: 💣 폭탄 · ⚡ 레이저 · 🧹 젤리청소
      const sw = (N * C) / 3;
      ITEMS.forEach((kind, i) => {
        const x0 = BX + i * sw + 2, w0 = sw - 4, n = S.items[kind], on = S.arm === kind, flash = S.itemFlash && S.itemFlash.kind === kind;
        ctx.fillStyle = OUT; ctx.fillRect(x0 - 1, IY - 1, w0 + 2, 30);
        ctx.fillStyle = on ? (Math.floor(S.anim * 6) % 2 ? "#ffe07a" : "#fff3b0") : flash ? "#fff3b0" : n > 0 ? "#fff8ea" : "#d9cfd6"; ctx.fillRect(x0, IY, w0, 28);
        ctx.fillStyle = kind === "bomb" ? "#ff8a5c" : kind === "laser" ? "#57b8ff" : "#b58cff"; ctx.fillRect(x0, IY, w0, 3);
        ctx.globalAlpha = n > 0 ? 1 : 0.4;
        ctx.font = `15px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(ICON[kind], x0 + 14, IY + 15);
        ctx.font = `bold 8px ${FONT}`; ctx.fillStyle = OUT; ctx.textAlign = "left"; ctx.fillText(t("jxItem_" + kind), x0 + 26, IY + 10);
        ctx.font = `bold 11px ${FONT}`; ctx.fillStyle = "#d1559a"; ctx.fillText("×" + n, x0 + 26, IY + 21);
        if (!touch) { ctx.font = `7px ${FONT}`; ctx.fillStyle = "#9a8a96"; ctx.textAlign = "right"; ctx.fillText(String(i + 1), x0 + w0 - 3, IY + 22); }
        ctx.globalAlpha = 1;
      });
      if (S.lvFlash > 0) { ctx.globalAlpha = Math.min(0.35, S.lvFlash * 0.3); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
      // 효과
      for (const f of S.fx) { ctx.globalAlpha = Math.min(1, f.life * 2); ctx.fillStyle = f.col; ctx.fillRect(Math.round(f.x), Math.round(f.y), f.s, f.s); }
      ctx.globalAlpha = 1;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (const p of S.pops) {
        let fs = p.big ? 16 : 10; ctx.font = `bold ${fs}px ${FONT}`;
        while (ctx.measureText(p.text).width > W - 20 && fs > 8) { fs--; ctx.font = `bold ${fs}px ${FONT}`; }
        ctx.globalAlpha = Math.min(1, p.life * 2);
        ctx.fillStyle = OUT; ctx.fillText(p.text, p.x + 1, p.y + 1); ctx.fillText(p.text, p.x - 1, p.y + 1); ctx.fillStyle = p.col; ctx.fillText(p.text, p.x, p.y);
        ctx.globalAlpha = 1;
      }
      if (S.paused && S.state === "run") panel([t("tgPaused"), t("tgResume")]);
      if (S.state === "ready") panel([t("jxTitle"), dayLeft > 0 ? t("gameDayLeft", { n: dayLeft }) : t("gameDayDone"), t("jxLegend"), t("jxLegend2"), t("gameStart")]);
      if (S.state === "over") {
        const r = S.result || { m: S.score, coins: S.coins };
        panel([t("jxTimeUp"), `${t("tgScore")} ${r.m.toLocaleString()} · LEVEL ${S.level}`, `${t("gameBest")} ${best.toLocaleString()}`, `${t("gameEarn")} 🪙 ${r.coins}${r.saving ? "  (" + t("gameSaving") + ")" : ""}`, r.saving ? "" : dayLeft > 0 ? t("gameDayLeft", { n: dayLeft }) : t("gameDayDone"), performance.now() - S.overAt > 700 ? t("gameAgain") : ""]);
      }
    }
    function panel(lines) {
      const w = 200, h = 22 + lines.length * 16, x = (W - w) / 2, y = BY + (N * C - h) / 2;
      ctx.fillStyle = "rgba(20,10,30,.35)"; ctx.fillRect(BX, BY, N * C, N * C);
      ctx.fillStyle = "rgba(58,37,48,.25)"; ctx.fillRect(x + 3, y + 3, w, h);
      ctx.fillStyle = OUT; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
      ctx.fillStyle = "#fff8ea"; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#ff8fc8"; ctx.fillRect(x, y, w, 4);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      lines.forEach((ln, i) => {
        const first = i === 0, lastL = i === lines.length - 1 && ln;
        let fs = first ? 13 : lastL ? 10 : 8;
        ctx.font = `${first || lastL ? "bold " : ""}${fs}px ${FONT}`;
        while (ctx.measureText(ln).width > w - 10 && fs > 6) { fs--; ctx.font = `${first || lastL ? "bold " : ""}${fs}px ${FONT}`; }
        ctx.fillStyle = first ? "#d1559a" : lastL ? (Math.floor(S.anim * 2) % 2 ? "#ff4f9a" : "#7a3fc0") : OUT;
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
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) window.__jx = () => S; // 테스트용 (내 컴퓨터에서만)
    raf = requestAnimationFrame(loop);
    const onVis = () => { if (document.hidden && S && S.state === "run") S.paused = true; };
    document.addEventListener("visibilitychange", onVis);
    return {
      destroy() { alive = false; cancelAnimationFrame(raf); window.removeEventListener("keydown", kd, true); document.removeEventListener("visibilitychange", onVis); S = null; },
      _debug: () => S,
    };
  }
  function esc(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  window.JellyXGame = { mount };
})();
