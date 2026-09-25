/* 🎹 피아노 연주 — 광장 중앙 / 팬 라운지 피아노
   - 건반 2옥타브 반(C3~E5 기본), 옥타브 이동 가능
   - 여러 손가락 동시 터치(화음), 건반 위로 미끄러지면 글리산도
   - 키보드: A S D F G H J K L ; ' = 흰 건반, W E T Y U O P = 검은 건반, Z/X = 옥타브, Space = 페달
   - 소리는 Web Audio 로 합성 (파일 다운로드 없음) */
(function () {
  let actx = null, master = null, comp = null;
  function ctx() {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { if ("audioSession" in navigator) navigator.audioSession.type = "playback"; } catch {} // 아이폰 무음 모드에서도 소리 나게
      actx = new AC();
      comp = actx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
      master = actx.createGain(); master.gain.value = 0.55;
      master.connect(comp).connect(actx.destination);
    }
    if (actx.state !== "running") actx.resume().catch(() => {});
    return actx;
  }
  const freq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
  // 피아노 느낌 합성음: 배음 여러 개 + 빠른 어택 + 음높이에 따라 다른 감쇠 + 해머 소리
  function strike(midi, vel = 0.9) {
    const c = ctx(); if (!c) return null;
    const t = c.currentTime, f = freq(midi);
    const decay = Math.max(0.9, 4.2 - (midi - 48) * 0.07);
    const out = c.createGain(); out.gain.value = 0;
    const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(Math.min(12000, f * 9), t); lp.frequency.exponentialRampToValueAtTime(Math.max(600, f * 2.2), t + decay * 0.6);
    out.connect(lp).connect(master);
    const parts = [[1, 1, "triangle"], [2, 0.42, "sine"], [3, 0.2, "sine"], [4, 0.1, "sine"], [0.5, midi < 55 ? 0.18 : 0, "sine"]];
    const oscs = [];
    for (const [mul, amp, type] of parts) {
      if (!amp) continue;
      const o = c.createOscillator(); o.type = type; o.frequency.value = f * mul; o.detune.value = (Math.random() - 0.5) * 4;
      const g = c.createGain(); g.gain.value = amp; o.connect(g).connect(out); o.start(t); oscs.push(o);
    }
    const peak = 0.32 * vel;
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(peak, t + 0.006);
    out.gain.exponentialRampToValueAtTime(peak * 0.45, t + 0.25);
    out.gain.exponentialRampToValueAtTime(0.0008, t + decay);
    // 해머 타격음
    const nb = c.createBuffer(1, Math.floor(c.sampleRate * 0.03), c.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / nd.length);
    const ns = c.createBufferSource(); ns.buffer = nb; const ng = c.createGain(); ng.gain.value = 0.05 * vel; const nf = c.createBiquadFilter(); nf.type = "bandpass"; nf.frequency.value = f * 3;
    ns.connect(nf).connect(ng).connect(master); ns.start(t);
    const stopAt = t + decay + 0.1;
    oscs.forEach((o) => o.stop(stopAt));
    return { out, oscs, t, released: false };
  }
  function release(v, fast) {
    if (!v || v.released || !actx) return; v.released = true;
    const t = actx.currentTime, len = fast ? 0.12 : 0.35;
    try { v.out.gain.cancelScheduledValues(t); v.out.gain.setValueAtTime(Math.max(0.0008, v.out.gain.value), t); v.out.gain.exponentialRampToValueAtTime(0.0008, t + len); v.oscs.forEach((o) => { try { o.stop(t + len + 0.05); } catch {} }); } catch {}
  }

  const WHITE = [0, 2, 4, 5, 7, 9, 11];
  const NAMES = { ko: ["도", "레", "미", "파", "솔", "라", "시"], en: ["C", "D", "E", "F", "G", "A", "B"], ja: ["ド", "レ", "ミ", "ファ", "ソ", "ラ", "シ"] };
  const KEY_WHITE = ["KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL", "Semicolon", "Quote"];
  const KEY_BLACK = { KeyW: 1, KeyE: 3, KeyT: 6, KeyY: 8, KeyU: 10, KeyO: 13, KeyP: 15 }; // 기준음(C)에서 반음 수

  function mount(root, opts) {
    const t = opts.t, lang = opts.lang || "ko";
    let base = 48; // C3
    const SPAN = 29; // C3 ~ E5 (흰 건반 17개)
    let sustain = false;
    const voices = new Map(); // pointerId|key -> {midi, v}
    const held = new Map();   // midi -> voice (서스테인용)
    root.innerHTML = `<div class="pn-wrap">
      <div class="pn-bar"><button class="btn sm" data-oct="-1">◀ ${esc(t("pianoOct"))}</button><span class="pn-oct"></span><button class="btn sm" data-oct="1">${esc(t("pianoOct"))} ▶</button>
      <button class="btn sm pn-sus">${esc(t("pianoSustain"))}</button></div>
      <div class="pn-keys"></div><p class="pn-hint">${esc(t("pianoHint"))}</p><p class="pn-hint">${esc(t("pianoBgm"))}</p></div>`;
    const keysEl = root.querySelector(".pn-keys");
    function build() {
      keysEl.innerHTML = "";
      const whites = [];
      for (let m = base; m <= base + SPAN - 1 + 0; m++) if (WHITE.includes(m % 12)) whites.push(m);
      const W = 100 / whites.length;
      whites.forEach((m, i) => {
        const k = document.createElement("div"); k.className = "pn-k w"; k.dataset.m = m; k.style.left = i * W + "%"; k.style.width = W + "%";
        const n = WHITE.indexOf(m % 12);
        k.innerHTML = `<span>${NAMES[lang][n]}${n === 0 ? `<small>${Math.floor(m / 12) - 1}</small>` : ""}</span>`;
        keysEl.appendChild(k);
        if ([0, 2, 5, 7, 9].includes(m % 12) && m + 1 <= base + SPAN - 1) {
          const b = document.createElement("div"); b.className = "pn-k b"; b.dataset.m = m + 1; b.style.left = (i + 1) * W - W * 0.3 + "%"; b.style.width = W * 0.6 + "%";
          keysEl.appendChild(b);
        }
      });
      root.querySelector(".pn-oct").textContent = `C${Math.floor(base / 12) - 1} ~ E${Math.floor((base + SPAN - 1) / 12) - 1}`;
    }
    build();
    const keyEl = (m) => keysEl.querySelector(`.pn-k[data-m="${m}"]`);
    function down(id, m) {
      if (voices.has(id)) up(id);
      const old = held.get(m); if (old) release(old, true);
      const v = strike(m); voices.set(id, { m, v }); held.set(m, v);
      const el = keyEl(m); if (el) el.classList.add("on");
      opts.onNote && opts.onNote(m);
    }
    function up(id) {
      const e = voices.get(id); if (!e) return; voices.delete(id);
      const stillDown = [...voices.values()].some((x) => x.m === e.m);
      if (!stillDown) { const el = keyEl(e.m); if (el) el.classList.remove("on"); }
      if (!sustain && !stillDown) { release(e.v); held.delete(e.m); }
    }
    // 터치/마우스: 여러 손가락 + 미끄러지기
    const midiAt = (x, y) => { const el = document.elementFromPoint(x, y); return el && el.closest && el.closest(".pn-k") && keysEl.contains(el) ? +el.closest(".pn-k").dataset.m : null; };
    keysEl.addEventListener("pointerdown", (e) => { e.preventDefault(); ctx(); const m = midiAt(e.clientX, e.clientY); if (m == null) return; try { keysEl.setPointerCapture(e.pointerId); } catch {} down("p" + e.pointerId, m); });
    keysEl.addEventListener("pointermove", (e) => { const cur = voices.get("p" + e.pointerId); if (!cur) return; const m = midiAt(e.clientX, e.clientY); if (m != null && m !== cur.m) down("p" + e.pointerId, m); });
    const pup = (e) => up("p" + e.pointerId);
    keysEl.addEventListener("pointerup", pup); keysEl.addEventListener("pointercancel", pup); keysEl.addEventListener("lostpointercapture", pup);
    keysEl.addEventListener("contextmenu", (e) => e.preventDefault());
    // 휴대폰: 손을 뗄 때 오디오 잠금 해제
    const unlock = () => ctx();
    root.addEventListener("touchend", unlock, { passive: true }); root.addEventListener("click", unlock);
    function setSustain(on) {
      sustain = on; root.querySelector(".pn-sus").classList.toggle("on", on);
      if (!on) for (const [m, v] of held) { if (![...voices.values()].some((x) => x.m === m)) { release(v); held.delete(m); } }
    }
    root.querySelector(".pn-sus").addEventListener("click", () => setSustain(!sustain));
    root.querySelectorAll("[data-oct]").forEach((b) => b.addEventListener("click", () => { base = Math.max(24, Math.min(72, base + 12 * +b.dataset.oct)); build(); }));
    // 키보드
    const kmap = (code) => { const wi = KEY_WHITE.indexOf(code); if (wi >= 0) { const oct = Math.floor(wi / 7); return base + 12 + oct * 12 + WHITE[wi % 7]; } if (code in KEY_BLACK) return base + 12 + KEY_BLACK[code]; return null; };
    const kd = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); e.stopPropagation(); if (!e.repeat) setSustain(true); return; }
      if (e.code === "KeyZ" || e.code === "KeyX") { e.stopPropagation(); if (!e.repeat) { base = Math.max(24, Math.min(72, base + (e.code === "KeyX" ? 12 : -12))); build(); } return; }
      const m = kmap(e.code); if (m == null) return;
      e.preventDefault(); e.stopPropagation(); if (e.repeat) return; ctx(); down("k" + e.code, m);
    };
    const ku = (e) => { if (e.code === "Space") { setSustain(false); return; } if (kmap(e.code) != null || voices.has("k" + e.code)) up("k" + e.code); };
    window.addEventListener("keydown", kd, true); window.addEventListener("keyup", ku, true);
    ctx();
    return {
      destroy() {
        window.removeEventListener("keydown", kd, true); window.removeEventListener("keyup", ku, true);
        for (const v of held.values()) release(v, true); held.clear(); voices.clear();
      },
    };
  }
  function esc(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  window.Piano = { mount, strike };
})();
