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
  const BX = 8, BY = 40, W = BX * 2 + N * C, H = BY + N * C + 40;
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
  const snd = (n) => { try { window.SFX && window.SFX[n] && window.SFX[n](); } catch {} };
  const quota = (lv) => 6 + lv * 2;                       // 레벨 업에 필요한 맞추기 횟수
  const drain = (lv) => 1 + (lv - 1) * 0.16;              // 초당 줄어드는 시간

  function mount(root, opts) {
    const t = opts.t;
    const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    root.innerHTML = `<div class="tg-wrap jx-wrap"><canvas class="tg jx" width="${W * R}" height="${H * R}"></canvas>
      <div class="ug-help"><span>${esc(t(touch ? "jxHow2" : "jxHow"))}</span><span>${esc(t("jxHow3"))}</span></div></div>`;
    const cv = root.querySelector("canvas"), ctx = cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    let best = +(localStorage.getItem("jl_best_jx") || 0) || 0;
    let dayLeft = opts.dayLeft == null ? 600 : opts.dayLeft;
    let S = null, raf = 0, last = 0, alive = true;

    const rnd = () => (Math.random() * TYPES) | 0;
    function reset() {
      S = { state: "ready", g: [], off: [], sel: null, cur: { r: 4, c: 3 }, phase: "idle", swap: null, clearing: null, chain: 0,
        score: 0, level: 1, done: 0, time: T_MAX, idle: 0, hint: null, fx: [], pops: [], shake: 0, anim: 0, lvFlash: 0,
        coins: 0, cap: Math.min(200, dayLeft), milestone: 0, run: null, result: null, paused: false, played: 0 };
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
        return pick({ ...S.cur });
      }
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
      const p = cellAt(e); if (p.r < 0 || p.c < 0 || p.r >= N || p.c >= N) return;
      drag = { r: p.r, c: p.c, x: p.x, y: p.y, used: false };
    });
    cv.addEventListener("pointermove", (e) => {
      if (!drag || drag.used) return; const p = cellAt(e), dx = p.x - drag.x, dy = p.y - drag.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < C * 0.4) return;
      drag.used = true;
      const b = Math.abs(dx) > Math.abs(dy) ? { r: drag.r, c: drag.c + Math.sign(dx) } : { r: drag.r + Math.sign(dy), c: drag.c };
      trySwap({ r: drag.r, c: drag.c }, b);
    });
    cv.addEventListener("pointerup", () => { if (drag && !drag.used) pick({ r: drag.r, c: drag.c }); drag = null; });
    cv.addEventListener("pointercancel", () => { drag = null; });
    cv.addEventListener("contextmenu", (e) => e.preventDefault());

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
      if (S.state !== "run" || S.paused) return;
      S.played += dt;
      // 시간 막대 (맞추는 중에는 조금 천천히)
      S.time -= dt * drain(S.level) * (S.phase === "idle" ? 1 : 0.35);
      if (S.phase === "swap") {
        S.swap.t += dt;
        if (S.swap.t >= SWAP_T) {
          if (!S.swap.back) {
            swapCells(S.swap.a, S.swap.b);
            if (findRuns().length) { S.swap = null; S.chain = 0; resolve(); }
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
      // 몸통 (말랑한 젤리 모양: 아래가 넓은 물방울)
      const body = () => { ctx.beginPath(); ctx.moveTo(0, -12); ctx.bezierCurveTo(9, -12, 12, -3, 12, 4); ctx.bezierCurveTo(12, 10, 7, 11, 0, 11); ctx.bezierCurveTo(-7, 11, -12, 10, -12, 4); ctx.bezierCurveTo(-12, -3, -9, -12, 0, -12); ctx.closePath(); };
      ctx.fillStyle = OUT; ctx.save(); ctx.scale(1.12, 1.1); body(); ctx.fill(); ctx.restore();
      ctx.fillStyle = c3; body(); ctx.fill();
      ctx.fillStyle = c1; ctx.save(); ctx.translate(-0.5, -1); ctx.scale(0.93, 0.9); body(); ctx.fill(); ctx.restore();
      // 반짝임
      ctx.fillStyle = c2; ctx.beginPath(); ctx.ellipse(-5, -6, 3.2, 2.2, -0.6, 0, 7); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.fillRect(-7, -8, 2, 2);
      // 종류별 장식
      if (k === 0) { ctx.fillStyle = "#3fa04a"; ctx.fillRect(-4, -14, 8, 3); ctx.fillRect(-1, -16, 2, 3); ctx.fillStyle = "#ffe07a"; [[-6, 2], [6, 1], [-3, 7], [4, 7]].forEach(([a, b]) => ctx.fillRect(a, b, 1.5, 1.5)); }
      if (k === 1) { ctx.fillStyle = "#3fa04a"; ctx.beginPath(); ctx.ellipse(3, -13, 3.5, 1.8, -0.5, 0, 7); ctx.fill(); }
      if (k === 2) { ctx.fillStyle = "#fff8d8"; ctx.fillRect(4, -9, 2, 2); }
      if (k === 3) { ctx.fillStyle = "#7a4a2a"; ctx.fillRect(-1, -16, 2, 5); ctx.fillStyle = "#3fa04a"; ctx.beginPath(); ctx.ellipse(4, -14, 3.5, 1.6, 0.4, 0, 7); ctx.fill(); }
      if (k === 4) { ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 0.8; [[6, -4, 1.6], [8, 1, 1], [-8, 3, 1.2]].forEach(([a, b, r]) => { ctx.beginPath(); ctx.arc(a, b, r, 0, 7); ctx.stroke(); }); }
      if (k === 5) { ctx.fillStyle = c3; [[-4, -12], [0, -14], [4, -12]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(a, b, 2.4, 0, 7); ctx.fill(); }); ctx.fillStyle = "#3fa04a"; ctx.fillRect(-1, -17, 2, 3); }
      if (k === 6) { ctx.strokeStyle = c3; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -11); ctx.quadraticCurveTo(2, -4, 0, 2); ctx.stroke(); }
      // 얼굴
      ctx.fillStyle = OUT;
      const blink = Math.floor((S.anim * 1.3 + k * 0.37 + x * 0.013) % 4.2 * 10) === 0;
      if (k === 2) { ctx.lineWidth = 1.2; ctx.strokeStyle = OUT; [[-4, 1], [4, 1]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(a, b + 1, 2, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }); }
      else if (blink) { ctx.fillRect(-6, 1, 4, 1); ctx.fillRect(2, 1, 4, 1); }
      else { ctx.beginPath(); ctx.ellipse(-4, 1, 1.7, 2.3, 0, 0, 7); ctx.ellipse(4, 1, 1.7, 2.3, 0, 0, 7); ctx.fill(); ctx.fillStyle = "#fff"; ctx.fillRect(-4.6, -0.6, 1, 1); ctx.fillRect(3.4, -0.6, 1, 1); }
      ctx.fillStyle = "rgba(255,120,150,.55)"; ctx.beginPath(); ctx.ellipse(-7.5, 4.5, 2, 1.2, 0, 0, 7); ctx.ellipse(7.5, 4.5, 2, 1.2, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.beginPath();
      if (k === 5) ctx.arc(0, 5, 1.6, 0, 7); else ctx.arc(0, 4.2, 2, 0.15 * Math.PI, 0.85 * Math.PI);
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
