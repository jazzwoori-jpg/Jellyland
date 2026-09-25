/* 🎰 럭키젤리! — 젤리게임월드의 룰렛(슬롯) 게임
   - 참가비 20코인, 버튼을 누르면 3개의 룰렛이 모두 돌고 4초 뒤에 결과
   - 결과(확률)는 서버에서 정해짐: Jelly!×3 = 100배(1/300) · Jelly!×2 = 10배(1/100) · 사과×3 = 3배(1/25) · 하트×3 = 3배(1/20) · 별 40% · 하루 20번
     · 별이 하나라도 있으면 참가비 그대로 · 그 외엔 참가비를 잃음 */
(function () {
  const W = 360, H = 250, R = 2, OUT = "#3a2530";
  const FONT = "'Galmuri11', 'Galmuri9', 'Apple SD Gothic Neo', 'Hiragino Sans', sans-serif";
  const SYMS = ["jelly", "apple", "heart", "star", "grape", "bell", "note", "candy", "clover", "lemon"];
  const SZ = 44; // 그림 한 칸 크기

  // ---------- 그림 (도트) ----------
  function mk(draw) { const c = document.createElement("canvas"); c.width = SZ; c.height = SZ; const x = c.getContext("2d"); x.imageSmoothingEnabled = false; draw(x); return c; }
  const blob = (x, cx, cy, rx, ry, col) => { x.fillStyle = col; for (let yy = -ry; yy <= ry; yy++) { const w = Math.round(rx * Math.sqrt(1 - (yy * yy) / (ry * ry))); x.fillRect(cx - w, cy + yy, w * 2, 1); } };
  const IMG = {
    jelly: mk((x) => { blob(x, 22, 22, 18, 16, OUT); blob(x, 22, 22, 17, 15, "#ff6fa8"); blob(x, 22, 19, 15, 11, "#ff9fc8"); x.fillStyle = "#ffe1f0"; x.fillRect(10, 12, 6, 3); x.fillRect(9, 15, 3, 5);
      x.fillStyle = OUT; x.fillRect(15, 20, 3, 4); x.fillRect(27, 20, 3, 4); x.fillStyle = "#fff"; x.fillRect(16, 20, 1, 1); x.fillRect(28, 20, 1, 1); x.fillStyle = "#d8434e"; x.fillRect(20, 27, 5, 2);
      x.font = `bold 11px ${FONT}`; x.textAlign = "center"; x.fillStyle = OUT; x.fillText("Jelly!", 23, 42); x.fillStyle = "#fff"; x.fillText("Jelly!", 22, 41); }),
    apple: mk((x) => { blob(x, 22, 25, 16, 15, OUT); blob(x, 22, 25, 15, 14, "#e0344a"); blob(x, 18, 21, 7, 6, "#ff6f7d"); x.fillStyle = "#fff"; x.fillRect(13, 17, 3, 3); x.fillStyle = OUT; x.fillRect(21, 5, 3, 8); x.fillStyle = "#3fa46a"; x.fillRect(24, 6, 8, 4); x.fillRect(26, 5, 4, 1); }),
    heart: mk((x) => { const h = (col, o) => { blob(x, 15, 17, 9 - o, 9 - o, col); blob(x, 29, 17, 9 - o, 9 - o, col); x.fillStyle = col; for (let yy = 0; yy < 18 - o; yy++) x.fillRect(7 + o + yy, 20 + yy, 30 - 2 * o - 2 * yy, 1); }; h(OUT, 0); h("#ff3b7f", 1); x.fillStyle = "#ffb8d8"; x.fillRect(11, 12, 5, 3); x.fillRect(10, 15, 2, 3); }),
    star: mk((x) => { const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 8 : 19; pts.push([22 + Math.cos(a) * r, 23 + Math.sin(a) * r]); }
      const poly = (col, s) => { x.fillStyle = col; x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo : x.moveTo).call(x, 22 + (a - 22) * s, 23 + (b - 23) * s)); x.closePath(); x.fill(); }; poly(OUT, 1.08); poly("#ffd34d", 1); poly("#fff3a8", 0.5); }),
    grape: mk((x) => { [[16, 16], [28, 16], [22, 22], [14, 26], [30, 26], [22, 31], [22, 11]].forEach(([a, b]) => { blob(x, a, b, 6, 6, OUT); blob(x, a, b, 5, 5, "#9d6bd8"); x.fillStyle = "#d7c2ff"; x.fillRect(a - 3, b - 3, 2, 2); }); x.fillStyle = "#3fa46a"; x.fillRect(22, 2, 3, 6); x.fillRect(25, 3, 7, 3); }),
    bell: mk((x) => { x.fillStyle = OUT; x.beginPath(); x.moveTo(22, 4); x.quadraticCurveTo(6, 8, 7, 32); x.lineTo(37, 32); x.quadraticCurveTo(38, 8, 22, 4); x.fill(); x.fillStyle = "#f2c14e"; x.beginPath(); x.moveTo(22, 6); x.quadraticCurveTo(9, 10, 9, 30); x.lineTo(35, 30); x.quadraticCurveTo(35, 10, 22, 6); x.fill();
      x.fillStyle = "#fff3a8"; x.fillRect(14, 12, 3, 12); x.fillStyle = OUT; x.fillRect(5, 30, 34, 5); x.fillStyle = "#c9982c"; x.fillRect(6, 31, 32, 3); blob(x, 22, 38, 4, 3, OUT); blob(x, 22, 38, 3, 2, "#c9982c"); }),
    note: mk((x) => { x.fillStyle = OUT; x.fillRect(26, 5, 4, 26); x.fillRect(26, 5, 12, 4); x.fillRect(34, 5, 4, 10); blob(x, 21, 32, 8, 6, OUT); blob(x, 21, 32, 7, 5, "#6fb8ff"); x.fillStyle = "#6fb8ff"; x.fillRect(27, 6, 2, 24); x.fillRect(27, 6, 10, 2); x.fillStyle = "#cfe8ff"; x.fillRect(17, 29, 3, 2); }),
    candy: mk((x) => { x.fillStyle = OUT; x.beginPath(); x.moveTo(2, 12); x.lineTo(12, 22); x.lineTo(2, 32); x.fill(); x.beginPath(); x.moveTo(42, 12); x.lineTo(32, 22); x.lineTo(42, 32); x.fill(); x.fillStyle = "#8fe07a"; x.fillRect(4, 18, 6, 8); x.fillRect(34, 18, 6, 8);
      blob(x, 22, 22, 12, 11, OUT); blob(x, 22, 22, 11, 10, "#fff"); x.fillStyle = "#ff7fae"; for (let i = -10; i < 10; i += 5) x.fillRect(22 + i, 13, 2, 18); x.fillStyle = "#fff"; x.fillRect(15, 15, 3, 3); }),
    clover: mk((x) => { [[16, 16], [28, 16], [16, 28], [28, 28]].forEach(([a, b]) => { blob(x, a, b, 8, 8, OUT); blob(x, a, b, 7, 7, "#3fae5a"); x.fillStyle = "#8fe07a"; x.fillRect(a - 3, b - 3, 3, 2); }); x.fillStyle = OUT; x.fillRect(21, 30, 3, 12); x.fillStyle = "#2c7a3e"; x.fillRect(22, 31, 1, 10); }),
    lemon: mk((x) => { blob(x, 22, 23, 18, 12, OUT); blob(x, 22, 23, 17, 11, "#f7e27a"); blob(x, 19, 20, 10, 5, "#fff3a8"); x.fillStyle = OUT; x.fillRect(38, 21, 4, 4); x.fillRect(2, 21, 4, 4); x.fillStyle = "#3fa46a"; x.fillRect(20, 9, 8, 4); }),
  };

  function mount(root, opts) {
    const t = opts.t;
    root.innerHTML = `<div class="sl-wrap"><canvas class="sl" width="${W * R}" height="${H * R}"></canvas>
      <div class="sl-bar"><span class="sl-coins"></span><span class="sl-left"></span><button class="btn pink sl-spin">🎰 ${esc(t("slSpin"))}</button></div>
      <div class="sl-pay">${[["jelly", "jelly", "jelly", "×100"], ["jelly", "jelly", "any", "×10"], ["apple", "apple", "apple", "×3"], ["heart", "heart", "heart", "×3"], ["star", "any", "any", t("slRefund")]]
        .map((r) => `<div class="sl-row">${r.slice(0, 3).map((s) => (s === "any" ? `<i class="any">?</i>` : `<canvas data-s="${s}" width="44" height="44"></canvas>`)).join("")}<b>${esc(r[3])}</b></div>`).join("")}</div>
      <p class="sl-note">${esc(t("slNote"))}</p></div>`;
    root.querySelectorAll(".sl-pay canvas").forEach((c) => c.getContext("2d").drawImage(IMG[c.dataset.s], 0, 0));
    const cv = root.querySelector("canvas.sl"), ctx = cv.getContext("2d"); ctx.imageSmoothingEnabled = false;
    const btn = root.querySelector(".sl-spin");
    const setCoins = () => {
      root.querySelector(".sl-coins").textContent = "🪙 " + (opts.coins() | 0).toLocaleString();
      const left = opts.left(); root.querySelector(".sl-left").textContent = t("slLeft", { n: left });
      if (state !== "spin") btn.disabled = left <= 0;
    };
    // 릴: 각자 무작위 순서의 그림 띠
    const strip = () => { const a = []; for (let k = 0; k < 3; k++) a.push(...SYMS.slice().sort(() => Math.random() - 0.5)); return a; };
    const reels = [0, 1, 2].map(() => ({ strip: strip(), pos: Math.random() * 30, speed: 0, stopAt: 0, target: null, from: 0, to: 0, done: true }));
    let state = "idle", spinStart = 0, result = null, msg = null, anim = 0, fx = [], alive = true, raf = 0, last = 0;
    setCoins();
    const snd = (n) => { try { window.SFX && window.SFX[n] && window.SFX[n](); } catch {} };

    async function spin() {
      if (state === "spin") return;
      if (opts.left() <= 0) { opts.toast(t("e_slotDaily")); return; }
      if ((opts.coins() | 0) < 20) { opts.toast(t("e_coins")); return; }
      state = "spin"; msg = null; result = null; btn.disabled = true;
      spinStart = performance.now();
      reels.forEach((r, i) => { r.done = false; r.speed = 18 + i * 2; r.target = null; r.stopAt = spinStart + 2600 + i * 700; });
      snd("slotStart");
      try {
        result = await opts.onSpin();
        setCoins();
      } catch (e) { state = "idle"; btn.disabled = false; reels.forEach((r) => (r.done = true)); opts.toast(e.message); return; }
      // 결과 그림이 가운데에 멈추도록 목표 위치 계산
      reels.forEach((r, i) => {
        const sym = result.reels[i], n = r.strip.length;
        const now = r.pos, base = Math.ceil(now) + 12 + i * 4;
        let k = base; while (r.strip[((k % n) + n) % n] !== sym) k++;
        r.target = k;
      });
    }
    btn.addEventListener("click", spin);
    const kd = (e) => { if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); e.stopPropagation(); if (!e.repeat) spin(); } };
    window.addEventListener("keydown", kd, true);

    function step(dt, now) {
      anim += dt;
      for (const f of fx) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 260 * dt; f.life -= dt; }
      fx = fx.filter((f) => f.life > 0);
      if (state !== "spin") return;
      let tick = false;
      reels.forEach((r) => {
        if (r.done) return;
        if (r.target != null && now >= r.stopAt - 700 && r.from === 0) { r.from = r.pos; r.fromT = now; } // 멈추기 시작 (0.7초 동안 감속)
        if (r.from) {
          const k = Math.min(1, (now - r.fromT) / 700), e = 1 - Math.pow(1 - k, 3);
          const prev = r.pos; r.pos = r.from + (r.target - r.from) * e;
          if (Math.floor(prev) !== Math.floor(r.pos)) tick = true;
          if (k >= 1) { r.pos = r.target; r.done = true; r.from = 0; snd("slotStop"); }
        } else { const prev = r.pos; r.pos += r.speed * dt; if (Math.floor(prev) !== Math.floor(r.pos)) tick = true; }
      });
      if (tick && Math.random() < 0.5) snd("slotTick");
      if (reels.every((r) => r.done) && result) finishSpin();
    }
    function finishSpin() {
      state = "idle"; btn.disabled = false;
      const o = result.outcome;
      msg = { outcome: o, payout: result.payout, t0: performance.now() };
      if (o === "jackpot") { snd("jackpot"); burst(60); }
      else if (o === "jelly2" || o === "apple" || o === "heart") { snd("win"); burst(24); }
      else if (o === "star") snd("coin");
      else snd("aww");
      opts.onResult && opts.onResult(result);
      setCoins();
    }
    function burst(n) { for (let i = 0; i < n; i++) fx.push({ x: W / 2 + (Math.random() - 0.5) * 200, y: 100, vx: (Math.random() - 0.5) * 220, vy: -80 - Math.random() * 200, life: 1.4, col: ["#ffd34d", "#ff7fae", "#7fe3ff", "#fff"][i % 4], s: 3 }); }

    function draw() {
      const now = performance.now();
      ctx.setTransform(R, 0, 0, R, 0, 0);
      // 배경: 반짝이는 무대 조명
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#2b1d4a"); g.addColorStop(1, "#5a2b6b");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 18; i++) { const on = (Math.floor(anim * 6) + i) % 3 === 0; ctx.fillStyle = on ? "#fff3a8" : "#8a5ab0"; ctx.fillRect(12 + i * 19, 8, 5, 5); ctx.fillRect(12 + i * 19, H - 14, 5, 5); }
      // 기계 몸체
      const mx = 40, my = 30, mw = 280, mh = 170;
      ctx.fillStyle = OUT; ctx.fillRect(mx - 3, my - 3, mw + 6, mh + 6);
      ctx.fillStyle = "#ff7fae"; ctx.fillRect(mx, my, mw, mh); ctx.fillStyle = "#ffb8d8"; ctx.fillRect(mx, my, mw, 4); ctx.fillStyle = "#d84a86"; ctx.fillRect(mx, my + mh - 5, mw, 5);
      // 간판
      ctx.fillStyle = OUT; ctx.fillRect(W / 2 - 70, my - 22, 140, 30); ctx.fillStyle = "#ffd34d"; ctx.fillRect(W / 2 - 68, my - 20, 136, 26);
      ctx.font = `bold 16px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#d8434e"; ctx.fillText("LUCKY JELLY!", W / 2 + 1, my - 6); ctx.fillStyle = OUT; ctx.fillText("LUCKY JELLY!", W / 2, my - 7);
      // 릴 창
      const rx0 = mx + 22, ry = my + 30, rw = 70, rh = 112, gap = 12;
      reels.forEach((r, i) => {
        const x = rx0 + i * (rw + gap);
        ctx.fillStyle = OUT; ctx.fillRect(x - 3, ry - 3, rw + 6, rh + 6);
        ctx.save(); ctx.beginPath(); ctx.rect(x, ry, rw, rh); ctx.clip();
        ctx.fillStyle = "#fffaf2"; ctx.fillRect(x, ry, rw, rh);
        const n = r.strip.length, cell = 50, center = ry + rh / 2;
        const base = Math.floor(r.pos), frac = r.pos - base;
        for (let k = -2; k <= 2; k++) {
          const idx = (((base + k) % n) + n) % n, cy = center + (k - frac) * cell;
          const blur = !r.done && !r.from ? 0.55 : 1;
          ctx.globalAlpha = blur; ctx.drawImage(IMG[r.strip[idx]], x + rw / 2 - SZ / 2, cy - SZ / 2); ctx.globalAlpha = 1;
        }
        const sh = ctx.createLinearGradient(0, ry, 0, ry + rh); sh.addColorStop(0, "rgba(58,37,48,.45)"); sh.addColorStop(0.28, "rgba(58,37,48,0)"); sh.addColorStop(0.72, "rgba(58,37,48,0)"); sh.addColorStop(1, "rgba(58,37,48,.45)");
        ctx.fillStyle = sh; ctx.fillRect(x, ry, rw, rh);
        ctx.restore();
      });
      // 가운데 당첨선
      ctx.fillStyle = "rgba(216,67,78,.85)"; ctx.fillRect(rx0 - 10, ry + rh / 2 - 1, 3 * rw + 2 * gap + 20, 2);
      ctx.fillStyle = "#ffd34d"; ctx.beginPath(); ctx.moveTo(rx0 - 14, ry + rh / 2 - 6); ctx.lineTo(rx0 - 6, ry + rh / 2); ctx.lineTo(rx0 - 14, ry + rh / 2 + 6); ctx.fill();
      ctx.beginPath(); const rxe = rx0 + 3 * rw + 2 * gap; ctx.moveTo(rxe + 14, ry + rh / 2 - 6); ctx.lineTo(rxe + 6, ry + rh / 2); ctx.lineTo(rxe + 14, ry + rh / 2 + 6); ctx.fill();
      // 결과 표시
      if (msg) {
        const k = Math.min(1, (now - msg.t0) / 300), big = msg.outcome === "jackpot";
        const text = { jackpot: t("slJackpot"), jelly2: t("slWin", { n: msg.payout }), apple: t("slWin", { n: msg.payout }), heart: t("slWin", { n: msg.payout }), star: t("slStar"), lose: t("slLose") }[msg.outcome];
        const col = big ? `hsl(${(anim * 300) % 360},90%,60%)` : msg.outcome === "lose" ? "#8a7a8a" : msg.outcome === "star" ? "#c98a2c" : "#d8434e";
        ctx.save(); ctx.translate(W / 2, my + mh + 26); ctx.scale(0.6 + 0.4 * k + (big ? Math.sin(anim * 8) * 0.05 : 0), 0.6 + 0.4 * k);
        ctx.font = `bold ${big ? 20 : 15}px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        const tw = ctx.measureText(text).width + 24;
        ctx.fillStyle = OUT; ctx.fillRect(-tw / 2 - 2, -15, tw + 4, 30); ctx.fillStyle = "#fff8ea"; ctx.fillRect(-tw / 2, -13, tw, 26);
        ctx.fillStyle = col; ctx.fillText(text, 0, 1); ctx.restore();
      } else if (state === "spin") {
        ctx.font = `bold 13px ${FONT}`; ctx.textAlign = "center"; ctx.fillStyle = "#fff3a8"; ctx.fillText(t("slSpinning") + ".".repeat(1 + (Math.floor(anim * 4) % 3)), W / 2, my + mh + 24);
      } else {
        ctx.font = `12px ${FONT}`; ctx.textAlign = "center"; ctx.fillStyle = "#fff3a8"; ctx.fillText(t("slHint"), W / 2, my + mh + 24);
      }
      for (const f of fx) { ctx.fillStyle = f.col; ctx.fillRect(Math.round(f.x), Math.round(f.y), f.s, f.s); }
    }
    function loop(now) { if (!alive) return; const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now; step(dt, now); draw(); raf = requestAnimationFrame(loop); }
    raf = requestAnimationFrame(loop);
    return { destroy() { alive = false; cancelAnimationFrame(raf); window.removeEventListener("keydown", kd, true); } };
  }
  function esc(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  window.LuckyJelly = { mount };
})();
