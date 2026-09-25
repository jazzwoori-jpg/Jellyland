/* 🎮 점프점프 젤리월드 — 젤리게임월드의 러닝 미니게임
   - 캐릭터가 왼쪽 → 오른쪽으로 계속 달림, 탭/스페이스/↑ 로 점프 (공중에서 한 번 더 = 2단 점프)
   - ⭐ 슈퍼젤리: 먹으면 몇 초 동안 몸이 커지고 장애물을 부수며 달림
   - 속도 = min(400, 150 + 4·t) px/s (서버 검증 공식과 같음), 10px = 1m
   - 100m 마다 5코인, 한 판 최대 200코인 */
(function () {
  const W = 360, H = 170, GY = 138, PX = 64, R = 2;
  const GRAV = 1150, JUMP = -345, JUMP2 = -310;
  const SUPER_TIME = 6;
  const FONT = "'Galmuri11', 'Galmuri9', 'Apple SD Gothic Neo', 'Hiragino Sans', sans-serif";
  const OUT = "#3a2530";
  const speedAt = (t) => Math.min(400, 150 + 4 * t);

  function mount(root, opts) {
    const t = opts.t;
    root.innerHTML = `<div class="jg-wrap"><canvas class="jg" width="${W * R}" height="${H * R}"></canvas>
      <div class="jg-help"><span>${esc(t("gameHow"))}</span><span>${esc(t("gameHow2"))}</span><span>${esc(t("gameHow3"))}</span></div></div>`;
    const cv = root.querySelector("canvas"), ctx = cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    let best = +(localStorage.getItem("jl_best") || 0) || 0;
    let S = null, raf = 0, last = 0, alive = true;
    let dayLeft = opts.dayLeft == null ? 600 : opts.dayLeft; // 오늘 미니게임으로 더 받을 수 있는 코인

    function reset() {
      S = { state: "ready", time: 0, dist: 0, y: GY, vy: 0, jumps: 0, obs: [], items: [], fx: [], pops: [], nextObs: 260, nextItem: 2600 + Math.random() * 1200,
        superT: 0, run: null, milestone: 0, coins: 0, cap: Math.min(200, dayLeft), shake: 0, result: null, anim: 0 };
    }
    reset();

    // ---------- 입력 ----------
    function press() {
      if (!S) return;
      if (S.state === "ready") return start();
      if (S.state === "over") { if (S.result && S.time > 0 && performance.now() - S.overAt > 700) { reset(); start(); } return; }
      if (S.jumps === 0 && S.y >= GY - 0.5) { S.vy = JUMP; S.jumps = 1; puff(PX, GY, "#ffffff"); }
      else if (S.jumps < 2) { S.vy = JUMP2; S.jumps = 2; puff(PX, S.y, "#ffd1e6"); }
    }
    const onKey = (e) => {
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") { e.preventDefault(); e.stopPropagation(); if (!e.repeat) press(); }
    };
    const onPtr = (e) => { e.preventDefault(); press(); };
    cv.addEventListener("pointerdown", onPtr);
    window.addEventListener("keydown", onKey, true);

    function start() {
      S.state = "run"; S.time = 0;
      opts.onStart && opts.onStart().then((r) => { if (!S) return; S.run = r && r.run; if (r && r.dayLeft != null) { dayLeft = r.dayLeft; S.cap = Math.min(200, dayLeft); S.coins = Math.min(S.coins, S.cap); } }).catch(() => {});
    }
    async function finish() {
      S.state = "over"; S.overAt = performance.now();
      const m = Math.floor(S.dist / 10);
      if (m > best) { best = m; try { localStorage.setItem("jl_best", String(m)); } catch {} }
      S.result = { m, coins: S.coins, saving: true };
      const my = S;
      try {
        // 시작 토큰이 아직 안 왔으면 잠깐 기다림
        for (let i = 0; i < 20 && !my.run; i++) await new Promise((r) => setTimeout(r, 150));
        const r = my.run ? await opts.onFinish(my.run, m) : null;
        if (r) { my.result.coins = r.coins; if (r.best > best) best = r.best; if (r.dayLeft != null) dayLeft = r.dayLeft; }
      } catch {}
      my.result.saving = false;
    }

    // ---------- 효과 ----------
    function puff(x, y, col) { for (let i = 0; i < 6; i++) S.fx.push({ x, y, vx: -40 - Math.random() * 60, vy: -Math.random() * 60, life: 0.4, col, s: 2 }); }
    function smash(o) {
      const cols = o.cols;
      for (let i = 0; i < 16; i++) S.fx.push({ x: o.x + Math.random() * o.w, y: o.top + Math.random() * o.h, vx: 60 + Math.random() * 200, vy: -80 - Math.random() * 220, life: 0.8, col: cols[i % cols.length], s: 3, g: true });
      S.shake = 0.15;
    }

    // ---------- 장애물 ----------
    const JELLY = [["#ff7fae", "#ffc2dc"], ["#a77ce0", "#d7c2ff"], ["#4fc3b0", "#b5f0e4"], ["#ffb347", "#ffe0a8"], ["#6fb8ff", "#c6e3ff"]];
    function spawnObstacle() {
      const m = S.dist / 10;
      const pool = ["gummy", "gummy", "tall", "cane"];
      if (m > 150) pool.push("double", "cane");
      if (m > 400) pool.push("fly", "stack");
      if (m > 900) pool.push("fly", "double", "stack");
      const type = pool[(Math.random() * pool.length) | 0];
      const c = JELLY[(Math.random() * JELLY.length) | 0];
      const o = { type, x: W + 10, cols: c, broken: false };
      if (type === "gummy") Object.assign(o, { w: 16, h: 16 });
      if (type === "tall") Object.assign(o, { w: 16, h: 26 });
      if (type === "double") Object.assign(o, { w: 32, h: 16 });
      if (type === "stack") Object.assign(o, { w: 16, h: 38 });
      if (type === "cane") Object.assign(o, { w: 10, h: 24, cols: ["#ff4f6d", "#ffffff"] });
      if (type === "fly") Object.assign(o, { w: 22, h: 12, fly: true, base: GY - 38 - Math.random() * 6, ph: Math.random() * 6 });
      o.top = o.fly ? o.base : GY - o.h;
      S.obs.push(o);
    }
    function drawObstacle(o) {
      const x = Math.round(o.x), y = Math.round(o.top);
      if (o.type === "cane") { // 사탕 지팡이
        ctx.fillStyle = OUT; ctx.fillRect(x + 2, y + 4, 6, o.h - 4); ctx.fillRect(x, y, 10, 6);
        for (let k = 0; k < o.h - 5; k++) { ctx.fillStyle = Math.floor(k / 3) % 2 ? "#ffffff" : "#ff4f6d"; ctx.fillRect(x + 3, y + 5 + k, 4, 1); }
        ctx.fillStyle = "#ff4f6d"; ctx.fillRect(x + 1, y + 1, 8, 4); ctx.fillStyle = "#ffffff"; ctx.fillRect(x + 4, y + 1, 2, 4);
        return;
      }
      if (o.type === "fly") { // 날아다니는 벌 젤리
        const wing = Math.floor(S.anim * 12) % 2;
        ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.fillRect(x + 6, y - 5 + wing, 5, 5); ctx.fillRect(x + 12, y - 5 + wing, 5, 5);
        ctx.fillStyle = OUT; ctx.fillRect(x, y, o.w, o.h);
        ctx.fillStyle = "#ffd34d"; ctx.fillRect(x + 1, y + 1, o.w - 2, o.h - 2);
        ctx.fillStyle = OUT; ctx.fillRect(x + 7, y + 1, 3, o.h - 2); ctx.fillRect(x + 13, y + 1, 3, o.h - 2);
        ctx.fillStyle = "#fff"; ctx.fillRect(x + 2, y + 3, 3, 3); ctx.fillStyle = OUT; ctx.fillRect(x + 2, y + 4, 2, 2);
        ctx.fillRect(x + o.w, y + 5, 3, 2);
        return;
      }
      // 젤리 블록 (말랑한 곰젤리 느낌)
      const [c1, c2] = o.cols, cells = o.type === "double" ? 2 : 1, stack = o.type === "stack" ? 2 : 1;
      const cw = o.w / cells, ch = o.h / stack;
      for (let i = 0; i < cells; i++) for (let j = 0; j < stack; j++) {
        const bx = x + i * cw, by = y + j * ch;
        ctx.fillStyle = OUT; ctx.fillRect(bx, by + 2, cw, ch - 2); ctx.fillRect(bx + 2, by, cw - 4, ch);
        ctx.fillStyle = c1; ctx.fillRect(bx + 1, by + 2, cw - 2, ch - 3); ctx.fillRect(bx + 2, by + 1, cw - 4, ch - 1);
        ctx.fillStyle = c2; ctx.fillRect(bx + 3, by + 3, 3, Math.max(2, ch - 10)); ctx.fillRect(bx + 3, by + 2, cw - 8, 2);
        ctx.fillStyle = OUT; ctx.fillRect(bx + cw / 2 - 3, by + ch / 2 - 1, 2, 2); ctx.fillRect(bx + cw / 2 + 2, by + ch / 2 - 1, 2, 2);
      }
    }
    function drawStar(x, y, s, col) {
      ctx.fillStyle = OUT; ctx.fillRect(x - s - 1, y - 1, s * 2 + 3, 3); ctx.fillRect(x - 1, y - s - 1, 3, s * 2 + 3);
      ctx.fillStyle = col; ctx.fillRect(x - s, y, s * 2 + 1, 1); ctx.fillRect(x, y - s, 1, s * 2 + 1);
      ctx.fillRect(x - s + 2, y - 1, s * 2 - 3, 3); ctx.fillRect(x - 1, y - s + 2, 3, s * 2 - 3);
    }
    function drawItem(it) { // ⭐ 슈퍼젤리
      const x = Math.round(it.x), y = Math.round(it.y + Math.sin(S.anim * 5 + it.ph) * 3);
      ctx.fillStyle = "rgba(255,243,168,.45)"; ctx.beginPath(); ctx.arc(x, y, 11 + Math.sin(S.anim * 8) * 2, 0, 7); ctx.fill();
      ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.fill();
      const hue = (S.anim * 200) % 360;
      ctx.fillStyle = `hsl(${hue},90%,70%)`; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill();
      drawStar(x, y, 4, "#fff8d8");
    }

    // ---------- 배경 ----------
    function drawBg() {
      const g = ctx.createLinearGradient(0, 0, 0, GY);
      if (S.superT > 0) { const h = (S.anim * 120) % 360; g.addColorStop(0, `hsl(${h},80%,82%)`); g.addColorStop(1, `hsl(${(h + 60) % 360},80%,90%)`); }
      else { g.addColorStop(0, "#bfe6ff"); g.addColorStop(0.7, "#ffe1f0"); g.addColorStop(1, "#fff3d8"); }
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, GY);
      // 구름
      const cx0 = -(S.dist * 0.08) % 420;
      ctx.fillStyle = "rgba(255,255,255,.9)";
      for (let k = 0; k < 4; k++) { const x = cx0 + k * 140, y = 22 + (k % 2) * 16; ctx.fillRect(x, y, 34, 8); ctx.fillRect(x + 6, y - 5, 18, 6); ctx.fillRect(x + 20, y - 3, 10, 4); }
      // 젤리 언덕 (먼 것 → 가까운 것)
      const hills = [[0.18, "#d7c2ff", 40, 0.021], [0.35, "#ffc2dc", 26, 0.03]];
      for (const [par, col, amp, fr] of hills) {
        ctx.fillStyle = col;
        const off = S.dist * par;
        for (let x = 0; x < W; x += 3) { const hy = GY - 10 - amp * (0.5 + 0.5 * Math.sin((x + off) * fr)) - 6; ctx.fillRect(x, hy, 3, GY - hy); }
      }
      // 땅
      ctx.fillStyle = OUT; ctx.fillRect(0, GY, W, 2);
      ctx.fillStyle = "#8fe07a"; ctx.fillRect(0, GY + 2, W, 5);
      ctx.fillStyle = "#b8784a"; ctx.fillRect(0, GY + 7, W, H - GY - 7);
      const off = S.dist % 24;
      ctx.fillStyle = "#6fc85c"; for (let x = -off; x < W; x += 24) ctx.fillRect(x, GY + 5, 12, 2);
      ctx.fillStyle = "#9a6038"; for (let x = -off * 1; x < W + 24; x += 24) { ctx.fillRect(x + 4, GY + 14, 8, 3); ctx.fillRect(x + 16, GY + 22, 6, 3); }
      ctx.fillStyle = "#ffd1e1"; for (let x = -((S.dist * 1) % 48); x < W; x += 48) ctx.fillRect(x + 30, GY + 3, 2, 2);
    }

    // ---------- 루프 ----------
    function step(dt) {
      S.anim += dt;
      for (const f of S.fx) { f.x += f.vx * dt; f.y += f.vy * dt; if (f.g) f.vy += 700 * dt; f.life -= dt; }
      S.fx = S.fx.filter((f) => f.life > 0);
      for (const p of S.pops) { p.y -= 22 * dt; p.life -= dt; }
      S.pops = S.pops.filter((p) => p.life > 0);
      if (S.shake > 0) S.shake -= dt;
      if (S.state !== "run") return;
      S.time += dt;
      const v = speedAt(S.time), dx = v * dt;
      S.dist += dx;
      // 점프 물리
      S.vy += GRAV * dt; S.y += S.vy * dt;
      if (S.y >= GY) { if (S.vy > 200) puff(PX, GY, "#ffffff"); S.y = GY; S.vy = 0; S.jumps = 0; }
      if (S.superT > 0) S.superT -= dt;
      // 스폰
      S.nextObs -= dx;
      if (S.nextObs <= 0) { spawnObstacle(); S.nextObs = v * (0.62 + Math.random() * 0.75) + 40; }
      S.nextItem -= dx;
      if (S.nextItem <= 0) { S.items.push({ x: W + 10, y: GY - 48 - Math.random() * 20, ph: Math.random() * 6 }); S.nextItem = 2600 + Math.random() * 2400; }
      for (const o of S.obs) { o.x -= dx; if (o.fly) { o.top = o.base + Math.sin(S.anim * 4 + o.ph) * 4; o.x -= 30 * dt; } }
      for (const it of S.items) it.x -= dx;
      S.obs = S.obs.filter((o) => o.x > -40 && !o.gone);
      S.items = S.items.filter((it) => it.x > -20 && !it.got);
      // 충돌
      const big = S.superT > 0 ? 1.4 : 1;
      const hb = { x0: PX - 6 * big, x1: PX + 6 * big, y0: S.y - 26 * big, y1: S.y - 1 };
      for (const it of S.items) if (Math.abs(it.x - PX) < 14 * big && it.y > hb.y0 - 10 && it.y < hb.y1 + 6) {
        it.got = true; S.superT = SUPER_TIME; S.pops.push({ x: PX, y: S.y - 50, text: "⭐ " + t("gameSuper"), life: 1.4, col: "#ff4f9a" });
        for (let i = 0; i < 20; i++) S.fx.push({ x: it.x, y: it.y, vx: (Math.random() - 0.5) * 260, vy: (Math.random() - 0.5) * 260, life: 0.6, col: ["#fff3a8", "#ff9fc8", "#9fe8ff"][i % 3], s: 2 });
      }
      for (const o of S.obs) {
        if (o.broken) continue;
        const pad = 3;
        if (hb.x1 > o.x + pad && hb.x0 < o.x + o.w - pad && hb.y1 > o.top + pad && hb.y0 < o.top + o.h - pad) {
          if (S.superT > 0) { o.broken = true; o.gone = true; smash(o); S.pops.push({ x: o.x, y: o.top - 6, text: "SMASH!", life: 0.6, col: "#7a3fc0" }); }
          else { S.shake = 0.3; for (let i = 0; i < 14; i++) S.fx.push({ x: PX, y: S.y - 14, vx: (Math.random() - 0.5) * 240, vy: -Math.random() * 240, life: 0.7, col: ["#ff7fae", "#ffffff", "#ffd34d"][i % 3], s: 2, g: true }); finish(); return; }
        }
      }
      // 100m 마다 코인
      const m = Math.floor(S.dist / 10);
      const ms = Math.floor(m / 100);
      while (S.milestone < ms) {
        S.milestone++;
        if (S.coins < S.cap) { S.coins = Math.min(S.cap, S.coins + 5); S.pops.push({ x: PX + 16, y: S.y - 44, text: S.coins >= S.cap ? t("gameMax") : "+5 🪙", life: 1.1, col: "#c98a2c" }); }
      }
    }

    function draw() {
      ctx.setTransform(R, 0, 0, R, 0, 0);
      if (S.shake > 0) ctx.translate((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 3);
      drawBg();
      for (const it of S.items) drawItem(it);
      for (const o of S.obs) drawObstacle(o);
      // 플레이어
      const av = opts.avatar();
      const running = S.state === "run" || S.state === "ready";
      const onGround = S.y >= GY - 0.5;
      const frame = S.state === "run" ? (onGround ? [1, 0, 3, 0][Math.floor(S.anim * 12) % 4] : 1) : 0;
      ctx.save();
      if (S.superT > 0) {
        const k = 1.4, blink = S.superT < 1.2 && Math.floor(S.anim * 12) % 2;
        ctx.fillStyle = `hsla(${(S.anim * 400) % 360},90%,70%,.45)`; ctx.beginPath(); ctx.ellipse(PX, S.y - 20, 22, 28, 0, 0, 7); ctx.fill();
        for (let i = 0; i < 4; i++) { const a = S.anim * 6 + i * 1.57; drawStar(Math.round(PX + Math.cos(a) * 22), Math.round(S.y - 22 + Math.sin(a) * 26), 2, "#fff8d8"); }
        if (!blink) { ctx.translate(PX, S.y); ctx.scale(k, k); ctx.translate(-PX, -S.y); }
      }
      if (S.state === "over") { ctx.globalAlpha = 0.9; }
      Avatar.draw(ctx, av, PX, Math.round(S.y), "right", running ? frame : 0);
      ctx.restore();
      if (S.state === "over") { ctx.fillStyle = OUT; ctx.font = `bold 10px ${FONT}`; ctx.textAlign = "center"; ctx.fillText("✕ ✕", PX + 1, S.y - 30); }
      for (const f of S.fx) { ctx.fillStyle = f.col; ctx.fillRect(Math.round(f.x), Math.round(f.y), f.s, f.s); }
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (const p of S.pops) { ctx.font = `bold 9px ${FONT}`; ctx.fillStyle = "#fff"; ctx.fillText(p.text, p.x + 1, p.y + 1); ctx.fillStyle = p.col; ctx.fillText(p.text, p.x, p.y); }
      // HUD
      ctx.setTransform(R, 0, 0, R, 0, 0);
      const m = Math.floor(S.dist / 10);
      pill(6, 6, `${m} m`, "#3a2530", "#fff");
      pill(6, 22, `🪙 ${S.coins}/${S.cap}`, "#fff3a8", "#7a4a00");
      pill(W - 6, 6, `${t("gameBest")} ${best} m`, "rgba(58,37,48,.7)", "#fff", true);
      if (S.superT > 0) { ctx.fillStyle = OUT; ctx.fillRect(W / 2 - 41, 7, 82, 7); ctx.fillStyle = `hsl(${(S.anim * 300) % 360},90%,65%)`; ctx.fillRect(W / 2 - 40, 8, 80 * (S.superT / SUPER_TIME), 5); }
      if (S.state === "ready") panel([t("gameTitle"), dayLeft > 0 ? t("gameDayLeft", { n: dayLeft }) : t("gameDayDone"), t("gameStart")], true);
      if (S.state === "over") {
        const r = S.result || { m, coins: S.coins };
        panel([t("gameOver"), `${t("gameDist")} ${r.m} m · ${t("gameBest")} ${best} m`, `${t("gameEarn")} 🪙 ${r.coins}${r.saving ? "  (" + t("gameSaving") + ")" : ""}`, r.saving ? "" : dayLeft > 0 ? t("gameDayLeft", { n: dayLeft }) : t("gameDayDone"), performance.now() - S.overAt > 700 ? t("gameAgain") : ""]);
      }
    }
    function pill(x, y, text, bg, fg, right) {
      ctx.font = `bold 9px ${FONT}`; ctx.textBaseline = "middle";
      const w = ctx.measureText(text).width + 10;
      const x0 = right ? x - w : x;
      ctx.fillStyle = bg; ctx.fillRect(x0, y, w, 13); ctx.fillStyle = fg; ctx.textAlign = "left"; ctx.fillText(text, x0 + 5, y + 7);
    }
    function panel(lines, title) {
      const w = 312, h = 26 + lines.length * 16, x = (W - w) / 2, y = (H - h) / 2 - 8;
      ctx.fillStyle = "rgba(58,37,48,.25)"; ctx.fillRect(x + 3, y + 3, w, h);
      ctx.fillStyle = OUT; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
      ctx.fillStyle = "#fff8ea"; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#ff7fae"; ctx.fillRect(x, y, w, 4);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      lines.forEach((ln, i) => {
        const first = i === 0, lastL = i === lines.length - 1 && ln;
        ctx.font = `${first ? "bold 13px" : lastL ? "bold 11px" : "10px"} ${FONT}`;
        ctx.fillStyle = first ? "#d8434e" : lastL ? (Math.floor(S.anim * 2) % 2 ? "#ff4f9a" : "#7a3fc0") : OUT;
        ctx.fillText(ln, W / 2, y + 18 + i * 16);
      });
    }
    function loop(now) {
      if (!alive) return;
      const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      step(dt); draw();
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return {
      destroy() { alive = false; cancelAnimationFrame(raf); window.removeEventListener("keydown", onKey, true); cv.removeEventListener("pointerdown", onPtr); S = null; },
      get state() { return S && S.state; },
      _debug: () => S,
    };
  }
  function esc(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  window.JumpGame = { mount, speedAt };
})();
