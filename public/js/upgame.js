/* ⬆️ 올라올라 — 젤리게임월드의 두 번째 미니게임
   - 캐릭터가 발판 위에서 자동으로 통통 튀어 오르고, 좌우로 움직여 위로 올라감 (화면 양 끝은 이어져 있음)
   - 초록 발판: 보통 점프 · 분홍 발판: 슈퍼 점프 (초록 13개당 1번 꼴) · 빨강 발판: 밟으면 부서져서 떨어짐
   - 높이가 올라갈수록 발판 간격이 넓어지고 움직이는 발판이 늘어남
   - 10px = 1m, 100m 마다 5코인 (한 판 최대 200 · 두 게임 합쳐 하루 최대 600)
   - 조작: ← → / A D 키, 휴대폰은 화면 왼쪽·오른쪽을 누르고 있기 */
(function () {
  const W = 240, H = 360, R = 2;
  const GRAV = 980, JUMP = -440, SUPER = -900, MAXVX = 190, ACC = 1300;
  const PW = 46, PH = 9;
  const FONT = "'Galmuri11', 'Galmuri9', 'Apple SD Gothic Neo', 'Hiragino Sans', sans-serif";
  const OUT = "#3a2530";

  const snd = (n) => { try { window.SFX && window.SFX[n](); } catch {} };
  function mount(root, opts) {
    const t = opts.t;
    root.innerHTML = `<div class="ug-wrap"><canvas class="ug" width="${W * R}" height="${H * R}"></canvas>
      <div class="ug-help"><span>${esc(t("upHow"))}</span><span>${esc(t("upHow2"))}</span><span>${esc(t("gameHow3"))}</span></div></div>`;
    const cv = root.querySelector("canvas"), ctx = cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    let best = +(localStorage.getItem("jl_best_up") || 0) || 0;
    let dayLeft = opts.dayLeft == null ? 600 : opts.dayLeft;
    let S = null, raf = 0, last = 0, alive = true;
    const input = { l: false, r: false, pl: false, pr: false };

    function reset() {
      S = { state: "ready", time: 0, x: W / 2, y: H - 40, vx: 0, vy: 0, face: "right", cam: 0, maxH: 0, plats: [], fx: [], pops: [], topY: H - 20,
        greens: 0, milestone: 0, coins: 0, cap: Math.min(200, dayLeft), run: null, result: null, anim: 0, stars: [] };
      S.plats.push({ x: W / 2 - PW / 2, y: H - 20, type: "g", vx: 0 });
      while (S.topY > -H) spawnRow();
      for (let i = 0; i < 40; i++) S.stars.push({ x: Math.random() * W, y: Math.random() * H * 3, s: Math.random() < 0.2 ? 2 : 1 });
    }
    const heightM = () => Math.max(0, Math.floor(S.maxH / 10));
    function spawnRow() {
      const h = Math.max(0, (H - 20 - S.topY) / 10); // 지금까지 만든 높이(m)
      const maxGap = Math.min(92, 46 + h * 0.04);
      const gap = 26 + Math.random() * (maxGap - 26);
      S.topY -= gap;
      let type = "g";
      S.greens++;
      if (S.greens >= 13) { type = "p"; S.greens = 0; } // 초록 13개당 슈퍼 점프 1개
      const moving = type === "g" && h > 120 && Math.random() < Math.min(0.45, 0.12 + h / 2500);
      S.plats.push({ x: Math.random() * (W - PW), y: S.topY, type, vx: moving ? (Math.random() < 0.5 ? -1 : 1) * (30 + Math.min(60, h / 20)) : 0 });
      // 빨간 발판 (부서지는 함정) — 길을 막지 않도록 따로 추가
      if (h > 20 && Math.random() < Math.min(0.42, 0.12 + h / 3000)) {
        S.plats.push({ x: Math.random() * (W - PW), y: S.topY + gap * (0.35 + Math.random() * 0.3), type: "r", vx: 0 });
      }
    }

    // ---------- 입력 ----------
    function press() {
      if (S.state === "ready") return start();
      if (S.state === "over" && S.result && performance.now() - S.overAt > 700) { reset(); start(); }
    }
    const KEYS = { ArrowLeft: "l", KeyA: "l", ArrowRight: "r", KeyD: "r" };
    const kd = (e) => {
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
      if (KEYS[e.code]) { e.preventDefault(); e.stopPropagation(); input[KEYS[e.code]] = true; if (S.state !== "run") press(); return; }
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") { e.preventDefault(); e.stopPropagation(); if (!e.repeat) press(); }
    };
    const ku = (e) => { if (KEYS[e.code]) input[KEYS[e.code]] = false; };
    const ptrs = new Map();
    const side = (e) => { const r = cv.getBoundingClientRect(); return e.clientX - r.left < r.width / 2 ? "pl" : "pr"; };
    const updPtr = () => { input.pl = [...ptrs.values()].includes("pl"); input.pr = [...ptrs.values()].includes("pr"); };
    cv.addEventListener("pointerdown", (e) => { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch {} if (S.state !== "run") { press(); return; } ptrs.set(e.pointerId, side(e)); updPtr(); });
    cv.addEventListener("pointermove", (e) => { if (ptrs.has(e.pointerId)) { ptrs.set(e.pointerId, side(e)); updPtr(); } });
    const pu = (e) => { ptrs.delete(e.pointerId); updPtr(); };
    cv.addEventListener("pointerup", pu); cv.addEventListener("pointercancel", pu);
    cv.addEventListener("contextmenu", (e) => e.preventDefault());
    window.addEventListener("keydown", kd, true); window.addEventListener("keyup", ku, true);

    function start() {
      S.state = "run"; S.vy = JUMP; snd("jump");
      opts.onStart && opts.onStart().then((r) => { if (!S) return; S.run = r && r.run; if (r && r.dayLeft != null) { dayLeft = r.dayLeft; S.cap = Math.min(200, dayLeft); S.coins = Math.min(S.coins, S.cap); } }).catch(() => {});
    }
    async function finish() {
      S.state = "over"; S.overAt = performance.now();
      const m = heightM();
      if (m > best) { best = m; try { localStorage.setItem("jl_best_up", String(m)); } catch {} }
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
      for (const p of S.pops) { p.y -= 20 * dt; p.life -= dt; }
      S.pops = S.pops.filter((p) => p.life > 0);
      if (S.state !== "run") return;
      S.time += dt;
      // 좌우 이동
      const dir = (input.l || input.pl ? -1 : 0) + (input.r || input.pr ? 1 : 0);
      if (dir) { S.vx += dir * ACC * dt; S.face = dir > 0 ? "right" : "left"; }
      else S.vx *= Math.pow(0.0015, dt);
      S.vx = Math.max(-MAXVX, Math.min(MAXVX, S.vx));
      S.x += S.vx * dt;
      if (S.x < -10) S.x += W + 20; if (S.x > W + 10) S.x -= W + 20; // 양 끝은 이어져 있음
      // 발판 움직임
      for (const p of S.plats) {
        if (p.vx) { p.x += p.vx * dt; if (p.x < 0) { p.x = 0; p.vx *= -1; } if (p.x > W - PW) { p.x = W - PW; p.vx *= -1; } }
        if (p.broken) { p.fall = (p.fall || 0) + 600 * dt; p.y += p.fall * dt; p.rot = (p.rot || 0) + dt * 4; }
      }
      // 점프 물리 + 발판 밟기 (떨어지는 중일 때만)
      const prevY = S.y;
      S.vy += GRAV * dt; S.y += S.vy * dt;
      if (S.vy > 0) {
        for (const p of S.plats) {
          if (p.broken) continue;
          if (prevY <= p.y + 1 && S.y >= p.y && S.x > p.x - 6 && S.x < p.x + PW + 6) {
            if (p.type === "r") { // 빨간 발판: 부서짐 (튀어오르지 않음)
              p.broken = true; snd("crack");
              for (let i = 0; i < 10; i++) S.fx.push({ x: p.x + Math.random() * PW, y: p.y + 4, vx: (Math.random() - 0.5) * 120, vy: -Math.random() * 80, g: 500, life: 0.8, col: i % 2 ? "#e0344a" : "#ff8f9f", s: 3 });
              continue;
            }
            S.y = p.y;
            if (p.type === "p") {
              S.vy = SUPER; snd("superJump");
              S.pops.push({ x: S.x, y: S.y - 40, text: "SUPER JUMP!", life: 1, col: "#ff4f9a" });
              for (let i = 0; i < 18; i++) S.fx.push({ x: S.x, y: S.y, vx: (Math.random() - 0.5) * 200, vy: -Math.random() * 220, g: 300, life: 0.9, col: ["#ff9fc8", "#fff3a8", "#ffffff"][i % 3], s: 2 });
            } else {
              S.vy = JUMP; snd("jump");
              for (let i = 0; i < 5; i++) S.fx.push({ x: S.x + (Math.random() - 0.5) * 16, y: S.y, vx: (Math.random() - 0.5) * 60, vy: -Math.random() * 40, g: 200, life: 0.35, col: "#d9ffd0", s: 2 });
            }
            p.squash = 0.15;
            break;
          }
        }
      }
      for (const p of S.plats) if (p.squash) p.squash = Math.max(0, p.squash - dt);
      // 카메라: 위로만 따라감
      const target = S.y - H * 0.42;
      if (target < S.cam) S.cam = target;
      S.maxH = Math.max(S.maxH, H - 40 - S.y);
      // 새 발판 만들기 / 지나간 발판 지우기
      while (S.topY > S.cam - 60) spawnRow();
      S.plats = S.plats.filter((p) => p.y < S.cam + H + 60);
      // 100m 마다 코인
      const ms = Math.floor(heightM() / 100);
      while (S.milestone < ms) {
        S.milestone++;
        if (S.coins < S.cap) { S.coins = Math.min(S.cap, S.coins + 5); snd("coin"); S.pops.push({ x: S.x + 14, y: S.y - 50, text: S.coins >= S.cap ? t("gameMax") : "+5 🪙", life: 1.1, col: "#c98a2c" }); }
      }
      // 떨어지면 끝
      if (S.y > S.cam + H + 30) { snd("laugh"); finish(); }
    }

    // ---------- 그리기 ----------
    function drawBg() {
      const h = S.maxH / 10;
      const k = Math.min(1, h / 1500); // 높이 올라갈수록 하늘 → 우주
      const mix = (a, b) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
      const top = mix([191, 230, 255], [40, 30, 80]), bot = mix([255, 225, 240], [120, 70, 160]);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, `rgb(${top})`); g.addColorStop(1, `rgb(${bot})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      if (k > 0.2) { ctx.fillStyle = `rgba(255,255,255,${Math.min(1, (k - 0.2) * 1.5)})`; for (const s of S.stars) { const y = ((s.y - S.cam * 0.2) % (H * 3) + H * 3) % (H * 3); if (y < H) ctx.fillRect(s.x, y, s.s, s.s); } }
      // 구름 (천천히 흐름)
      ctx.fillStyle = `rgba(255,255,255,${0.85 - k * 0.6})`;
      for (let i = 0; i < 5; i++) {
        const cy = ((i * 170 - S.cam * 0.35) % (H + 80) + H + 80) % (H + 80) - 40, cx = (i * 97 + S.anim * 6) % (W + 60) - 30;
        ctx.fillRect(cx, cy, 36, 8); ctx.fillRect(cx + 6, cy - 5, 20, 6); ctx.fillRect(cx + 20, cy - 3, 10, 4);
      }
      // 높이 눈금 (50m 마다)
      ctx.font = `8px ${FONT}`; ctx.textAlign = "left"; ctx.textBaseline = "middle";
      for (let m = Math.floor((H - 40 - (S.cam + H)) / 500) * 50; m < (H - 40 - S.cam) / 10 + 50; m += 50) {
        if (m <= 0) continue;
        const y = H - 40 - m * 10 - S.cam;
        if (y < 0 || y > H) continue;
        ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fillRect(0, y, 6, 1); ctx.fillText(m + "m", 8, y);
      }
    }
    const COL = { g: ["#5cc86a", "#8fe07a", "#3f9a4c"], p: ["#ff6fa8", "#ffb8d8", "#d84a86"], r: ["#e0344a", "#ff8f9f", "#9e1f2f"] };
    function drawPlat(p) {
      const y = Math.round(p.y - S.cam), x = Math.round(p.x);
      if (y < -20 || y > H + 20) return;
      const [c1, c2, c3] = COL[p.type];
      const sq = p.squash ? 2 : 0;
      ctx.save();
      if (p.broken) { ctx.translate(x + PW / 2, y + PH / 2); ctx.rotate(p.rot || 0); ctx.globalAlpha = 0.8; ctx.translate(-(x + PW / 2), -(y + PH / 2)); }
      ctx.fillStyle = OUT; ctx.fillRect(x, y + sq, PW, PH - sq); ctx.fillRect(x + 2, y - 1 + sq, PW - 4, 1);
      ctx.fillStyle = c1; ctx.fillRect(x + 1, y + 1 + sq, PW - 2, PH - 2 - sq);
      ctx.fillStyle = c2; ctx.fillRect(x + 2, y + 1 + sq, PW - 4, 2);
      ctx.fillStyle = c3; ctx.fillRect(x + 1, y + PH - 2, PW - 2, 1);
      if (p.type === "p") { ctx.fillStyle = "#fff"; for (let i = 0; i < 3; i++) { const sx = x + 10 + i * 13; ctx.fillRect(sx, y + 3, 3, 1); ctx.fillRect(sx + 1, y + 2, 1, 3); } } // 슈퍼 점프 표시 ▲
      if (p.type === "r" && !p.broken) { ctx.fillStyle = c3; ctx.fillRect(x + 14, y + 2, 1, 5); ctx.fillRect(x + 15, y + 4, 4, 1); ctx.fillRect(x + 30, y + 2, 1, 5); ctx.fillRect(x + 26, y + 3, 4, 1); } // 금 간 자국
      if (p.vx) { ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.fillRect(x - 4, y + 3, 2, 2); ctx.fillRect(x + PW + 2, y + 3, 2, 2); }
      ctx.restore();
    }
    function draw() {
      ctx.setTransform(R, 0, 0, R, 0, 0);
      drawBg();
      for (const p of S.plats) drawPlat(p);
      // 캐릭터
      const av = opts.avatar();
      const py = Math.round(S.y - S.cam);
      const frame = S.vy < -200 ? 1 : S.vy > 250 ? 3 : 0;
      Avatar.draw(ctx, av, Math.round(S.x), py, S.state === "ready" ? "down" : S.face, frame);
      if (S.x < 12) Avatar.draw(ctx, av, Math.round(S.x + W + 20), py, S.face, frame); // 화면 끝에서 이어지는 모습
      if (S.x > W - 12) Avatar.draw(ctx, av, Math.round(S.x - W - 20), py, S.face, frame);
      for (const f of S.fx) { ctx.fillStyle = f.col; ctx.fillRect(Math.round(f.x), Math.round(f.y - S.cam), f.s, f.s); }
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (const p of S.pops) { ctx.font = `bold 9px ${FONT}`; ctx.fillStyle = "#fff"; ctx.fillText(p.text, p.x + 1, p.y - S.cam + 1); ctx.fillStyle = p.col; ctx.fillText(p.text, p.x, p.y - S.cam); }
      // HUD
      pill(6, 6, `⬆ ${heightM()} m`, OUT, "#fff");
      pill(6, 22, `🪙 ${S.coins}/${S.cap}`, "#fff3a8", "#7a4a00");
      pill(W - 6, 6, `${t("gameBest")} ${best} m`, "rgba(58,37,48,.7)", "#fff", true);
      if (S.state === "ready") panel([t("upTitle"), dayLeft > 0 ? t("gameDayLeft", { n: dayLeft }) : t("gameDayDone"), t("upLegend"), t("gameStart")]);
      if (S.state === "over") {
        const r = S.result || { m: heightM(), coins: S.coins };
        panel([t("gameOver"), `${t("upHeight")} ${r.m} m · ${t("gameBest")} ${best} m`, `${t("gameEarn")} 🪙 ${r.coins}${r.saving ? "  (" + t("gameSaving") + ")" : ""}`, r.saving ? "" : dayLeft > 0 ? t("gameDayLeft", { n: dayLeft }) : t("gameDayDone"), performance.now() - S.overAt > 700 ? t("gameAgain") : ""]);
      }
    }
    function pill(x, y, text, bg, fg, right) {
      ctx.font = `bold 9px ${FONT}`; ctx.textBaseline = "middle";
      const w = ctx.measureText(text).width + 10, x0 = right ? x - w : x;
      ctx.fillStyle = bg; ctx.fillRect(x0, y, w, 13); ctx.fillStyle = fg; ctx.textAlign = "left"; ctx.fillText(text, x0 + 5, y + 7);
    }
    function panel(lines) {
      const w = 220, h = 26 + lines.length * 17, x = (W - w) / 2, y = (H - h) / 2 - 20;
      ctx.fillStyle = "rgba(58,37,48,.25)"; ctx.fillRect(x + 3, y + 3, w, h);
      ctx.fillStyle = OUT; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
      ctx.fillStyle = "#fff8ea"; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#5cc86a"; ctx.fillRect(x, y, w, 4);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      lines.forEach((ln, i) => {
        const first = i === 0, lastL = i === lines.length - 1 && ln;
        let fs = first ? 13 : lastL ? 11 : 9;
        ctx.font = `${first || lastL ? "bold " : ""}${fs}px ${FONT}`;
        while (ctx.measureText(ln).width > w - 12 && fs > 6) { fs--; ctx.font = `${first || lastL ? "bold " : ""}${fs}px ${FONT}`; }
        ctx.fillStyle = first ? "#3f9a4c" : lastL ? (Math.floor(S.anim * 2) % 2 ? "#ff4f9a" : "#7a3fc0") : OUT;
        ctx.fillText(ln, W / 2, y + 18 + i * 17);
      });
    }
    function loop(now) {
      if (!alive) return;
      const dt = Math.min(0.033, (now - (last || now)) / 1000); last = now;
      step(dt); draw();
      raf = requestAnimationFrame(loop);
    }
    reset();
    raf = requestAnimationFrame(loop);
    return {
      destroy() { alive = false; cancelAnimationFrame(raf); window.removeEventListener("keydown", kd, true); window.removeEventListener("keyup", ku, true); S = null; },
      _debug: () => S,
    };
  }
  function esc(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  window.UpGame = { mount };
})();
