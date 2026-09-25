/* 배경음악 — 광장 / 팬 라운지 / 미니게임
   - 브라우저 정책상 첫 터치(클릭) 뒤부터 재생
   - 하나의 오디오를 쓰고, 곡이 바뀔 때 부드럽게 줄였다 키움 (아이폰도 음량 조절되도록 Web Audio 사용)
   - 곡별로 듣던 위치를 기억해서 다시 돌아오면 이어서 재생 */
(function () {
  const SRC = { title: "audio/title.mp3", plaza: "audio/plaza.mp3", lounge: "audio/lounge.mp3", minigame: "audio/minigame.mp3" };
  const VOL = 0.35, FADE = 0.45;
  let on = true;
  try { on = localStorage.getItem("jl_bgm") !== "0"; } catch {}
  let want = null, cur = null, unlocked = false, busy = false;
  let el = null, actx = null, gain = null;
  const pos = {};

  function setup() {
    el = new Audio(); el.loop = true; el.preload = "auto";
    el.setAttribute("playsinline", "");
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) { actx = new AC(); const src = actx.createMediaElementSource(el); gain = actx.createGain(); gain.gain.value = 0; src.connect(gain).connect(actx.destination); }
    } catch { actx = null; gain = null; }
    if (!gain) el.volume = 0;
  }
  function vol(v, dur) {
    if (gain) { const t = actx.currentTime; gain.gain.cancelScheduledValues(t); gain.gain.setValueAtTime(gain.gain.value, t); gain.gain.linearRampToValueAtTime(v, t + dur); }
    else { const from = el.volume, t0 = performance.now(); const step = () => { const k = Math.min(1, (performance.now() - t0) / (dur * 1000)); el.volume = from + (v - from) * k; if (k < 1) requestAnimationFrame(step); }; step(); }
  }
  const wait = (s) => new Promise((r) => setTimeout(r, s * 1000));
  async function apply() {
    if (!unlocked || busy) return;
    busy = true;
    const target = on && !document.hidden ? want : null;
    try {
      if (cur && cur !== target) { vol(0, FADE); await wait(FADE); pos[cur] = el.currentTime; el.pause(); cur = null; }
      if (target && cur !== target) {
        el.src = SRC[target]; cur = target;
        const p = pos[target] || 0;
        if (p) { try { el.currentTime = p; } catch {} el.addEventListener("loadedmetadata", () => { try { el.currentTime = p; } catch {} }, { once: true }); }
        if (actx && actx.state === "suspended") actx.resume().catch(() => {});
        try { await el.play(); } catch { cur = null; }
        if (cur) vol(VOL, FADE * 1.6);
      } else if (target && cur === target && el.paused) {
        if (actx && actx.state === "suspended") actx.resume().catch(() => {});
        try { await el.play(); vol(VOL, FADE); } catch {}
      }
    } finally { busy = false; }
    const target2 = on && !document.hidden ? want : null;
    if (target2 !== target) apply(); // 전환 중에 또 바뀐 경우
  }
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    setup();
    // 첫 터치 안에서 바로 재생해야 아이폰에서도 소리가 남
    if (actx) actx.resume().catch(() => {});
    const target = on && !document.hidden ? want : null;
    if (target) { el.src = SRC[target]; cur = target; el.play().then(() => vol(VOL, FADE * 1.6)).catch(() => { cur = null; }); }
  }
  ["pointerdown", "keydown", "touchend"].forEach((ev) => window.addEventListener(ev, () => { if (want) unlock(); else if (actx && actx.state === "suspended") actx.resume().catch(() => {}); }, { capture: true, passive: true }));
  document.addEventListener("visibilitychange", () => { if (unlocked) apply(); });

  window.BGM = {
    play(name) { want = SRC[name] ? name : null; apply(); },
    stop() { want = null; apply(); },
    get on() { return on; },
    toggle() { on = !on; try { localStorage.setItem("jl_bgm", on ? "1" : "0"); } catch {} if (on) unlock(); apply(); return on; },
  };
})();
