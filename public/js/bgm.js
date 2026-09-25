/* 배경음악 — 로그인 화면 / 광장 / 팬 라운지 / 미니게임
   휴대폰 브라우저(사파리·크롬)는 "진짜 터치(손을 뗀 순간)·클릭" 안에서만 소리 재생을 허락해요.
   - 터치/클릭이 있을 때마다, 아직 재생이 안 됐으면 그 순간 바로 재생을 시도 (성공할 때까지)
   - 한 번 재생에 성공한 뒤에는 곡을 바꿔도 계속 재생됨
   - 아이폰: 무음(진동) 모드에서도 들리도록 일반 오디오로 재생 (iOS 17+ 는 음량 조절용 Web Audio + 재생 모드 설정)
   - 곡별로 듣던 위치를 기억해서 다시 돌아오면 이어서 재생 */
(function () {
  const SRC = { title: "audio/title.mp3", plaza: "audio/plaza.mp3", lounge: "audio/lounge.mp3", minigame: "audio/minigame.mp3" };
  const VOL = 0.35, FADE = 0.45;
  const IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  let on = true;
  try { on = localStorage.getItem("jl_bgm") !== "0"; } catch {}
  let want = null, cur = null, unlocked = false, busy = false, gen = 0;
  let el = null, actx = null, gain = null;
  const pos = {};

  function setup() {
    if (el) return;
    el = new Audio(); el.loop = true; el.preload = "auto";
    el.setAttribute("playsinline", ""); el.setAttribute("webkit-playsinline", "");
    // 아이폰은 Web Audio 가 무음 스위치에 막히므로, 재생 모드를 지정할 수 있는 iOS 17+ 에서만 사용
    const canSession = "audioSession" in navigator;
    if (IOS && canSession) { try { navigator.audioSession.type = "playback"; } catch {} }
    if (IOS && canSession) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        actx = new AC(); const src = actx.createMediaElementSource(el); gain = actx.createGain(); gain.gain.value = 0; src.connect(gain).connect(actx.destination);
      } catch { actx = null; gain = null; }
    }
    if (!gain) el.volume = 0;
  }
  function vol(v, dur) {
    if (!el) return;
    if (gain) { const t = actx.currentTime; gain.gain.cancelScheduledValues(t); gain.gain.setValueAtTime(gain.gain.value, t); gain.gain.linearRampToValueAtTime(v, t + dur); return; }
    const from = el.volume, t0 = performance.now(), my = ++gen;
    const step = () => { if (my !== gen) return; const k = Math.min(1, (performance.now() - t0) / (dur * 1000)); try { el.volume = from + (v - from) * k; } catch {} if (k < 1) setTimeout(step, 30); };
    step();
  }
  const wait = (s) => new Promise((r) => setTimeout(r, s * 1000));
  const target = () => (on && !document.hidden ? want : null);
  function load(name) {
    el.src = SRC[name]; cur = name;
    const p = pos[name] || 0;
    if (p) el.addEventListener("loadedmetadata", () => { try { el.currentTime = p; } catch {} }, { once: true });
  }

  // 터치·클릭 순간에 바로 재생 (휴대폰 정책 통과용 — await 없이 동기 호출)
  function kick() {
    const tg = target();
    if (actx && actx.state !== "running") actx.resume().catch(() => {});
    if (!tg) return;
    setup();
    if (unlocked && (busy || !el.paused)) return; // 이미 재생 중 (곡 전환은 apply 가 담당)
    if (cur !== tg) { if (cur) pos[cur] = el.currentTime; load(tg); }
    const p = el.play();
    if (p && p.then) p.then(() => { unlocked = true; vol(VOL, FADE * 1.6); if (target() !== cur) apply(); }).catch(() => {});
  }
  // 곡 바꾸기 (재생이 한 번 허락된 뒤)
  async function apply() {
    if (!unlocked || busy) return;
    busy = true;
    const tg = target();
    try {
      if (cur && cur !== tg && !el.paused) { vol(0, FADE); await wait(FADE); pos[cur] = el.currentTime; el.pause(); }
      if (!tg) { if (!el.paused) el.pause(); }
      else {
        if (cur !== tg) load(tg);
        if (actx && actx.state !== "running") actx.resume().catch(() => {});
        if (el.paused) { try { await el.play(); vol(VOL, FADE * 1.6); } catch { unlocked = false; } } // 막히면 다음 터치 때 다시 시도
      }
    } finally { busy = false; }
    if (target() !== tg) apply(); // 전환 중에 또 바뀐 경우
  }
  ["touchend", "click", "keydown", "pointerup", "mousedown"].forEach((ev) =>
    window.addEventListener(ev, (e) => { if (ev === "keydown" && (e.repeat || e.key === "Escape")) return; kick(); }, { capture: true, passive: true }));
  document.addEventListener("visibilitychange", () => {
    if (!el) return;
    if (document.hidden) { if (!el.paused) { pos[cur] = el.currentTime; el.pause(); } }
    else apply();
  });
  window.addEventListener("pagehide", () => { if (el && !el.paused) el.pause(); });

  window.BGM = {
    play(name) { want = SRC[name] ? name : null; apply(); },
    stop() { want = null; apply(); },
    get on() { return on; },
    get playing() { return !!(el && !el.paused); },
    toggle() { on = !on; try { localStorage.setItem("jl_bgm", on ? "1" : "0"); } catch {} if (on) kick(); else apply(); return on; },
  };
})();
