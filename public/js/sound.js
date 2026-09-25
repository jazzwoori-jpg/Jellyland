/* 🔊 효과음 + 게임별 배경음악 (Web Audio 로 직접 합성 — 파일 다운로드 없음)
   SFX: jump · jump2 · boing · superJump · crack · coin · smash · star · laugh(깔깔 + 메롱 놀리기)
   Chip: 게임별 오리지널 BGM — "jump"(점프점프 젤리월드) · "up"(올라올라) · "fortune"(오늘의 운세)
   배경음악 켜기/끄기(🔊)는 BGM 설정을 그대로 따름 */
(function () {
  let actx = null, master = null, musicBus = null;
  function ctx() {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { if ("audioSession" in navigator) navigator.audioSession.type = "playback"; } catch {}
      actx = new AC();
      master = actx.createGain(); master.gain.value = 0.8; master.connect(actx.destination);
      musicBus = actx.createGain(); musicBus.gain.value = 0.32; musicBus.connect(master);
    }
    if (actx.state !== "running") actx.resume().catch(() => {});
    return actx;
  }
  // 휴대폰: 터치(손 뗄 때)·클릭 순간에 오디오 잠금 해제
  ["touchend", "click", "keydown"].forEach((ev) => window.addEventListener(ev, () => { if (actx && actx.state !== "running") actx.resume().catch(() => {}); }, { capture: true, passive: true }));
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function tone(type, f0, f1, t, len, vol, dest) {
    const c = actx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + len);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g).connect(dest || master); o.start(t); o.stop(t + len + 0.02);
  }
  function noise(t, len, vol, freq, type, dest) {
    const c = actx, b = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * len)), c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = b; f.type = type || "bandpass"; f.frequency.value = freq; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    s.connect(f).connect(g).connect(dest || master); s.start(t);
  }

  // ---------------- 효과음 ----------------
  const SFX = {
    jump() { if (!ctx()) return; const t = actx.currentTime; tone("square", 330, 880, t, 0.14, 0.12); tone("sine", 660, 1320, t, 0.12, 0.06); },
    jump2() { if (!ctx()) return; const t = actx.currentTime; tone("square", 520, 1400, t, 0.16, 0.11); tone("triangle", 1040, 2100, t + 0.03, 0.12, 0.07); },
    boing() { if (!ctx()) return; const t = actx.currentTime; tone("sine", 240, 620, t, 0.16, 0.2); tone("triangle", 480, 900, t, 0.1, 0.06); },
    superJump() { if (!ctx()) return; const t = actx.currentTime; tone("square", 200, 1600, t, 0.45, 0.12); tone("sine", 400, 2400, t + 0.05, 0.4, 0.08); [0, 0.08, 0.16, 0.24].forEach((d, i) => tone("triangle", hz(84 + i * 4), 0, t + d, 0.12, 0.07)); },
    crack() { if (!ctx()) return; const t = actx.currentTime; noise(t, 0.18, 0.35, 900, "bandpass"); tone("square", 180, 60, t, 0.25, 0.1); },
    coin() { if (!ctx()) return; const t = actx.currentTime; tone("square", hz(88), 0, t, 0.08, 0.07); tone("square", hz(93), 0, t + 0.07, 0.22, 0.07); },
    smash() { if (!ctx()) return; const t = actx.currentTime; noise(t, 0.25, 0.4, 500, "lowpass"); tone("square", 300, 90, t, 0.2, 0.1); },
    star() { if (!ctx()) return; const t = actx.currentTime; [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => tone("triangle", hz(72 + s), 0, t + i * 0.05, 0.18, 0.08)); },
    // 🎰 럭키젤리
    slotStart() { if (!ctx()) return; const t = actx.currentTime; tone("square", 220, 660, t, 0.25, 0.08); noise(t, 0.3, 0.1, 2500, "bandpass"); },
    slotTick() { if (!ctx()) return; const t = actx.currentTime; tone("square", 1800, 1200, t, 0.025, 0.035); },
    slotStop() { if (!ctx()) return; const t = actx.currentTime; tone("square", 180, 90, t, 0.1, 0.12); noise(t, 0.06, 0.2, 600, "lowpass"); },
    win() { if (!ctx()) return; const t = actx.currentTime; [72, 76, 79, 84, 79, 84].forEach((m, i) => tone("square", hz(m), 0, t + i * 0.09, 0.14, 0.08)); for (let i = 0; i < 8; i++) tone("triangle", hz(96 + (i % 3) * 4), 0, t + 0.5 + i * 0.06, 0.08, 0.05); },
    jackpot() { if (!ctx()) return; const t = actx.currentTime; [60, 64, 67, 72, 76, 79, 84, 88, 91, 96].forEach((m, i) => tone("square", hz(m), 0, t + i * 0.06, 0.2, 0.08)); [72, 76, 79, 84].forEach((m) => tone("sawtooth", hz(m), 0, t + 0.7, 1.2, 0.05)); for (let i = 0; i < 24; i++) tone("triangle", hz(100 + (i % 5) * 2), 0, t + 0.7 + i * 0.05, 0.06, 0.04); noise(t + 0.7, 1.2, 0.15, 7000, "highpass"); },
    aww() { if (!ctx()) return; const t = actx.currentTime; tone("triangle", hz(67), hz(60), t, 0.35, 0.1); tone("triangle", hz(60), hz(55), t + 0.35, 0.5, 0.1); },
    // 😝 탈락: "깔깔깔깔~" 웃음 + "메롱~" 놀리는 멜로디 (나나나나나~)
    laugh() {
      if (!ctx()) return;
      const t0 = actx.currentTime + 0.05;
      // 웃음: 목소리처럼 들리게 톱니파 + 모음(아) 포먼트 필터, 음높이가 점점 내려가는 "하하하하"
      const voice = actx.createGain(); voice.gain.value = 1;
      const f1 = actx.createBiquadFilter(); f1.type = "bandpass"; f1.frequency.value = 850; f1.Q.value = 5;
      const f2 = actx.createBiquadFilter(); f2.type = "bandpass"; f2.frequency.value = 1350; f2.Q.value = 6;
      const mix = actx.createGain(); mix.gain.value = 2.2;
      voice.connect(f1).connect(mix); voice.connect(f2).connect(mix); mix.connect(master);
      const n = 7;
      for (let i = 0; i < n; i++) {
        const t = t0 + i * 0.13, p = 620 - i * 28 + (i % 2 ? 40 : 0);
        const o = actx.createOscillator(), g = actx.createGain(), vib = actx.createOscillator(), vg = actx.createGain();
        o.type = "sawtooth"; o.frequency.setValueAtTime(p, t); o.frequency.linearRampToValueAtTime(p * 0.82, t + 0.1);
        vib.frequency.value = 28; vg.gain.value = 18; vib.connect(vg).connect(o.frequency);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.28, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
        o.connect(g).connect(voice); o.start(t); o.stop(t + 0.13); vib.start(t); vib.stop(t + 0.13);
        noise(t, 0.04, 0.05, 3000, "highpass"); // 숨소리 "ㅎ"
      }
      // 메롱~ 놀리는 멜로디: 솔 미 라 솔 미
      const t1 = t0 + n * 0.13 + 0.12;
      [[67, 0, 0.18], [64, 0.2, 0.18], [69, 0.4, 0.18], [67, 0.6, 0.18], [64, 0.8, 0.34]].forEach(([m, d, len]) => { tone("square", hz(m + 12), 0, t1 + d, len, 0.07); tone("triangle", hz(m), 0, t1 + d, len, 0.08); });
      tone("sine", 900, 300, t1 + 1.18, 0.35, 0.07); // 뿌우~
    },
  };

  // ---------------- 게임별 BGM (칩튠 시퀀서) ----------------
  // 곡 = { bpm, spb(한 마디 칸 수), bars, parts:[{wave, vol, notes:[[마디, 칸, 음, 길이]]}], drums:[[마디, 칸, "k"|"s"|"h"]] }
  function chordNotes(root, minor) { return [root, root + (minor ? 3 : 4), root + 7]; }
  const SONGS = {
    // 🏃 점프점프 젤리월드: 신나게 달리는 C장조 (160bpm)
    jump: (() => {
      const prog = [[48, 0], [45, 1], [41, 0], [43, 0], [48, 0], [45, 1], [41, 0], [43, 0]];
      const bass = [], arp = [], mel = [], drums = [];
      const line = [[0, 76, 2], [2, 79, 2], [4, 84, 3], [8, 83, 2], [10, 79, 2], [12, 76, 4],
        [0, 72, 2], [2, 76, 2], [4, 81, 3], [8, 79, 2], [10, 76, 2], [12, 72, 4],
        [0, 77, 2], [2, 81, 2], [4, 84, 2], [6, 86, 2], [8, 84, 2], [10, 81, 2], [12, 77, 4],
        [0, 79, 3], [4, 83, 3], [8, 86, 2], [10, 83, 2], [12, 79, 2], [14, 74, 2]];
      const bars = [[0, 6], [6, 12], [12, 19], [19, 25]];
      prog.forEach(([r, mi], b) => {
        for (let s = 0; s < 16; s += 2) bass.push([b, s, r - 12 + (s % 4 ? 12 : 0), 1.6]);
        const ch = chordNotes(r + 12, mi); for (let s = 0; s < 16; s++) if (s % 2) arp.push([b, s, ch[(s >> 1) % 3] + 12, 0.8]);
        const [a, z] = bars[b % 4]; for (let i = a; i < z; i++) mel.push([b, line[i][0], line[i][1] + (b >= 4 && i % 3 === 0 ? 0 : 0), line[i][2]]);
        for (let s = 0; s < 16; s++) { if (s % 8 === 0) drums.push([b, s, "k"]); if (s % 8 === 4) drums.push([b, s, "s"]); if (s % 2 === 0) drums.push([b, s, "h"]); }
        if (b % 4 === 3) drums.push([b, 14, "s"], [b, 15, "s"]);
      });
      return { bpm: 160, spb: 16, bars: 8, parts: [{ wave: "triangle", vol: 0.5, notes: bass }, { wave: "square", vol: 0.1, notes: arp }, { wave: "square", vol: 0.16, notes: mel }], drums };
    })(),
    // ⬆️ 올라올라: 통통 튀는 F장조 (138bpm) — 위로 올라가는 아르페지오
    up: (() => {
      const prog = [[53, 0], [50, 1], [46, 0], [48, 0], [53, 0], [50, 1], [46, 0], [48, 0]];
      const bass = [], arp = [], mel = [], drums = [];
      const hook = [[0, 77, 1], [2, 81, 1], [4, 84, 2], [7, 81, 1], [8, 86, 2], [11, 84, 1], [12, 81, 3]];
      const hook2 = [[0, 74, 1], [2, 77, 1], [4, 81, 2], [7, 77, 1], [8, 79, 2], [11, 77, 1], [12, 72, 3]];
      prog.forEach(([r, mi], b) => {
        [0, 3, 6, 8, 11, 14].forEach((s) => bass.push([b, s, r - 12 + (s === 8 ? 7 : 0), 1.2]));
        const ch = chordNotes(r + 12, mi); for (let s = 0; s < 16; s++) arp.push([b, s, ch[s % 3] + 12 * (1 + ((s >> 2) % 2)), 0.6]);
        (b % 2 ? hook2 : hook).forEach(([s, m, l]) => mel.push([b, s, m + (b >= 4 ? 12 : 0) - (b >= 4 ? 12 : 0), l]));
        for (let s = 0; s < 16; s++) { if (s === 0 || s === 6 || s === 10) drums.push([b, s, "k"]); if (s === 4 || s === 12) drums.push([b, s, "s"]); if (s % 2 === 1) drums.push([b, s, "h"]); }
      });
      return { bpm: 138, spb: 16, bars: 8, parts: [{ wave: "triangle", vol: 0.5, notes: bass }, { wave: "square", vol: 0.06, notes: arp }, { wave: "square", vol: 0.15, notes: mel }], drums };
    })(),
    // 🎰 럭키젤리!: 반짝이는 카지노 스윙 (워킹 베이스 + 셔플 리듬, 126bpm)
    slot: (() => {
      const prog = [[48, 0], [45, 1], [50, 1], [43, 0], [48, 0], [45, 1], [50, 1], [43, 0]];
      const bass = [], comp = [], mel = [], drums = [];
      const lick = [[[0, 79, 2], [3, 76, 1], [4, 79, 2], [7, 81, 1], [8, 79, 4], [12, 76, 2], [14, 74, 2]], [[0, 72, 2], [3, 76, 1], [4, 79, 3], [8, 84, 2], [11, 83, 1], [12, 81, 4]],
        [[0, 77, 2], [3, 81, 1], [4, 84, 2], [7, 81, 1], [8, 77, 2], [10, 74, 2], [12, 77, 4]], [[0, 79, 3], [4, 74, 2], [6, 77, 2], [8, 79, 2], [10, 83, 2], [12, 86, 4]]];
      prog.forEach(([r, mi], b) => {
        const ch = chordNotes(r, mi), walk = [r - 12, ch[1] - 12, ch[2] - 12, r - 12 + (b % 2 ? 10 : 9)];
        walk.forEach((m, i) => bass.push([b, i * 4, m, 3.2]));
        [4, 12].forEach((st) => ch.forEach((m) => comp.push([b, st, m + 12, 1.5])));
        lick[b % 4].forEach(([st, m, l]) => mel.push([b, st, m, l]));
        for (let st = 0; st < 16; st++) { if (st === 0 || st === 8) drums.push([b, st, "k"]); if (st === 4 || st === 12) drums.push([b, st, "s"]); if (st % 4 === 0 || st % 4 === 3) drums.push([b, st, "h"]); }
      });
      return { bpm: 126, spb: 16, bars: 8, parts: [{ wave: "triangle", vol: 0.5, notes: bass }, { wave: "square", vol: 0.05, notes: comp }, { wave: "square", vol: 0.14, notes: mel }], drums };
    })(),
    // 🔮 오늘의 운세: 신비로운 오르골 (3/4박, 80bpm)
    fortune: (() => {
      const prog = [[57, 1], [53, 0], [48, 0], [52, 0], [57, 1], [50, 1], [52, 0], [57, 1]];
      const bell = [], pad = [];
      const tune = [[76, 72, 69], [77, 72, 69], [79, 76, 72], [80, 76, 71], [76, 81, 84], [77, 74, 69], [76, 71, 68], [81, 76, 69]];
      prog.forEach(([r, mi], b) => {
        const ch = chordNotes(r, mi);
        for (let s = 0; s < 12; s += 2) bell.push([b, s, ch[(s / 2) % 3] + 24, 1.8]);
        tune[b].forEach((m, i) => bell.push([b, i * 4, m + 12, 3.5]));
        pad.push([b, 0, r - 12, 11.5]); pad.push([b, 0, ch[1] - 12, 11.5]);
      });
      return { bpm: 80, spb: 12, bars: 8, parts: [{ wave: "bell", vol: 0.12, notes: bell }, { wave: "sine", vol: 0.12, notes: pad }], drums: [] };
    })(),
  };
  function playNote(part, m, t, len) {
    const c = actx, f = hz(m);
    if (part.wave === "bell") { // 오르골: 사인파 + 높은 배음, 빠르게 사라짐
      tone("sine", f, 0, t, Math.min(2.2, len + 1), part.vol, musicBus); tone("sine", f * 4.01, 0, t, 0.4, part.vol * 0.25, musicBus); return;
    }
    const o = c.createOscillator(), g = c.createGain();
    o.type = part.wave; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(part.vol, t + 0.01);
    g.gain.setValueAtTime(part.vol * 0.8, t + Math.max(0.02, len - 0.04)); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.05);
    o.connect(g).connect(musicBus); o.start(t); o.stop(t + len + 0.08);
  }
  function drum(type, t) {
    if (type === "k") { tone("sine", 150, 45, t, 0.16, 0.5, musicBus); }
    else if (type === "s") noise(t, 0.12, 0.22, 1800, "bandpass", musicBus);
    else noise(t, 0.03, 0.08, 8000, "highpass", musicBus);
  }
  let song = null, timer = null, stepIdx = 0, nextT = 0, songName = null;
  const musicOn = () => !window.BGM || window.BGM.on;
  function schedule() {
    if (!song || !actx) return;
    const stepLen = 60 / song.bpm / 4 * (song.spb === 12 ? 1 : 1), total = song.spb * song.bars;
    while (nextT < actx.currentTime + 0.15) {
      const bar = Math.floor(stepIdx / song.spb), st = stepIdx % song.spb;
      if (musicOn() && !document.hidden) {
        for (const part of song.parts) for (const [b, s, m, l] of part.notes) if (b === bar && s === st) playNote(part, m, nextT, l * stepLen);
        for (const [b, s, ty] of song.drums) if (b === bar && s === st) drum(ty, nextT);
      }
      stepIdx = (stepIdx + 1) % total; nextT += stepLen;
    }
  }
  const Chip = {
    play(name) {
      if (songName === name && timer) return;
      Chip.stop();
      if (!SONGS[name] || !ctx()) return;
      song = SONGS[name]; songName = name; stepIdx = 0; nextT = actx.currentTime + 0.1;
      musicBus.gain.cancelScheduledValues(actx.currentTime); musicBus.gain.setValueAtTime(0.32, actx.currentTime);
      timer = setInterval(schedule, 40); schedule();
    },
    stop() {
      if (timer) clearInterval(timer); timer = null; song = null; songName = null;
      if (actx && musicBus) { const t = actx.currentTime; musicBus.gain.cancelScheduledValues(t); musicBus.gain.setValueAtTime(musicBus.gain.value, t); musicBus.gain.linearRampToValueAtTime(0.0001, t + 0.15); setTimeout(() => { if (!timer && musicBus) musicBus.gain.value = 0.32; }, 300); }
    },
    get playing() { return songName; },
  };
  window.SFX = SFX; window.Chip = Chip;
})();
