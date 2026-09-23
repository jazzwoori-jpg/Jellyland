/* 픽셀 캐릭터 그리기 — 16x24 픽셀, 발 위치(x,y) 기준 */
(function () {
  const OUT = "#3a2530";
  const SKINS = [
    { c: "#ffe6d3", s: "#f3c9ae", name: "밀키" },
    { c: "#f8d2b0", s: "#e6b28d", name: "피치" },
    { c: "#e8b58a", s: "#cf9868", name: "허니" },
    { c: "#c68b5e", s: "#a8704a", name: "캐러멜" },
    { c: "#8d5b3c", s: "#72452c", name: "코코아" },
  ];
  const HAIR_COLORS = [
    { c: "#2e2433", s: "#1c1520", name: "블랙" },
    { c: "#6e4029", s: "#512d1c", name: "브라운" },
    { c: "#e0a458", s: "#c1823a", name: "캐러멜" },
    { c: "#f6dc86", s: "#d9ba5d", name: "블론드" },
    { c: "#f28bb4", s: "#d46a94", name: "딸기" },
    { c: "#9b86ec", s: "#7a64cf", name: "포도" },
    { c: "#62c3cf", s: "#43a3af", name: "민트" },
    { c: "#eceaf4", s: "#c9c5d9", name: "실버" },
  ];
  const HAIRS = ["숏컷", "롱헤어", "포니테일", "단발 뱅", "삐죽머리"];
  const OUTFITS = [
    { name: "젤리 후디", top: "#ff8fb8", top2: "#e56b98", bot: "#5c6fd6", skirt: "#ff8fb8", acc: "#fff4a8" },
    { name: "피아노 턱시도", top: "#2f2a3a", top2: "#1d1926", bot: "#2f2a3a", skirt: "#2f2a3a", acc: "#ffffff", bow: "#e0405a" },
    { name: "민트 캐주얼", top: "#8fe3cf", top2: "#62c4ad", bot: "#f4efe6", skirt: "#f4efe6", acc: "#ffffff" },
    { name: "포도 재킷", top: "#9b7bea", top2: "#7a5bcf", bot: "#3a3350", skirt: "#3a3350", acc: "#ffd66b" },
    { name: "세일러", top: "#f7f4ff", top2: "#d9d4ec", bot: "#34407a", skirt: "#34407a", acc: "#34407a", bow: "#e0405a" },
    { name: "딸기 오버롤", top: "#fff3f6", top2: "#f2d7de", bot: "#e85a6e", skirt: "#e85a6e", acc: "#e85a6e", overall: true },
  ];

  function draw(ctx, av, x, y, dir = "down", frame = 0, opts = {}) {
    av = av || { gender: "f", hair: 0, hairColor: 0, skin: 0, outfit: 0 };
    const sk = SKINS[av.skin] || SKINS[0];
    const hc = HAIR_COLORS[av.hairColor] || HAIR_COLORS[0];
    const of = OUTFITS[av.outfit] || OUTFITS[0];
    const hair = av.hair | 0;
    const fem = av.gender !== "m";
    const ox = Math.round(x) - 8, oy = Math.round(y) - 24;
    const bob = frame % 2 === 1 ? 1 : 0; // 걷기 위아래
    const R = (px, py, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(ox + px, oy + py + (py < 19 ? bob : 0), w, h); };
    const side = dir === "left" || dir === "right";
    const flip = dir === "left";
    const S = (px, py, w, h, c) => R(flip ? 16 - px - w : px, py, w, h, c); // 좌우 반전 헬퍼

    // 그림자
    ctx.fillStyle = "rgba(58,37,48,.25)";
    ctx.fillRect(ox + 3, oy + 22, 10, 2);
    ctx.fillRect(ox + 4, oy + 21, 8, 1);

    // ---- 다리 & 신발 ----
    const stepA = frame === 1 ? -1 : 0, stepB = frame === 3 ? -1 : 0;
    const legC = of.bot;
    if (side) {
      S(6, 18 + stepA, 2, 4, OUT); S(9, 18 + stepB, 2, 4, OUT);
      S(6, 18 + stepA, 2, 3, fem ? sk.c : legC); S(9, 18 + stepB, 2, 3, fem ? sk.s : legC);
      S(6, 21 + stepA, 3, 2, OUT); S(9, 21 + stepB, 3, 2, OUT);
    } else {
      R(5, 18, 6, 4 + (stepA || stepB ? 0 : 0), OUT);
      R(6, 18 + stepA, 2, 3, fem ? sk.c : legC); R(9, 18 + stepB, 2, 3, fem ? sk.c : legC);
      R(5, 21 + stepA, 3, 2, OUT); R(9, 21 + stepB, 3, 2, OUT);
      R(6, 21 + stepA, 1, 1, "#6b5160"); R(10, 21 + stepB, 1, 1, "#6b5160");
    }

    // ---- 몸통 ----
    R(4, 11, 8, 8, OUT);
    R(5, 12, 6, 6, of.top);
    R(5, 16, 6, 1, of.top2);
    if (of.overall) { R(5, 14, 6, 3, of.bot); R(6, 12, 1, 2, of.bot); R(9, 12, 1, 2, of.bot); }
    if (!side && of.acc && !of.overall) R(7, 12, 2, 1, of.acc);
    if (!side && of.bow && dir !== "up") { R(7, 12, 2, 1, of.bow); R(6, 12, 1, 1, of.bow); R(9, 12, 1, 1, of.bow); }
    if (outfitIs(of, "피아노 턱시도") && dir !== "up") R(7, 13, 2, 3, "#fff");
    // 하의: 여성은 치마, 남성은 바지 라인
    if (fem) {
      R(3, 16, 10, 3, OUT); R(4, 16, 8, 2, of.skirt); R(4, 17, 8, 1, shade(of.skirt));
    } else {
      R(5, 17, 6, 2, of.bot);
      if (!side) R(7, 18, 2, 1, OUT);
    }
    // 팔
    if (side) {
      S(7, 12, 3, 5, OUT); S(8, 13, 1, 3, of.top2); S(8, 16, 1, 1, sk.c);
    } else {
      R(3, 12, 2, 5, OUT); R(11, 12, 2, 5, OUT);
      R(4, 13, 1, 3, of.top2); R(11, 13, 1, 3, of.top2);
      R(4, 16, 1, 1, sk.c); R(11, 16, 1, 1, sk.c);
    }

    // ---- 머리 뒤 (롱/포니테일) ----
    if (hair === 1) { if (side) S(3, 5, 4, 9, OUT), S(4, 5, 3, 8, hc.s); else if (dir === "up") R(3, 4, 10, 11, OUT); else R(2, 5, 12, 9, OUT), R(3, 5, 10, 8, hc.s); }
    if (hair === 2) { if (side) S(1, 4, 4, 7, OUT), S(2, 5, 2, 5, hc.c); else if (dir === "up") R(6, 9, 4, 6, OUT), R(7, 9, 2, 5, hc.c); else R(1, 5, 3, 6, OUT), R(12, 5, 3, 6, OUT), R(2, 6, 1, 4, hc.c), R(13, 6, 1, 4, hc.c); }

    // ---- 얼굴 ----
    R(3, 2, 10, 10, OUT);
    R(4, 3, 8, 8, sk.c);
    R(4, 10, 8, 1, sk.s);

    // ---- 머리카락 ----
    if (dir === "up") {
      R(4, 2, 8, 8, hc.c); R(3, 3, 1, 6, hc.c); R(12, 3, 1, 6, hc.c); R(5, 3, 3, 1, lighten(hc.c));
      if (hair === 1) { R(4, 9, 8, 5, hc.c); R(5, 13, 6, 1, hc.s); }
    } else if (side) {
      S(4, 2, 8, 3, hc.c); S(3, 3, 1, 6, hc.c); S(4, 5, 3, 4, hc.c); S(5, 3, 3, 1, lighten(hc.c));
      if (hair === 1 || hair === 3) S(4, 5, 3, 6, hc.c);
      if (hair === 4) { S(4, 1, 2, 1, hc.c); S(7, 1, 2, 1, hc.c); S(10, 1, 2, 1, hc.c); }
      // 눈
      S(10, 6, 1, 2, OUT); S(10, 9, 1, 1, "#ff9fb3");
      if (fem) S(11, 5, 1, 1, OUT);
    } else {
      // 앞머리
      R(4, 2, 8, 3, hc.c); R(3, 3, 1, 5, hc.c); R(12, 3, 1, 5, hc.c);
      R(5, 3, 3, 1, lighten(hc.c));
      if (hair === 0) { R(4, 5, 2, 1, hc.c); R(10, 5, 2, 1, hc.c); }
      if (hair === 1) { R(3, 5, 2, 7, hc.c); R(11, 5, 2, 7, hc.c); R(4, 5, 1, 1, hc.c); }
      if (hair === 2) { R(4, 5, 3, 1, hc.c); R(9, 5, 3, 1, hc.c); R(12, 3, 2, 2, "#ff7aa8"); }
      if (hair === 3) { R(4, 5, 8, 1, hc.c); R(3, 5, 2, 5, hc.c); R(11, 5, 2, 5, hc.c); R(5, 6, 1, 1, hc.s); R(10, 6, 1, 1, hc.s); }
      if (hair === 4) { R(4, 1, 1, 1, hc.c); R(7, 1, 2, 1, hc.c); R(11, 1, 1, 1, hc.c); R(5, 5, 1, 1, hc.c); R(8, 5, 2, 1, hc.c); }
      // 눈 · 볼
      R(5, 6, 2, 3, OUT); R(9, 6, 2, 3, OUT);
      R(5, 6, 1, 1, "#fff"); R(9, 6, 1, 1, "#fff");
      if (fem) { R(4, 6, 1, 1, OUT); R(11, 6, 1, 1, OUT); }
      R(4, 9, 1, 1, "#ff9fb3"); R(11, 9, 1, 1, "#ff9fb3");
      R(7, 9, 2, 1, "#c96a7a");
    }
    // 아티스트 왕관
    if (opts.crown) { R(5, -2, 6, 2, "#ffd34d"); R(5, -3, 1, 1, "#ffd34d"); R(7, -3, 2, 1, "#ffd34d"); R(10, -3, 1, 1, "#ffd34d"); R(7, -1, 2, 1, "#e0405a"); }
  }
  function outfitIs(of, n) { return of.name === n; }
  function shade(hex) { return mix(hex, "#000000", 0.15); }
  function lighten(hex) { return mix(hex, "#ffffff", 0.35); }
  function mix(a, b, t) {
    const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const A = p(a), B = p(b);
    return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
  }
  window.Avatar = { draw, SKINS, HAIR_COLORS, HAIRS, OUTFITS, mix,
    random: () => ({ gender: Math.random() < 0.5 ? "f" : "m", hair: (Math.random() * 5) | 0, hairColor: (Math.random() * 8) | 0, skin: (Math.random() * 5) | 0, outfit: (Math.random() * 6) | 0 }) };
})();
