/* 🎣 젤리 해변 낚시 — 물고기 목록 · 물고기 그림 · 낚시 미니게임(원형 버튼 + 바늘)
   - 물고기 순서·가격은 netlify/functions/api.mjs 의 FISH 와 같아야 해요 (어떤 물고기가 걸릴지는 서버가 정함)
   - 미니게임: 입질이 오면 버튼이 빨개지고 바늘이 돌아요. 바늘이 노란 칸에 왔을 때 누르면 Great!
     물고기마다 필요한 Great 수 · 바늘 속도 · 칸 넓이 · 실수 허용이 달라요 (큰 물고기일수록 어려움) */
(function () {
  const OUT = "#3a2530";
  const SPECIES = [
    { id: "goldfish", price: 30, stars: 1, name: { ko: "빨간입술 금붕어", en: "Red-Lipped Goldfish", ja: "赤いくちびる金魚" }, desc: { ko: "입술이 너무 빨개서 립스틱을 바른 것 같아요.", en: "Its lips are so red it looks like it's wearing lipstick.", ja: "くちびるが真っ赤で、口紅を塗ってるみたい。" } },
    { id: "minnow", price: 40, stars: 1, name: { ko: "졸린눈 송사리", en: "Sleepy-Eyed Minnow", ja: "ねむり目メダカ" }, desc: { ko: "하루 종일 졸려요. 낚여도 졸려요.", en: "Sleepy all day. Still sleepy after being caught.", ja: "一日中ねむたい。釣られてもねむたい。" } },
    { id: "puffer", price: 60, stars: 1, name: { ko: "뿡뿡 복어", en: "Toot-Toot Pufferfish", ja: "ぷっぷフグ" }, desc: { ko: "놀라면 뿡! 하고 부풀어요.", en: "Puffs up with a 'toot!' when surprised.", ja: "びっくりすると「ぷっ！」とふくらむ。" } },
    { id: "mackerel", price: 80, stars: 2, name: { ko: "재즈 고등어", en: "Jazzy Mackerel", ja: "ジャズサバ" }, desc: { ko: "꼬리로 재즈 리듬을 쳐요. 스윙~", en: "Taps jazz rhythms with its tail. Swing~", ja: "しっぽでジャズのリズムを刻む。スウィング〜" } },
    { id: "flounder", price: 110, stars: 2, name: { ko: "납작납작 가자미", en: "Pancake Flounder", ja: "ぺたんこカレイ" }, desc: { ko: "팬케이크만큼 납작해요. 눈은 한쪽에 모여 있어요.", en: "Flat as a pancake, with both eyes on one side.", ja: "パンケーキみたいにぺたんこ。目は片側に集合。" } },
    { id: "halibut", price: 150, stars: 2, name: { ko: "콧수염 광어", en: "Mustache Halibut", ja: "おひげヒラメ" }, desc: { ko: "멋진 콧수염이 자랑이에요.", en: "Very proud of its fancy mustache.", ja: "立派なおひげが自慢。" } },
    { id: "cutlass", price: 220, stars: 3, name: { ko: "반짝이 은갈치", en: "Glitter Cutlassfish", ja: "キラキラ太刀魚" }, desc: { ko: "헤엄칠 때마다 반짝이 가루가 떨어져요.", en: "Sheds glitter every time it swims.", ja: "泳ぐたびにキラキラの粉がこぼれる。" } },
    { id: "tuna", price: 320, stars: 3, name: { ko: "왕눈이 참치", en: "Googly-Eyed Tuna", ja: "でめきんマグロ" }, desc: { ko: "눈이 너무 커서 다 보고 있어요.", en: "Its eyes are so big it sees everything.", ja: "目が大きすぎて、なんでも見ている。" } },
    { id: "grouper", price: 500, stars: 3, name: { ko: "황금 다금바리", en: "Golden Grouper", ja: "黄金クエ" }, desc: { ko: "바다의 보물. 비늘이 금빛으로 빛나요.", en: "A treasure of the sea with shining golden scales.", ja: "海の宝物。うろこが金色に光る。" } },
    { id: "shark", price: 900, stars: 4, name: { ko: "선글라스 상어", en: "Sunglasses Shark", ja: "サングラスザメ" }, desc: { ko: "선글라스를 벗은 모습을 본 사람이 없어요.", en: "No one has ever seen it without sunglasses.", ja: "サングラスを外した姿は誰も見たことがない。" } },
    { id: "orca", price: 1600, stars: 4, name: { ko: "노래하는 범고래", en: "Singing Orca", ja: "うたうシャチ" }, desc: { ko: "바닷속 최고의 가수. 고음이 끝내줘요.", en: "The best singer in the sea. Amazing high notes.", ja: "海でいちばんの歌い手。高音がすごい。" } },
    { id: "cloudwhale", price: 4000, stars: 5, name: { ko: "구름 고래", en: "Cloud Whale", ja: "くもクジラ" }, desc: { ko: "구름처럼 폭신해요. 가끔 하늘로 둥실 떠올라요.", en: "Fluffy like a cloud. Sometimes floats up into the sky.", ja: "雲みたいにふわふわ。ときどき空へふわり。" } },
    { id: "furwhale", price: 20000, stars: 6, boss: true, name: { ko: "털보고래", en: "Fluffy Whale", ja: "もふもふクジラ" }, desc: { ko: "전설의 털보고래. 털이 복슬복슬, 수염이 덥수룩! 거의 만날 수 없어요.", en: "The legendary Fluffy Whale. Shaggy fur and a bushy beard! Almost never seen.", ja: "伝説のもふもふクジラ。毛がもこもこ、ひげがふさふさ！めったに会えない。" } },
  ];
  const BY = Object.fromEntries(SPECIES.map((s) => [s.id, s]));

  // ---------------- 물고기 그림 (작은 픽셀 그림을 만들어 두고 크게 그림) ----------------
  const cache = {};
  function mk(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d"); x.imageSmoothingEnabled = false; return [c, x]; }
  const ell = (x, cx, cy, rx, ry, col) => { x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, 7); x.fill(); };
  const tri = (x, pts, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) x.lineTo(p[0], p[1]); x.closePath(); x.fill(); };
  // 기본 물고기 몸 (머리는 왼쪽): 꼬리 → 몸 → 배 → 지느러미
  function body(x, o, f) {
    const { cx, cy, rx, ry } = o, wag = f ? 1 : -1;
    const tx = cx + rx - 2, tw = o.tailW || ry * 1.1, th = o.tailH || ry * 1.1;
    if (o.tail === "fork") { tri(x, [[tx, cy], [tx + tw + 1, cy - th - 1 + wag], [tx + tw * 0.55, cy], [tx + tw + 1, cy + th + 1 + wag]], OUT); tri(x, [[tx + 1, cy], [tx + tw, cy - th + wag], [tx + tw * 0.55, cy], [tx + tw, cy + th + wag]], o.tailCol || o.col); }
    else if (o.tail === "fan") { ell(x, tx + tw * 0.6, cy + wag, tw * 0.75 + 1, th + 1, OUT); ell(x, tx + tw * 0.6, cy + wag, tw * 0.75, th, o.tailCol || o.col); x.fillStyle = "rgba(255,255,255,.35)"; x.fillRect(tx + 2, cy - 1 + wag, tw, 1); }
    else if (o.tail !== "none") { tri(x, [[tx - 1, cy], [tx + tw + 1, cy - th - 1 + wag], [tx + tw + 1, cy + th + 1 + wag]], OUT); tri(x, [[tx, cy], [tx + tw, cy - th + wag], [tx + tw, cy + th + wag]], o.tailCol || o.col); }
    if (o.dorsal) { tri(x, [[cx - rx * 0.3, cy - ry + 1], [cx + rx * 0.05, cy - ry - o.dorsal - 1], [cx + rx * 0.4, cy - ry + 1]], OUT); tri(x, [[cx - rx * 0.25, cy - ry + 1], [cx + rx * 0.05, cy - ry - o.dorsal], [cx + rx * 0.35, cy - ry + 1]], o.finCol || o.col); }
    ell(x, cx, cy, rx + 1, ry + 1, OUT); ell(x, cx, cy, rx, ry, o.col);
    if (o.belly) { x.save(); x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.clip(); ell(x, cx, cy + ry * 0.75, rx * 0.95, ry * 0.6, o.belly); x.restore(); }
    if (o.shine !== false) { x.fillStyle = "rgba(255,255,255,.45)"; x.fillRect(cx - rx * 0.45, cy - ry * 0.6, rx * 0.5, 1); }
    if (o.pec) { ell(x, cx - rx * 0.15, cy + ry * 0.25, ry * 0.42 + 0.6, ry * 0.25 + 0.6, OUT); ell(x, cx - rx * 0.15, cy + ry * 0.25, ry * 0.42, ry * 0.25, o.finCol || o.col); }
  }
  const eye = (x, ex, ey, r, sleepy) => { if (sleepy) { x.fillStyle = OUT; x.fillRect(ex - r, ey, r * 2 + 1, 1); return; } ell(x, ex, ey, r + 0.8, r + 0.8, OUT); ell(x, ex, ey, r, r, "#ffffff"); ell(x, ex - r * 0.25, ey + r * 0.1, r * 0.55, r * 0.55, OUT); x.fillStyle = "#ffffff"; x.fillRect(ex - r * 0.5, ey - r * 0.4, 1, 1); };
  const DRAW = {
    goldfish(x, f) { const o = { cx: 15, cy: 12, rx: 10, ry: 7, col: "#ff8a2a", belly: "#ffc06a", tail: "fan", tailCol: "#ff6a3a", tailW: 9, tailH: 7, dorsal: 3, finCol: "#ff6a3a" }; body(x, o, f); eye(x, 9, 10, 2); ell(x, 5, 13, 2.6, 2.2, OUT); ell(x, 5, 13, 2, 1.6, "#ff1f4a"); x.fillStyle = "#ff9fb6"; x.fillRect(4, 12, 1, 1); },
    minnow(x, f) { const o = { cx: 13, cy: 8, rx: 10, ry: 4, col: "#8fb8d8", belly: "#e8f4ff", tail: "fork", tailCol: "#7aa6c8", tailW: 6, tailH: 4 }; body(x, o, f); eye(x, 6, 7, 1.4, true); x.fillStyle = OUT; x.fillRect(5, 5, 3, 1); x.font = "5px sans-serif"; x.fillStyle = "#5a6a9a"; x.fillRect(1, 1, 2, 1); x.fillRect(2, 2, 1, 1); x.fillRect(1, 3, 2, 1); },
    puffer(x, f) { const o = { cx: 14, cy: 13, rx: 10, ry: 9, col: "#ffd34d", belly: "#fff3c4", tail: "tri", tailCol: "#f2b23a", tailW: 5, tailH: 4, pec: true, finCol: "#f2b23a" }; body(x, o, f); x.fillStyle = OUT; for (let k = 0; k < 12; k++) { const a = (k / 12) * 6.28, px = 14 + Math.cos(a) * 11, py = 13 + Math.sin(a) * 10; x.fillRect(Math.round(px), Math.round(py), 1, 1); } x.fillStyle = "#e8a92a"; [[11, 9], [17, 8], [15, 12], [19, 13]].forEach(([a, b]) => x.fillRect(a, b, 2, 2)); eye(x, 8, 10, 2.2); ell(x, 4, 14, 1.6, 1.4, "#ff8fb0"); x.fillStyle = OUT; x.fillRect(4, 14, 2, 1); },
    mackerel(x, f) { const o = { cx: 16, cy: 9, rx: 13, ry: 5, col: "#2f8fa8", belly: "#dfeef2", tail: "fork", tailCol: "#2a7a92", tailW: 7, tailH: 5, dorsal: 2, finCol: "#2a7a92" }; body(x, o, f); x.fillStyle = "#16506a"; for (let k = 0; k < 6; k++) { x.fillRect(9 + k * 3, 5 + (k % 2), 2, 1); x.fillRect(10 + k * 3, 6 - (k % 2), 1, 1); } eye(x, 7, 8, 1.6); x.fillStyle = OUT; x.fillRect(3, 10, 2, 1); x.fillStyle = "#3a2530"; x.fillRect(30, 0, 1, 4); x.fillRect(28, 3, 3, 2); x.fillRect(31, 0, 2, 1); },
    flounder(x, f) { const o = { cx: 15, cy: 9, rx: 12, ry: 7, col: "#b8946a", belly: null, tail: "fan", tailCol: "#a6845a", tailW: 5, tailH: 5, shine: false }; body(x, o, f); x.fillStyle = "#8f7048"; [[9, 6], [14, 9], [19, 6], [12, 12], [18, 11], [22, 9]].forEach(([a, b]) => x.fillRect(a, b, 2, 2)); x.fillStyle = OUT; for (let k = 3; k < 27; k += 2) { x.fillRect(k, 2 + Math.round(Math.abs(k - 15) / 5), 1, 1); x.fillRect(k, 16 - Math.round(Math.abs(k - 15) / 5), 1, 1); } eye(x, 7, 6, 1.5); eye(x, 10, 5, 1.5); },
    halibut(x, f) { const o = { cx: 17, cy: 10, rx: 14, ry: 7, col: "#9a8a6a", belly: null, tail: "fan", tailCol: "#8a7a5a", tailW: 6, tailH: 6, shine: false }; body(x, o, f); x.fillStyle = "#7a6a4a"; [[10, 7], [16, 10], [22, 7], [14, 13], [21, 12], [26, 10]].forEach(([a, b]) => x.fillRect(a, b, 2, 2)); eye(x, 7, 7, 1.7); eye(x, 11, 6, 1.7); x.fillStyle = "#2a1a14"; x.fillRect(3, 10, 4, 2); x.fillRect(7, 10, 4, 2); x.fillRect(2, 11, 2, 2); x.fillRect(10, 11, 2, 2); },
    cutlass(x, f) { const o = { cx: 22, cy: 6, rx: 20, ry: 3, col: "#d8e4f0", belly: "#ffffff", tail: "tri", tailCol: "#b8c8d8", tailW: 6, tailH: 2, dorsal: 1, finCol: "#9fb4c8" }; body(x, o, f); eye(x, 5, 5, 1.4); for (let k = 0; k < 7; k++) { x.fillStyle = k % 2 ? "#fff3a8" : "#9fe8ff"; x.fillRect(8 + k * 5, 3 + (k % 3), 1, 1); } x.fillStyle = OUT; x.fillRect(1, 6, 3, 1); },
    tuna(x, f) { const o = { cx: 19, cy: 12, rx: 15, ry: 8, col: "#2a4a8a", belly: "#cfd8e8", tail: "fork", tailCol: "#24407a", tailW: 8, tailH: 8, dorsal: 3, finCol: "#f2c14e", pec: true }; body(x, o, f); x.fillStyle = "#f2c14e"; for (let k = 0; k < 5; k++) x.fillRect(22 + k * 2, 18, 1, 2); eye(x, 10, 10, 3.6); x.fillStyle = OUT; x.fillRect(4, 14, 3, 1); },
    grouper(x, f) { const o = { cx: 17, cy: 12, rx: 13, ry: 9, col: "#e8b030", belly: "#ffe08a", tail: "fan", tailCol: "#d89a20", tailW: 7, tailH: 7, dorsal: 4, finCol: "#c88a18", pec: true }; body(x, o, f); x.fillStyle = "#b8780e"; [[12, 8], [18, 7], [23, 10], [15, 13], [21, 14], [26, 12]].forEach(([a, b]) => x.fillRect(a, b, 2, 2)); x.fillStyle = "#fff8c8"; x.fillRect(14, 5, 2, 1); x.fillRect(22, 6, 1, 1); eye(x, 9, 9, 2); ell(x, 5, 14, 3, 2, OUT); ell(x, 5, 14, 2.2, 1.2, "#b85a2a"); },
    shark(x, f) { const o = { cx: 21, cy: 12, rx: 17, ry: 7, col: "#7d8aa0", belly: "#eef2f8", tail: "fork", tailCol: "#6a7890", tailW: 9, tailH: 9, dorsal: 7, finCol: "#6a7890", pec: true }; body(x, o, f); x.fillStyle = OUT; x.fillRect(5, 9, 11, 3); x.fillStyle = "#1a1420"; x.fillRect(6, 9, 4, 3); x.fillRect(11, 9, 4, 3); x.fillStyle = "#6a8aff"; x.fillRect(7, 9, 1, 1); x.fillRect(12, 9, 1, 1); x.fillStyle = OUT; for (let k = 0; k < 4; k++) x.fillRect(4 + k * 2, 15, 1, 1); x.fillStyle = "#ffffff"; for (let k = 0; k < 4; k++) x.fillRect(5 + k * 2, 15, 1, 1); },
    orca(x, f) { const o = { cx: 22, cy: 13, rx: 18, ry: 8, col: "#1a1824", belly: "#f4f4f8", tail: "fork", tailCol: "#1a1824", tailW: 9, tailH: 7, dorsal: 8, finCol: "#1a1824", pec: true }; body(x, o, f); ell(x, 11, 9, 3.2, 1.8, "#ffffff"); eye(x, 8, 11, 1.2); x.fillStyle = "#ff8fb8"; x.fillRect(4, 13, 2, 1); x.fillStyle = "#a77ce0"; x.fillRect(2, 2, 1, 4); x.fillRect(0, 5, 2, 2); x.fillRect(5, 0, 1, 4); x.fillRect(3, 3, 2, 2); x.fillRect(3, 0, 3, 1); },
    cloudwhale(x, f) { const o = { cx: 24, cy: 15, rx: 20, ry: 10, col: "#eaf4ff", belly: "#ffffff", tail: "fan", tailCol: "#d8e8ff", tailW: 9, tailH: 8, shine: false }; body(x, o, f); [[10, 6], [18, 4], [27, 4], [35, 7]].forEach(([a, b]) => { ell(x, a, b + 2, 5, 4, OUT); ell(x, a, b + 2, 4.2, 3.2, "#ffffff"); }); eye(x, 9, 14, 1.6, true); ell(x, 12, 18, 2, 1.2, "#ffb8cc"); x.fillStyle = "#9fc8ff"; x.fillRect(20, 20, 8, 1); },
    furwhale(x, f) {
      // 👑 털보고래: 둥근 고래 몸 + 꼬리지느러미 + 복슬복슬 털 + 덥수룩한 수염 + 왕관 + 물뿜기
      const B = "#8a5a3a", B2 = "#b0805a", B3 = "#5e3820", BEL = "#e2c49a", wag = f ? 1 : -1;
      const cx = 32, cy = 23, rx = 26, ry = 13, top = (px) => cy - ry * Math.sqrt(Math.max(0, 1 - ((px - cx) / rx) ** 2));
      // 꼬리 (몸통 → 꼬리자루 → 위아래 꼬리지느러미)
      tri(x, [[48, 15], [65, 21], [65, 27], [48, 33]], OUT); tri(x, [[48, 16], [64, 22], [64, 26], [48, 32]], B);
      tri(x, [[61, 24], [73, 10 + wag], [70, 24]], OUT); tri(x, [[62, 23], [72, 12 + wag], [69, 23]], B2);
      tri(x, [[61, 24], [73, 38 - wag], [70, 24]], OUT); tri(x, [[62, 25], [72, 36 - wag], [69, 25]], B);
      // 등의 복슬복슬한 털 (둥근 털 뭉치를 겹쳐서)
      const tufts = []; for (let px = 7; px <= 56; px += 3.3) tufts.push([px, top(px) + 0.4, 2.2 + ((Math.round(px) * 7) % 3) * 0.35]);
      tufts.forEach(([a, b, r]) => ell(x, a, b, r + 1, r + 0.9, OUT));
      // 몸 + 배
      ell(x, cx, cy, rx + 1, ry + 1, OUT); ell(x, cx, cy, rx, ry, B);
      tufts.forEach(([a, b, r], k) => { ell(x, a, b, r, r - 0.1, k % 2 ? B2 : "#c4946a"); x.fillStyle = "#e6c091"; x.fillRect(Math.round(a - 1), Math.round(b - r + 0.8), 1, 1); });
      x.save(); x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.clip(); ell(x, cx - 2, cy + ry * 0.85, rx * 0.95, ry * 0.55, BEL);
      x.fillStyle = "#c9a57a"; for (let k = 0; k < 7; k++) x.fillRect(14 + k * 5, cy + 7 + (k % 2), 3, 1); x.restore();
      // 털 결 (몸 안쪽 곱슬곱슬)
      [[22, 15], [29, 14], [36, 14], [43, 16], [19, 20], [26, 18], [33, 18], [40, 20], [47, 21], [24, 23], [31, 22], [38, 24]].forEach(([a, b], k) => { x.fillStyle = k % 3 ? B2 : B3; x.fillRect(a, b, 2, 1); x.fillRect(a + 1, b + 1, 1, 1); x.fillRect(a - 1, b + 1, 1, 1); });
      // 앞지느러미 (아래로 살짝)
      tri(x, [[24, 30], [34, 31], [28, 38]], OUT); tri(x, [[25.5, 31], [32, 31.6], [28, 36.4]], B2);
      // 눈 + 덥수룩한 눈썹 + 볼 + 입
      eye(x, 14, 19, 2); x.fillStyle = B3; x.fillRect(11, 15, 6, 2); x.fillStyle = OUT; x.fillRect(10, 15, 1, 1); x.fillRect(16, 14, 2, 1);
      ell(x, 19, 23, 2, 1.2, "#ffb0a0");
      x.fillStyle = OUT; x.fillRect(6, 26, 10, 1);
      // 덥수룩한 수염 (턱 아래 둥근 털 뭉치)
      const dy = f ? 0.6 : 0, beard = [[6, 29, 3], [10, 31, 3.5], [15, 30.5, 3.3], [19.5, 28.8, 2.6], [8.5, 34, 2.6], [13, 35, 2.7], [17, 33.5, 2.2]];
      beard.forEach(([a, b, r]) => ell(x, a, b + dy, r + 1, r + 0.9, OUT));
      beard.forEach(([a, b, r], k) => ell(x, a, b + dy, r, r - 0.1, k % 2 ? "#e8d4b4" : "#f4e6cc"));
      x.fillStyle = "#c9ab84"; [[5, 29], [9, 32], [14, 31], [12, 35], [17, 30], [8, 34], [16, 34]].forEach(([a, b]) => x.fillRect(a, Math.round(b + dy), 1, 2));
      // 왕관
      x.fillStyle = OUT; x.fillRect(13, 6, 14, 7); x.fillRect(13, 4, 3, 3); x.fillRect(18, 3, 4, 4); x.fillRect(24, 4, 3, 3);
      x.fillStyle = "#ffd34d"; x.fillRect(14, 8, 12, 4); x.fillRect(14, 5, 1, 3); x.fillRect(19, 4, 2, 4); x.fillRect(25, 5, 1, 3);
      x.fillStyle = "#ff5f7f"; x.fillRect(19, 9, 2, 2); x.fillStyle = "#7fd0ff"; x.fillRect(15, 9, 1, 1); x.fillRect(24, 9, 1, 1); x.fillStyle = "#fff3a8"; x.fillRect(14, 8, 12, 1);
      // 물뿜기 (프레임마다 높이가 달라짐)
      const sh = f ? 6 : 4, drops = [[30, 8 - sh], [28, 10 - sh], [32, 7 - sh], [35, 7 - sh], [37, 8 - sh], [39, 10 - sh], [33.5, 6 - sh]];
      x.fillStyle = OUT; x.fillRect(32, 10 - sh, 3, sh + 1);
      drops.forEach(([a, b]) => { x.fillStyle = OUT; x.fillRect(Math.round(a) - 1, b - 1, 3, 3); });
      x.fillStyle = "#cfefff"; x.fillRect(33, 10 - sh, 1, sh + 1); drops.forEach(([a, b]) => x.fillRect(Math.round(a), b, 1, 1));
    },
  };
  const SIZE = { goldfish: [36, 24], minnow: [32, 14], puffer: [30, 26], mackerel: [36, 18], flounder: [34, 19], halibut: [40, 21], cutlass: [50, 12], tuna: [44, 24], grouper: [42, 25], shark: [50, 26], orca: [52, 28], cloudwhale: [60, 32], furwhale: [74, 40] };
  function sprite(id, f) {
    const k = id + (f ? 1 : 0); if (cache[k]) return cache[k];
    const [w, h] = SIZE[id] || [32, 20], [c, x] = mk(w, h);
    try { (DRAW[id] || DRAW.goldfish)(x, f); } catch {}
    return (cache[k] = c);
  }
  // ctx 에 물고기를 그림: (cx, cy) 가운데, 너비 w, flip=true 면 오른쪽을 봄
  function draw(ctx, id, cx, cy, w, t, flip) {
    const sp = sprite(id, Math.floor((t || 0) / 220) % 2), s = w / sp.width, h = sp.height * s;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.translate(cx, cy + Math.sin((t || 0) / 300) * s * 0.6);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(sp, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  // ---------------- 낚시 미니게임 ----------------
  let ui = null, run = null;
  function build() {
    if (ui) return ui;
    const el = document.createElement("div");
    el.id = "fish-ui"; el.className = "hidden";
    el.innerHTML = `<div class="fu-card"><div class="fu-head"><b class="fu-title"></b><span class="fu-lives"></span></div>
      <div class="fu-dial-wrap"><canvas class="fu-dial"></canvas><div class="fu-pop"></div><div class="fu-center"></div></div>
      <div class="fu-prog"></div><div class="fu-time"><i></i></div><p class="fu-hint"></p><button type="button" class="btn sm fu-cancel"></button></div>`;
    document.body.appendChild(el);
    ui = { el, card: el.querySelector(".fu-card"), title: el.querySelector(".fu-title"), lives: el.querySelector(".fu-lives"), dial: el.querySelector(".fu-dial"), pop: el.querySelector(".fu-pop"), center: el.querySelector(".fu-center"), prog: el.querySelector(".fu-prog"), time: el.querySelector(".fu-time i"), hint: el.querySelector(".fu-hint"), cancel: el.querySelector(".fu-cancel") };
    el.querySelector(".fu-dial-wrap").addEventListener("pointerdown", (e) => { e.preventDefault(); tap(); });
    ui.cancel.addEventListener("click", () => { if (run) finish({ cancel: true }); });
    return ui;
  }
  const TAU = Math.PI * 2;
  const angDist = (a, b) => { let d = (a - b) % TAU; if (d < 0) d += TAU; return Math.min(d, TAU - d); };
  function pop(text, cls) { const p = ui.pop; p.textContent = text; p.className = "fu-pop " + cls; void p.offsetWidth; p.classList.add("go"); }
  function renderProg() {
    const r = run; if (!r) return;
    ui.prog.innerHTML = r.stage === "fight" ? Array.from({ length: r.c.need }, (_, i) => `<i class="${i < r.greats ? "on" : ""}"></i>`).join("") : "";
    ui.lives.textContent = r.stage === "fight" ? "❤️".repeat(Math.max(0, r.c.miss + 1 - r.misses)) + "🤍".repeat(Math.min(r.c.miss + 1, r.misses)) : "";
  }
  function tap() {
    const r = run; if (!r) return;
    if (r.stage !== "fight") { if (r.stage === "wait") pop(r.t("fishNotYet"), "wait"); return; }
    const d = angDist(r.na, r.ta), tol = (r.zone / 2) * Math.PI / 180 + 0.05;
    if (d <= tol) {
      r.greats++; r.sfx("great"); pop("Great!", "great");
      try { navigator.vibrate && navigator.vibrate(25); } catch {}
      if (r.greats >= r.c.need) { renderProg(); return finish({ ok: true }); }
      if (r.c.rev) r.dir = -r.dir;
      if (r.c.move) r.ta = r.na + r.dir * ((110 + Math.random() * 140) * Math.PI / 180); // 다음 칸은 바늘 앞쪽 어딘가로
    } else {
      r.misses++; r.sfx("miss"); pop("Miss", "miss");
      ui.card.classList.remove("shake"); void ui.card.offsetWidth; ui.card.classList.add("shake");
      if (r.misses > r.c.miss) { renderProg(); return finish({ ok: false, why: "miss" }); }
    }
    renderProg();
  }
  function frame(now) {
    const r = run; if (!r) return;
    const dt = Math.min(0.05, (now - r.last) / 1000); r.last = now;
    if (r.stage === "wait" && now >= r.biteAt) { // 🐟 입질!
      r.stage = "fight"; r.fightAt = now; ui.el.dataset.stage = "fight"; r.sfx("bite"); r.onBite && r.onBite();
      try { navigator.vibrate && navigator.vibrate([60, 40, 90]); } catch {}
      ui.hint.textContent = r.t("fishBite"); ui.center.textContent = ""; pop("!!", "bite"); renderProg();
    }
    if (r.stage === "fight") {
      r.na += r.dir * r.speed * TAU * dt;
      const left = r.c.limit - (now - r.fightAt);
      ui.time.style.width = Math.max(0, (left / r.c.limit) * 100) + "%";
      if (left <= 0) return finish({ ok: false, why: "time" });
    }
    paint(now);
    r.raf = requestAnimationFrame(frame);
  }
  function paint(now) {
    const r = run, cv = ui.dial, dpr = Math.min(2, window.devicePixelRatio || 1), D = cv.clientWidth || 240;
    if (cv.width !== Math.round(D * dpr)) { cv.width = Math.round(D * dpr); cv.height = Math.round(D * dpr); }
    const x = cv.getContext("2d"); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, D, D);
    const C = D / 2, R = D / 2 - 8, fight = r.stage === "fight";
    // 버튼 (기다릴 때는 반투명 흰색 → 입질이 오면 빨간색)
    const pulse = 0.5 + 0.5 * Math.sin(now / (fight ? 120 : 500));
    x.fillStyle = fight ? `rgba(232,44,72,${0.6 + pulse * 0.12})` : `rgba(255,255,255,${0.26 + pulse * 0.1})`;
    x.beginPath(); x.arc(C, C, R, 0, TAU); x.fill();
    x.lineWidth = 4; x.strokeStyle = fight ? "#ffd1dc" : "rgba(255,255,255,.85)"; x.stroke();
    if (fight) { x.lineWidth = 2; x.strokeStyle = `rgba(255,255,255,${0.25 + pulse * 0.3})`; x.beginPath(); x.arc(C, C, R + 5 + pulse * 3, 0, TAU); x.stroke(); }
    // 눈금
    x.strokeStyle = fight ? "rgba(255,255,255,.55)" : "rgba(255,255,255,.5)"; x.lineWidth = 2;
    for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU - Math.PI / 2; x.beginPath(); x.moveTo(C + Math.cos(a) * (R - 10), C + Math.sin(a) * (R - 10)); x.lineTo(C + Math.cos(a) * (R - 3), C + Math.sin(a) * (R - 3)); x.stroke(); }
    if (fight) {
      // 노란 칸 (여기에 바늘이 오면 누르기)
      const zh = (r.zone / 2) * Math.PI / 180, a0 = r.ta - zh - Math.PI / 2, a1 = r.ta + zh - Math.PI / 2;
      x.fillStyle = "rgba(255,226,92,.95)"; x.beginPath(); x.moveTo(C, C); x.arc(C, C, R - 2, a0, a1); x.closePath(); x.fill();
      x.strokeStyle = "#fff8d0"; x.lineWidth = 2; x.stroke();
      const am = r.ta - Math.PI / 2; x.fillStyle = "#3a2530"; x.beginPath(); x.moveTo(C + Math.cos(am) * (R + 6), C + Math.sin(am) * (R + 6)); x.lineTo(C + Math.cos(am - 0.12) * (R + 16), C + Math.sin(am - 0.12) * (R + 16)); x.lineTo(C + Math.cos(am + 0.12) * (R + 16), C + Math.sin(am + 0.12) * (R + 16)); x.closePath(); x.fill();
      // 바늘
      const an = r.na - Math.PI / 2, hit = angDist(r.na, r.ta) <= zh;
      x.lineCap = "round"; x.strokeStyle = "#3a2530"; x.lineWidth = 9; x.beginPath(); x.moveTo(C, C); x.lineTo(C + Math.cos(an) * (R - 6), C + Math.sin(an) * (R - 6)); x.stroke();
      x.strokeStyle = hit ? "#fff3a8" : "#ffffff"; x.lineWidth = 5; x.beginPath(); x.moveTo(C, C); x.lineTo(C + Math.cos(an) * (R - 6), C + Math.sin(an) * (R - 6)); x.stroke();
      x.fillStyle = "#3a2530"; x.beginPath(); x.arc(C, C, 11, 0, TAU); x.fill(); x.fillStyle = "#ffd1dc"; x.beginPath(); x.arc(C, C, 7, 0, TAU); x.fill();
    } else {
      // 기다리는 중: 찌가 둥실둥실
      const by = C + Math.sin(now / 380) * 6;
      x.fillStyle = "#3a2530"; x.beginPath(); x.arc(C, by, 15, 0, TAU); x.fill();
      x.fillStyle = "#ffffff"; x.beginPath(); x.arc(C, by, 13, 0, Math.PI); x.fill();
      x.fillStyle = "#ff4d6d"; x.beginPath(); x.arc(C, by, 13, Math.PI, TAU); x.fill();
      x.strokeStyle = "rgba(255,255,255,.7)"; x.lineWidth = 2;
      for (let k = 0; k < 2; k++) { const rr = 22 + ((now / 30 + k * 20) % 40); x.globalAlpha = 1 - (rr - 22) / 40; x.beginPath(); x.ellipse(C, C + 18, rr, rr * 0.3, 0, 0, TAU); x.stroke(); }
      x.globalAlpha = 1;
    }
  }
  function finish(res) {
    const r = run; if (!r) return;
    run = null; cancelAnimationFrame(r.raf);
    ui.el.classList.add("hidden"); ui.card.classList.remove("shake");
    window.removeEventListener("keydown", r.key, true);
    r.resolve({ ...res, greats: r.greats, misses: r.misses, ms: r.fightAt ? Math.round(performance.now() - r.fightAt) : 0 });
  }
  // 낚시 시작: cast = 서버가 준 난이도 { biteMs, need, speed, zone, miss, move, rev, limit, tier }
  function start(cast, opts) {
    build();
    if (run) finish({ cancel: true });
    const now = performance.now();
    return new Promise((resolve) => {
      run = { c: { ...cast }, t: opts.t, sfx: opts.sfx || (() => {}), onBite: opts.onBite, resolve, stage: "wait", biteAt: now + cast.biteMs, last: now, greats: 0, misses: 0, dir: 1, speed: cast.speed, zone: cast.zone, ta: 0, na: -(200 + Math.random() * 60) * Math.PI / 180 };
      run.key = (e) => { if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return; if (e.code === "Space" || e.code === "KeyE") { e.preventDefault(); e.stopPropagation(); if (!e.repeat) tap(); } if (e.code === "Escape") { e.preventDefault(); e.stopPropagation(); finish({ cancel: true }); } };
      window.addEventListener("keydown", run.key, true);
      ui.title.textContent = opts.title || "🎣"; ui.hint.textContent = opts.t("fishWait"); ui.center.textContent = "";
      ui.cancel.textContent = opts.t("fishReel"); ui.time.style.width = "100%"; ui.prog.innerHTML = ""; ui.lives.textContent = "";
      ui.el.dataset.stage = "wait"; ui.el.classList.remove("hidden");
      run.raf = requestAnimationFrame(frame);
    });
  }
  window.Fishing = { SPECIES, BY, draw, sprite, start, tap, get active() { return !!run; }, stage: () => (run ? run.stage : null), cancel: () => run && finish({ cancel: true }) };
})();
