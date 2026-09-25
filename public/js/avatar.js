/* 픽셀 캐릭터 v3 — 트릭스터풍 치비 스타일 (48x48 캔버스, 발 위치 기준 · 날개/왕관/마법봉 여유 공간 포함)
   각 부위를 색으로 채운 뒤 자동으로 외곽선을 그려 도트 느낌을 살리고,
   (아바타 · 방향 · 프레임)별로 캐시해서 빠르게 그림 */
(function () {
  const OUTLINE = "#2b1d2a";
  // 그리기 좌표는 32x40 기준(CX=16), 실제 캔버스는 사방 8px 여유를 둔 48x48
  const OX = 8, OY = 8, W = 48, H = 48, CX = 16, FOOT = 38;

  const SKINS = [
    { c: "#ffe8d8", s: "#f5cbb4" },
    { c: "#fbd6b8", s: "#ecb896" },
    { c: "#eab98f", s: "#d49c70" },
    { c: "#c98e62", s: "#aa734c" },
    { c: "#8f5d3e", s: "#744830" },
  ];
  const HAIR_COLORS = [
    { c: "#2f2536", s: "#1d1622", l: "#4d3d58" },
    { c: "#6f4128", s: "#522c1a", l: "#8f5a3a" },
    { c: "#c98b52", s: "#a86c3a", l: "#e2ad74" }, // 캐러멜 (스프라이트 시트 기본)
    { c: "#f3d27c", s: "#d6b058", l: "#fff0b0" },
    { c: "#f08bb2", s: "#d06a92", l: "#ffb8d4" },
    { c: "#9a84ea", s: "#7662cc", l: "#bfaeff" },
    { c: "#5ec1cf", s: "#3fa0ae", l: "#9ae6ef" },
    { c: "#ebe8f3", s: "#c6c1d8", l: "#ffffff" },
  ];
  const EYES = ["#6b7fd6", "#8a5a3c", "#9b5fd6", "#3fa46a", "#d8434e"];
  // 0~5 기본 · 6~9 젤리젤리샵 판매
  const HAIRS = ["twin", "longwave", "bob", "short", "pony", "spiky", "buns", "heartlong", "bigbow", "galaxy"];
  // 옷 — 스프라이트 시트의 마법소녀 복장이 기본
  const OUTFITS = [
    { id: "magic", top: "#a77ce0", topS: "#8459c2", skirt: "#a77ce0", skirtS: "#8459c2", frill: "#ffffff", sleeve: "#ffffff", cape: "#d8434e", capeS: "#ad2d3a",
      glove: "#8a5634", legs: "#ffffff", boots: "#a77ce0", bootsS: "#7d52b8", cuff: "#f2c14e", belt: "#7a4a2c", star: "#f7cd45", pantsM: "#5b4a8a" },
    { id: "bear", top: "#f5b544", topS: "#d9952c", skirt: "#f5b544", skirtS: "#d9952c", sleeve: "#f5b544", belly: "#fff6ea", legs: "#f5b544", boots: "#ffffff", bootsS: "#e6ddd6",
      hood: true, pantsM: "#f5b544", onesie: true, host: true, keytar: true },
    { id: "tux", top: "#2c2736", topS: "#1b1822", shirt: "#ffffff", skirt: "#2c2736", skirtS: "#1b1822", sleeve: "#2c2736", legs: null, boots: "#2c2736", bootsS: "#1b1822", bow: "#d8434e", pantsM: "#2c2736" },
    { id: "sailor", top: "#f7f5ff", topS: "#d9d4ec", collar: "#33407e", skirt: "#33407e", skirtS: "#232d60", sleeve: "#f7f5ff", legs: "#ffffff", boots: "#6b3f2a", bootsS: "#4f2c1d", bow: "#d8434e", pantsM: "#33407e" },
    { id: "mint", top: "#8fe0cc", topS: "#62c0aa", collar: "#ffffff", skirt: "#8fe0cc", skirtS: "#62c0aa", frill: "#ffffff", sleeve: "#8fe0cc", legs: null, boots: "#f7f5ff", bootsS: "#d9d4ec", pantsM: "#5aa996" },
    { id: "black", top: "#27232f", topS: "#17141c", shirt: "#1b1820", skirt: "#27232f", skirtS: "#17141c", sleeve: "#27232f", legs: "#27232f", boots: "#1b1820", bootsS: "#0f0d12", pearls: true, pantsM: "#27232f" },
    { id: "berry", top: "#fff4f6", topS: "#f0d6dc", skirt: "#e3566a", skirtS: "#c03c50", sleeve: "#fff4f6", legs: null, boots: "#e3566a", bootsS: "#c03c50", overall: "#e3566a", pantsM: "#e3566a" },
    // ---- 호스트(조젤리) 전용 ----
    { id: "stage", host: true, top: "#2b2f6b", topS: "#1d2050", skirt: "#2b2f6b", skirtS: "#1d2050", sleeve: "#ffffff", glove: "#ffffff", legs: null, boots: "#f2c14e", bootsS: "#c9982c",
      gown: true, sparkle: ["#f7cd45", "#ffffff"], star: "#f7cd45", belt: "#f2c14e", pantsM: "#2b2f6b" },
    { id: "galaxy", host: true, top: "#5b3fa8", topS: "#432c86", shirt: "#ff9fc8", skirt: "#262a5c", skirtS: "#1a1d44", sleeve: "#5b3fa8", legs: "#262a5c", boots: "#ffffff", bootsS: "#d9d4ec",
      cape: "#3a2a7a", capeS: "#281c5a", star: "#9fe8ff", sparkle: ["#ffffff", "#9fe8ff", "#ff9fc8"], pantsM: "#262a5c" },
    { id: "rockstar", host: true, top: "#d8434e", topS: "#ad2d3a", shirt: "#1b1820", skirt: "#1b1820", skirtS: "#0f0d12", sleeve: "#d8434e", legs: "#1b1820", boots: "#1b1820", bootsS: "#0f0d12",
      cuff: "#f2c14e", belt: "#f2c14e", star: "#f2c14e", pantsM: "#1b1820", keytar: true },
    // ---- 젤리젤리샵 판매 의상 (10~16: 비쌀수록 화려하고 큼) ----
    { id: "gingham", top: "#ffffff", topS: "#eadfe8", skirt: "#ff9fc8", skirtS: "#e57ba7", checker: "#ffffff", sleeve: "#ffffff", legs: "#ffffff", boots: "#e3566a", bootsS: "#c03c50", bow: "#e3566a", frill: "#ffffff", pantsM: "#e57ba7" },
    { id: "cherry", top: "#d8434e", topS: "#ad2d3a", skirt: "#d8434e", skirtS: "#ad2d3a", apron: "#ffffff", sleeve: "#ffffff", legs: "#ffffff", boots: "#8a2a33", bootsS: "#6a1d25", frill: "#ffffff",
      dots: ["#3fa46a", "#ff6f7d"], pantsM: "#ad2d3a" },
    { id: "moon", top: "#2b2f6b", topS: "#1d2050", skirt: "#2b2f6b", skirtS: "#1d2050", sleeve: "#dfe4ff", legs: "#dfe4ff", boots: "#c9ced9", bootsS: "#9aa1b5", cape: "#1d2050", capeS: "#12153a",
      bigCape: true, moon: true, star: "#f7e27a", sparkle: ["#f7e27a", "#ffffff"], pantsM: "#2b2f6b" },
    { id: "idol", top: "#ff8fbf", topS: "#e56b9f", skirt: "#ffffff", skirtS: "#ffd1e6", sleeve: "#ffffff", legs: "#ffffff", boots: "#ff8fbf", bootsS: "#e56b9f", cuff: "#ffffff", frill: "#ff8fbf",
      tiers: ["#ff8fbf", "#ffffff", "#ffb8d8"], heart: "#d8434e", sparkle: ["#ffffff", "#fff3a8", "#ffb8d8"], pantsM: "#ff8fbf" },
    { id: "fairy", top: "#a8ecd8", topS: "#7fd0b8", skirt: "#ffc2e2", skirtS: "#f09cc6", sleeve: "#ffffff", legs: "#ffffff", boots: "#a8ecd8", bootsS: "#7fd0b8", frill: "#ffffff",
      wings: ["#c8f4ff", "#ffd8f0", "#e8fbff"], sparkle: ["#ffffff", "#ffd8f0"], pantsM: "#7fd0b8" },
    { id: "aurora", top: "#6fd6d0", topS: "#4ab3b0", skirt: "#8f7ce8", skirtS: "#6a57c8", sleeve: "#e8fbff", glove: "#ffffff", legs: null, boots: "#e8fbff", bootsS: "#b9c8e0", gown: true,
      gradient: ["#6fd6d0", "#8fb4ef", "#8f7ce8", "#c07ce0", "#ff9fc8"], wings: ["#9ff0e6", "#b8a8ff", "#ffc8ea"], bigWings: true, tiara: true, sparkle: ["#ffffff", "#9ff0e6", "#ffc8ea"], pantsM: "#6a57c8" },
    { id: "royal", top: "#7a3fc0", topS: "#5a2b98", skirt: "#f2c14e", skirtS: "#c9982c", sleeve: "#f2c14e", glove: "#ffffff", legs: null, boots: "#f2c14e", bootsS: "#c9982c", ballgown: true,
      gradient: ["#f7d36a", "#f2c14e", "#e8a93a", "#c98a2c"], cape: "#c8283a", capeS: "#961c2a", bigCape: true, ermine: true, crown: true, belt: "#7a3fc0", star: "#ffffff",
      sparkle: ["#ffffff", "#fff3a8", "#ff9fc8", "#9fe8ff"], aura: true, pantsM: "#7a3fc0" },
  ];
  // 마법봉 (0: 없음, 1~4: 젤리젤리샵)
  const WANDS = [null, "candy", "note", "rainbow", "piano"];

  function mix(a, b, t) {
    const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const A = p(a), B = p(b);
    return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
  }

  // ---------------- 래스터 도구 ----------------
  function makeRaster() {
    const px = new Array(W * H).fill(null);
    const P = (x, y, c) => { x = Math.round(x) + OX; y = Math.round(y) + OY; if (x >= 0 && y >= 0 && x < W && y < H && c) px[y * W + x] = c; };
    const R = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P(x + i, y + j, c); };
    const E = (cx, cy, rx, ry, c) => {
      for (let y = Math.ceil(cy - ry); y <= Math.floor(cy + ry); y++) {
        const t = (y - cy) / ry, half = rx * Math.sqrt(Math.max(0, 1 - t * t));
        for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) P(x, y, c);
      }
    };
    return { px, P, R, E };
  }
  // 입체감(2.5D): 빛은 왼쪽 위에서 — 테두리 반사광 + 오른쪽/아래 음영 + 앞머리 그림자
  const RGB = new Map();
  const rgb = (h) => { let v = RGB.get(h); if (!v) { v = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; RGB.set(h, v); } return v; };
  function toCanvas(src, flip, skinSet) {
    const px = flip ? src.map((_, k) => src[Math.floor(k / W) * W + (W - 1 - (k % W))]) : src;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d");
    const img = x.createImageData(W, H);
    const at = (i, j) => (i >= 0 && j >= 0 && i < W && j < H ? px[j * W + i] : null);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const col = px[j * W + i];
      const k = (j * W + i) * 4;
      if (!col) {
        // 자동 외곽선
        if (at(i - 1, j) || at(i + 1, j) || at(i, j - 1) || at(i, j + 1)) { const o = rgb(OUTLINE); img.data[k] = o[0]; img.data[k + 1] = o[1]; img.data[k + 2] = o[2]; img.data[k + 3] = 255; }
        continue;
      }
      let [r, g, b] = rgb(col);
      let f = (i - W / 2) / (W / 2) * 0.2 + (j / H) * 0.08;         // 오른쪽·아래로 갈수록 살짝 어둡게 (둥근 몸통 느낌)
      const eR = !at(i + 1, j), eB = !at(i, j + 1), eL = !at(i - 1, j), eT = !at(i, j - 1);
      if ((eL || eT) && !(eR || eB)) f -= 0.28;               // 빛 받는 테두리 = 반사광
      else if (eR || eB) f += 0.26;                           // 반대쪽 테두리 = 음영
      const up = at(i, j - 1);
      if (skinSet.has(col) && up && !skinSet.has(up)) f += 0.16; // 앞머리·옷깃이 얼굴에 드리우는 그림자
      if (f > 0) { r *= 1 - f; g *= 1 - f; b *= 1 - f * 0.85; }
      else { r += (255 - r) * -f; g += (255 - g) * -f; b += (255 - b) * -f; }
      img.data[k] = r; img.data[k + 1] = g; img.data[k + 2] = b; img.data[k + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    return c;
  }

  // ---------------- 캐릭터 그리기 ----------------
  function build(av, dir, frame, opts) {
    const { px, P, R, E } = makeRaster();
    const sk = SKINS[av.skin] || SKINS[0];
    let hc = HAIR_COLORS[av.hairColor] || HAIR_COLORS[2];
    const of = OUTFITS[av.outfit] || OUTFITS[0];
    const eye = EYES[av.eye ?? 0] || EYES[0];
    const hairId = HAIRS[av.hair | 0] || "twin";
    // 샵 헤어는 기본 모양 위에 장식을 더함
    const hair = { buns: "bob", heartlong: "longwave", bigbow: "twin", galaxy: "longwave" }[hairId] || hairId;
    if (hairId === "galaxy") hc = { c: "#4b3fae", s: "#2b2f6b", l: "#ff9fc8" };
    const fem = av.gender !== "m";
    const side = dir === "left" || dir === "right";
    const back = dir === "up";
    const bob = frame === 1 || frame === 3 ? -1 : 0; // 걸을 때 몸이 살짝 위로
    const stepA = frame === 1 ? 1 : frame === 3 ? -1 : 0; // 다리 앞뒤
    const sway = frame === 1 ? 1 : frame === 3 ? -1 : 0;
    const legC = of.onesie ? of.legs : fem ? (of.legs || sk.c) : of.pantsM;
    const hy = bob; // 머리/몸 y 보정

    // ===== 날개 (가장 뒤) =====
    if (of.wings) {
      const big = of.bigWings ? 1.35 : 1;
      const wing = (sx) => {
        if (side && sx > 0) return;
        const bx = side ? CX - 6 : CX + sx * 9;
        E(bx, 19 + hy - 2, 6 * big, 8 * big, of.wings[0]);
        E(bx + (side ? -1 : sx), 19 + hy + 7 * big, 4.5 * big, 5 * big, of.wings[1]);
        E(bx + sx * 1, 19 + hy - 3, 3 * big, 4 * big, of.wings[2]);
        for (let k = 0; k < 6 * big; k++) P(bx + (side ? -k : sx * k), 19 + hy - 1 + Math.round(k / 2), mix(of.wings[0], "#5a7aa8", 0.35)); // 날개 결
      };
      wing(-1); wing(1);
      if (of.bigWings) for (let k = 0; k < 8; k++) { P(CX - 16 + ((k * 5) % 9), 12 + k * 2 + hy, "#ffffff"); P(CX + 16 - ((k * 3) % 9), 13 + k * 2 + hy, "#ffffff"); }
    }
    // ===== 은하수 롱헤어 (샵, 발끝까지) =====
    if (hairId === "galaxy") {
      const gcol = ["#2b2f6b", "#3c3a9a", "#5a4cc0", "#7b5ad0", "#a56ad8", "#d27ad8", "#ff9fc8"];
      for (let i = 0; i < 31; i++) {
        const wv = Math.round(Math.sin(i / 3 + sway * 0.5) * 1.5);
        const w = side ? 10 : Math.min(24, 18 + Math.floor(i / 5));
        const x0 = (side ? CX - 12 : CX - Math.floor(w / 2)) + wv;
        R(x0, 8 + i + hy, w, 1, gcol[Math.min(gcol.length - 1, Math.floor(i / 4.5))]);
      }
      [[-9, 14], [8, 18], [-6, 24], [10, 27], [-11, 31], [5, 34], [-3, 37], [9, 36]].forEach(([dx, dy], k) => { if (!side || dx < 0) { P(CX + dx, dy + hy, k % 2 ? "#fff3a8" : "#ffffff"); } });
    }
    // ===== 뒷머리 (몸 뒤) =====
    const tail = (cx0, dirx, len, y0 = 5) => { // 웨이브 트윈테일 (세로 결 + 부드러운 S자)
      for (let i = 0; i < len; i++) {
        const y = y0 + i + hy;
        const wv = Math.round(Math.sin(i / 3.6 + 0.6 + sway * 0.5) * 1.4) * dirx;
        const w = i < 2 ? 3 : i > len - 3 ? 2 : i > len - 6 ? 3 : 4;
        const x0 = cx0 + wv + (i < 3 ? -dirx * (3 - i) : 0) - Math.floor(w / 2);
        R(x0, y, w, 1, hc.c);
        P(dirx < 0 ? x0 + w - 1 : x0, y, hc.s);            // 안쪽 그림자 결
        if (w > 2 && i % 6 < 4) P(dirx < 0 ? x0 + 1 : x0 + w - 2, y, hc.l); // 윤기
      }
    };
    if (!side) {
      if (hair === "twin") { const L = hairId === "bigbow" ? 28 : 23; tail(CX - 11, -1, L); tail(CX + 11, 1, L); }
      if (hair === "longwave") { for (let i = 0; i < 18; i++) { const wv = Math.round(Math.sin(i / 2.2) * 1); R(CX - 9 + wv, 8 + i + hy, 19 - wv * 2, 1, i % 4 === 3 ? hc.s : hc.c); } }
      if (hair === "pony" && back) { for (let i = 0; i < 13; i++) R(CX - 2 + Math.round(Math.sin(i / 2 + sway)), 9 + i + hy, 4, 1, i % 4 === 3 ? hc.s : hc.c); }
    } else {
      if (hair === "twin") tail(CX - 7, -1, 22, 5);
      if (hair === "longwave") for (let i = 0; i < 17; i++) R(CX - 7 + Math.round(Math.sin(i / 2.2)), 8 + i + hy, 8, 1, i % 4 === 3 ? hc.s : hc.c);
      if (hair === "pony") for (let i = 0; i < 12; i++) R(CX - 9 + Math.round(Math.sin(i / 2 + sway)), 7 + i + hy, 4, 1, i % 4 === 3 ? hc.s : hc.c);
    }
    // ===== 망토 (몸 뒤) =====
    if (of.cape && of.bigCape) { // 큰 망토 (샵 고급 의상)
      const trim = of.ermine ? "#ffffff" : null;
      if (back) { for (let y = 18; y < 38; y++) { const w = 14 + Math.floor((y - 18) * 0.7); R(CX - Math.floor(w / 2), y + hy, w, 1, y > 34 ? of.capeS : of.cape); if (trim && y > 35) for (let i = 0; i < w; i += 3) P(CX - Math.floor(w / 2) + i, y + hy, "#1b1820"); }
        if (of.moon) { E(CX, 26 + hy, 4, 4, "#f7e27a"); E(CX + 2, 25 + hy, 3.5, 3.5, of.cape); P(CX - 4, 22 + hy, "#ffffff"); P(CX + 5, 30 + hy, "#ffffff"); }
        if (trim) for (let y = 18; y < 38; y++) { const w = 14 + Math.floor((y - 18) * 0.7); P(CX - Math.floor(w / 2), y + hy, trim); P(CX + Math.ceil(w / 2) - 1, y + hy, trim); } }
      else if (side) { for (let y = 18; y < 37; y++) R(9 - Math.floor((y - 18) / 2.5) - (y > 26 ? sway : 0), y + hy, 7, 1, y > 33 ? of.capeS : of.cape); }
      else { for (let y = 19; y < 37; y++) { const o = Math.floor((y - 19) / 3); R(CX - 9 - o, y + hy, 3, 1, of.capeS); R(CX + 7 + o, y + hy, 3, 1, of.capeS); if (trim) { P(CX - 9 - o, y + hy, trim); P(CX + 9 + o, y + hy, trim); } } }
    } else if (of.cape) {
      if (back) { for (let y = 19; y < 34; y++) { const w = 12 + Math.floor((y - 19) / 2); R(CX - Math.floor(w / 2), y + hy, w, 1, y > 30 ? of.capeS : of.cape); } }
      else if (side) { for (let y = 19; y < 33; y++) R(10 - Math.floor((y - 19) / 3) - (y > 26 ? sway : 0), y + hy, 5, 1, y > 29 ? of.capeS : of.cape); }
      else { R(CX - 8, 20 + hy, 2, 12, of.capeS); R(CX + 6, 20 + hy, 2, 12, of.capeS); R(CX - 9, 28 + hy, 2, 5, of.cape); R(CX + 7, 28 + hy, 2, 5, of.cape); }
    }
    // ===== 다리 & 신발 =====
    if (side) {
      const legs = [[CX - 1 + stepA * 2, 0], [CX - 1 - stepA * 2, 1]];
      for (const [lx, k] of legs) {
        R(lx, 27 + hy, 3, 6, k ? mix(legC, "#000000", 0.12) : legC);
        R(lx, 32, 4, 5, k ? of.bootsS : of.boots); if (of.cuff) R(lx, 32, 4, 1, of.cuff);
      }
    } else {
      const lL = stepA > 0 ? -1 : 0, lR = stepA < 0 ? -1 : 0;
      R(CX - 4, 27 + hy + lL, 3, 6, legC); R(CX + 1, 27 + hy + lR, 3, 6, legC);
      R(CX - 5, 32 + lL, 4, 5, of.boots); R(CX + 1, 32 + lR, 4, 5, of.boots);
      R(CX - 5, 36 + lL, 4, 1, of.bootsS); R(CX + 1, 36 + lR, 4, 1, of.bootsS);
      if (of.cuff) { R(CX - 5, 32 + lL, 4, 1, of.cuff); R(CX + 1, 32 + lR, 4, 1, of.cuff); P(CX - 3, 33 + lL, of.cuff); P(CX + 3, 33 + lR, of.cuff); }
    }
    // ===== 몸통 =====
    const ty = 19 + hy;
    if (side) {
      R(CX - 3, ty, 7, 6, of.top); R(CX - 3, ty + 5, 7, 1, of.topS);
      if (of.belly) R(CX + 1, ty + 1, 3, 5, of.belly);
    } else {
      R(CX - 4, ty, 9, 6, of.top); R(CX - 4, ty + 5, 9, 1, of.topS);
      if (!back) {
        if (of.shirt) { R(CX - 1, ty, 3, 5, of.shirt); }
        if (of.belly) R(CX - 2, ty + 1, 5, 6, of.belly);
        if (of.collar) { R(CX - 4, ty, 9, 2, of.collar); R(CX - 1, ty + 2, 3, 1, of.collar); }
        if (of.bow) { R(CX - 2, ty, 5, 2, of.bow); P(CX, ty + 2, of.bow); }
        if (of.pearls) { P(CX - 3, ty + 2, "#f1ecf7"); P(CX + 3, ty + 3, "#f1ecf7"); R(CX, ty, 1, 6, "#4a4458"); }
        if (of.overall) { R(CX - 3, ty + 2, 7, 4, of.overall); R(CX - 3, ty, 1, 2, of.overall); R(CX + 3, ty, 1, 2, of.overall); }
        if (of.cape) { R(CX - 5, ty - 1, 11, 2, of.cape); R(CX - 1, ty + 1, 3, 1, of.cape); P(CX, ty + 1, of.star); P(CX, ty + 3, "#ffffff"); P(CX, ty + 4, "#ffffff"); }
        if (of.heart) { P(CX - 1, ty + 1, of.heart); P(CX + 1, ty + 1, of.heart); R(CX - 1, ty + 2, 3, 1, of.heart); P(CX, ty + 3, of.heart); }
        if (of.apron) { R(CX - 2, ty + 1, 5, 4, of.apron); P(CX - 3, ty, of.apron); P(CX + 3, ty, of.apron); }
        if (of.belt) { R(CX - 4, ty + 5, 9, 1, of.belt); P(CX, ty + 5, of.star); P(CX - 1, ty + 5, of.star); P(CX + 1, ty + 5, of.star); }
      } else if (of.cape) R(CX - 5, ty - 1, 11, 3, of.cape);
    }
    // 치마 / 바지
    if (of.ballgown) { // 볼가운 (가장 비싼 의상 — 제일 넓고 화려)
      for (let i = 0; i < 14; i++) { const w = (side ? 10 : 13) + Math.min(i, 7) * 2; const c = of.gradient[Math.min(of.gradient.length - 1, Math.floor(i / 4))]; R(CX - Math.floor(w / 2), ty + 5 + i, w, 1, c);
        if (i % 4 === 2) for (let k = 0; k < w; k += 4) P(CX - Math.floor(w / 2) + k + (i % 8 ? 2 : 0), ty + 5 + i, "#ffffff"); }
      const wb = (side ? 10 : 13) + 14; for (let k = 0; k < wb; k++) if (k % 2 === 0) P(CX - Math.floor(wb / 2) + k, ty + 18, "#7a3fc0");
    } else if (of.gown) { // 롱 드레스
      for (let i = 0; i < 12; i++) { const w = (side ? 8 : 11) + Math.min(i, 6) * 2; const c = of.gradient ? of.gradient[Math.min(of.gradient.length - 1, Math.floor(i / 2.5))] : i >= 10 ? of.skirtS : of.skirt; R(CX - Math.floor(w / 2), ty + 5 + i, w, 1, c); }
    } else if (fem && of.tiers) { // 2단 프릴 (아이돌)
      for (let i = 0; i < 6; i++) { const w = (side ? 9 : 12) + i * 2; R(CX - Math.floor(w / 2), ty + 5 + i, w, 1, of.tiers[Math.floor(i / 2) % of.tiers.length]); }
      const w = (side ? 9 : 12) + 12; for (let k = 0; k < w; k++) if (k % 2 === 0) P(CX - Math.floor(w / 2) + k, ty + 11, of.frill);
    } else if (fem && !of.onesie) {
      for (let i = 0; i < 4; i++) { const w = (side ? 8 : 11) + i * 2; R(CX - Math.floor(w / 2) + (side ? 0 : 0), ty + 5 + i, w, 1, i === 3 ? of.skirtS : of.skirt); }
      if (of.frill) { const w = (side ? 8 : 11) + 8; for (let i = 0; i < w; i++) if (i % 2 === 0) P(CX - Math.floor(w / 2) + i, ty + 9, of.frill); }
      if (of.checker) for (let i = 0; i < 4; i++) { const w = (side ? 8 : 11) + i * 2; for (let k = 0; k < w; k++) if ((k + i) % 2 === 0) P(CX - Math.floor(w / 2) + k, ty + 5 + i, of.checker); }
      if (of.apron && !back) { R(CX - 3, ty + 5, 7, 4, of.apron); }
      if (of.dots && !back) [[-4, 6], [4, 7], [-2, 8], [5, 5]].forEach(([dx, dy], k) => P(CX + dx, ty + dy, of.dots[k % 2]));
    } else {
      R(CX - (side ? 3 : 4), ty + 5, side ? 7 : 9, 3, of.onesie ? of.top : of.pantsM);
    }
    if (of.sparkle && !back) { // 반짝이는 원단
      const sp = [[-3, 2], [3, 1], [-1, 4], [2, 6], [-4, 8], [4, 9], [0, 11], [-2, 13], [3, 14]];
      sp.forEach(([dx, dy], k) => P(CX + dx, ty + dy, of.sparkle[k % of.sparkle.length]));
    }
    // 팔 (퍼프 소매 + 장갑)
    const armSw = side ? 0 : sway;
    if (side) {
      R(CX - 1 - stepA, ty + 1, 3, 3, of.sleeve); R(CX - stepA, ty + 3, 2, 3, sk.c); if (of.glove) R(CX - stepA, ty + 5, 2, 2, of.glove);
    } else {
      R(CX - 7, ty, 3, 3, of.sleeve); R(CX + 5, ty, 3, 3, of.sleeve);
      R(CX - 7, ty + 3 + armSw, 2, 4, of.onesie ? of.top : sk.c); R(CX + 6, ty + 3 - armSw, 2, 4, of.onesie ? of.top : sk.c);
      if (of.glove) { R(CX - 7, ty + 5 + armSw, 3, 3, of.glove); R(CX + 5, ty + 5 - armSw, 3, 3, of.glove); }
    }

    // ===== 머리 =====
    const hx = side ? CX + 1 : CX, hyy = 11 + hy;
    E(hx, hyy + 1, 7, 6.5, sk.c);                       // 얼굴
    if (!back) R(hx - 5, hyy + 7, 11, 1, sk.s);         // 턱 그림자
    if (of.hood) {                                       // 곰돌이 후드 (Can't Stop! 커버)
      E(hx, hyy - 4, 9, 5, of.top); R(hx - 9, hyy - 4, 2, 11, of.top); if (!side) R(hx + 8, hyy - 4, 2, 11, of.top);
      E(hx - 6, hyy - 9, 2.4, 2.4, of.top); E(hx + 6, hyy - 9, 2.4, 2.4, of.top);
      P(hx - 6, hyy - 9, "#f2a0a0"); P(hx + 6, hyy - 9, "#f2a0a0");
      if (back) E(hx, hyy + 1, 8.5, 7, of.top);
      else if (side) { E(hx - 3, hyy, 6, 7, of.top); }
      else { for (let x = hx - 6; x <= hx + 6; x++) R(x, hyy - 1, 1, x % 3 ? 2 : 3, hc.c); P(hx + 3, hyy - 3, "#d8434e"); P(hx + 4, hyy - 3, "#3fa46a"); P(hx + 5, hyy - 3, "#e0344a"); }
    } else if (back) {
      E(hx, hyy - 1, 8.5, 8.5, hc.c); for (let i = -6; i <= 6; i += 3) R(hx + i, hyy - 3, 1, 9, hc.s); R(hx - 3, hyy - 8, 5, 1, hc.l);
    } else if (side) {
      E(hx - 1, hyy - 4, 8, 5, hc.c); E(hx - 4, hyy, 5.5, 7, hc.c);
      for (let i = 0; i < 6; i++) R(hx + 1 + i, hyy - 1, 1, 1 + (i % 2), hc.c);
      R(hx - 6, hyy - 7, 5, 1, hc.l); R(hx - 8, hyy, 2, 6, hc.s);
    } else {
      E(hx, hyy - 4, 8.5, 5, hc.c);                    // 윗머리
      R(hx - 4, hyy - 8, 5, 1, hc.l); R(hx - 5, hyy - 7, 2, 1, hc.l); // 광택
      for (let x = hx - 7; x <= hx + 7; x++) { const d = ((x - hx) % 3 + 3) % 3; R(x, hyy, 1, d === 0 ? 2 : 1, hc.c); } // 앞머리
      const longSide = hair === "twin" || hair === "longwave" || hair === "pony" || hair === "bob";
      const sideLen = hair === "bob" ? 9 : longSide ? 8 : 4;
      R(hx - 9, hyy - 3, 2, sideLen, hc.c); R(hx + 8, hyy - 3, 2, sideLen, hc.c);
      R(hx - 9, hyy - 3 + sideLen - 2, 1, 2, hc.s); R(hx + 9, hyy - 3 + sideLen - 2, 1, 2, hc.s);
    }
    if (hair === "spiky" && !of.hood) for (let i = -6; i <= 6; i += 3) { P(hx + i, hyy - 10, hc.c); P(hx + i + 1, hyy - 11, hc.c); }
    if (hair === "twin" && !of.hood) {                   // 리본
      const bc = of.cape ? "#9b5fd6" : of.bow || of.overall || "#9b5fd6";
      const bow = (bx) => { R(bx - 2, hyy - 9, 2, 3, bc); R(bx + 1, hyy - 9, 2, 3, bc); P(bx, hyy - 8, mix(bc, "#000000", 0.3)); };
      if (side) bow(hx - 7); else { bow(hx - 8); bow(hx + 8); }
    }
    if (hair === "pony" && !back && !side && !of.hood) R(hx + 6, hyy - 9, 3, 3, "#d8434e");
    // 샵 헤어 장식
    if (hairId === "buns" && !of.hood) { for (const sx of side ? [-1] : [-1, 1]) { E(hx + sx * 6, hyy - 9, 3.2, 3.2, hc.c); P(hx + sx * 6 - 1, hyy - 11, hc.l); R(hx + sx * 6 - 2, hyy - 6, 5, 1, "#ff8fbf"); } }
    if (hairId === "heartlong" && !back && !of.hood) { const hx0 = side ? hx - 2 : hx + 5; P(hx0, hyy - 6, "#ff5f8f"); P(hx0 + 2, hyy - 6, "#ff5f8f"); R(hx0, hyy - 5, 3, 1, "#ff5f8f"); P(hx0 + 1, hyy - 4, "#ff5f8f"); P(hx0, hyy - 6, "#ffc2d6"); }
    if (hairId === "bigbow" && !of.hood) { // 거대 리본
      const bc = "#ff6fa8", bs = "#d84a86";
      for (let k = 0; k < 7; k++) { R(hx - 11 + k, hyy - 16 + Math.floor(k / 2), 1, 9 - k, bc); R(hx + 11 - k, hyy - 16 + Math.floor(k / 2), 1, 9 - k, bc); }
      R(hx - 2, hyy - 13, 5, 4, bs); R(hx - 1, hyy - 12, 3, 2, "#ffb8d8");
      R(hx - 5, hyy - 9, 2, 5, bc); R(hx + 4, hyy - 9, 2, 5, bc);
    }
    if (hairId === "galaxy" && !of.hood) { [[-5, -8], [3, -7], [6, -4]].forEach(([dx, dy], k) => P(hx + dx, hyy + dy, k % 2 ? "#fff3a8" : "#ffffff")); }
    if (of.tiara) { R(hx - 4, hyy - 9, 9, 1, "#f2c14e"); P(hx - 3, hyy - 10, "#f2c14e"); P(hx, hyy - 11, "#f2c14e"); P(hx, hyy - 10, "#9ff0e6"); P(hx + 3, hyy - 10, "#f2c14e"); }
    if (of.crown) { R(hx - 5, hyy - 12, 11, 4, "#f2c14e"); for (const dx of [-5, -2, 1, 4]) R(hx + dx, hyy - 15, 2, 3, "#f2c14e"); P(hx, hyy - 11, "#d8434e"); P(hx - 3, hyy - 11, "#6fb8ff"); P(hx + 3, hyy - 11, "#3fa46a"); R(hx - 5, hyy - 9, 11, 1, "#c9982c"); }
    // ===== 얼굴 =====
    if (!back) {
      const eyeAt = (ex, w, outer) => {
        R(ex, hyy + 1, w, 1, OUTLINE);                    // 속눈썹
        if (fem) P(outer, hyy + 1, OUTLINE), P(outer, hyy, OUTLINE);
        R(ex, hyy + 2, w, 3, eye);                        // 눈동자
        R(ex, hyy + 5, w, 1, mix(eye, "#ffffff", 0.45));
        R(ex + w - 2, hyy + 3, 1, 2, mix(eye, "#000000", 0.5)); // 동공
        R(ex, hyy + 2, 2, 1, "#ffffff"); P(ex + w - 1, hyy + 4, "#ffffff"); // 반짝
      };
      if (side) { eyeAt(hx + 2, 3, hx + 5); P(hx + 2, hyy + 6, "#f59ab0"); P(hx + 5, hyy + 7, "#b85468"); }
      else {
        eyeAt(hx - 5, 4, hx - 6); eyeAt(hx + 2, 4, hx + 6);
        R(hx - 6, hyy + 6, 2, 1, "#f7a3b8"); R(hx + 5, hyy + 6, 2, 1, "#f7a3b8"); // 볼터치
        R(hx - 1, hyy + 6, 2, 1, "#b85468");              // 입
      }
    }
    // ===== 마법봉 (젤리젤리샵) =====
    const wand = WANDS[av.wand | 0];
    if (wand) {
      const hxw = back ? CX - 7 : side ? CX + 1 : CX + 7, hyw = ty + 6;
      const stick = (len, c1, c2) => { for (let k = 0; k < len; k++) P(hxw + Math.floor(k / 4), hyw - k, k % 2 ? c2 : c1); };
      if (wand === "candy") { stick(6, "#ff8fbf", "#ffffff"); const sx0 = hxw + 1, sy0 = hyw - 8; R(sx0 - 1, sy0, 3, 3, "#f7cd45"); P(sx0, sy0 - 1, "#f7cd45"); P(sx0, sy0 + 3, "#f7cd45"); P(sx0 - 2, sy0 + 1, "#f7cd45"); P(sx0 + 2, sy0 + 1, "#f7cd45"); P(sx0, sy0 + 1, "#fff3a8"); }
      if (wand === "note") { stick(9, "#f2c14e", "#c9982c"); const nx = hxw + 2, ny = hyw - 12; E(nx - 1, ny + 3, 1.6, 1.3, "#5a2b98"); R(nx, ny - 2, 1, 5, "#5a2b98"); R(nx + 1, ny - 2, 2, 1, "#5a2b98"); P(nx + 2, ny - 1, "#5a2b98"); P(nx + 3, ny - 3, "#ffffff"); }
      if (wand === "rainbow") { stick(12, "#ffffff", "#d9d4ec"); const ox = hxw + 3, oy = hyw - 16; const rb = ["#ff6f7d", "#ffb347", "#f7e27a", "#7fe0a0", "#6fb8ff", "#a77ce0"]; E(ox, oy, 3.5, 3.5, "#a77ce0"); for (let k = 0; k < 6; k++) R(ox - 3, oy - 3 + k, 7, 1, rb[k]); E(ox, oy, 1.2, 1.2, "#ffffff"); P(ox - 5, oy, "#ffffff"); P(ox + 5, oy - 2, "#ffffff"); }
      if (wand === "piano") { // 가장 비싼 마법봉 — 크고 화려
        stick(17, "#f2c14e", "#c9982c"); const ox = hxw + 4, oy = hyw - 22;
        R(ox - 5, oy, 11, 5, "#1b1820"); R(ox - 4, oy + 2, 9, 3, "#ffffff"); for (let k = -3; k <= 3; k += 2) R(ox + k, oy + 2, 1, 2, "#1b1820");
        R(ox - 5, oy - 1, 11, 1, "#f2c14e"); for (const dx of [-4, 0, 4]) R(ox + dx, oy - 4, 1, 3, "#f2c14e"); P(ox, oy - 5, "#d8434e");
        [[-8, -2], [7, 1], [-6, 6], [8, 7], [0, -8]].forEach(([dx, dy], k) => P(ox + dx, oy + dy, k % 2 ? "#fff3a8" : "#ffffff"));
      }
    }
    if (of.aura) [[-14, 4], [14, 8], [-12, 18], [13, 22], [-15, 30], [15, 34], [0, -6]].forEach(([dx, dy], k) => P(CX + dx, dy + hy, ["#fff3a8", "#ffffff", "#ff9fc8", "#9fe8ff"][k % 4]));
    // ===== 소품: 키타 (조젤리 전용) =====
    if ((opts.keytar || of.keytar) && !back) {
      const kx = side ? CX - 3 : CX - 7, ky = ty + 3;
      for (let i = 0; i < 12; i++) { R(kx + i, ky + 4 - Math.floor(i / 3), 1, 3, "#e0344a"); if (i > 2 && i < 11) P(kx + i, ky + 5 - Math.floor(i / 3), i % 2 ? "#ffffff" : "#1b1820"); }
    }
    return px;
  }

  const cache = new Map();
  function sprite(av, dir = "down", frame = 0, opts = {}) {
    av = av || { gender: "f", hair: 0, hairColor: 2, skin: 0, outfit: 0, eye: 0 };
    const key = [av.gender, av.hair, av.hairColor, av.skin, av.outfit, av.eye, av.wand | 0, dir, frame, opts.keytar ? 1 : 0].join(",");
    let c = cache.get(key);
    if (!c) {
      const d = dir === "left" ? "right" : dir;
      const sk = SKINS[av.skin] || SKINS[0];
      c = toCanvas(build(av, d, frame, opts), dir === "left", new Set([sk.c, sk.s]));
      if (cache.size > 600) cache.clear();
      cache.set(key, c);
    }
    return c;
  }
  function draw(ctx, av, x, y, dir = "down", frame = 0, opts = {}) {
    // 부드러운 바닥 그림자 (빛이 왼쪽 위라 오른쪽 아래로)
    if (!opts.sit) {
    ctx.save();
    ctx.fillStyle = "rgba(30,15,40,.30)";
    ctx.beginPath(); ctx.ellipse(Math.round(x) + 2, Math.round(y) - 0.5, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(30,15,40,.18)";
    ctx.beginPath(); ctx.ellipse(Math.round(x) + 3, Math.round(y), 12, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    }
    if (opts.sit) { // 앉은 자세: 다리 부분을 잘라 엉덩이가 의자 높이에 오도록
      ctx.drawImage(sprite(av, dir, 0, opts), 0, 0, W, 29 + OY, Math.round(x) - CX - OX, Math.round(y) - 29 - OY, W, 29 + OY);
      return;
    }
    ctx.drawImage(sprite(av, dir, frame, opts), Math.round(x) - CX - OX, Math.round(y) - FOOT - OY);
  }

  window.Avatar = {
    HOST_OUTFITS: OUTFITS.map((o, i) => (o.host ? i : -1)).filter((i) => i >= 0),
    draw, sprite, SKINS, HAIR_COLORS, HAIRS, OUTFITS, EYES, WANDS, mix, HEIGHT: 36,
    // 얼굴(머리) 부분 잘라 그리기: 프로필 아이콘용
    face(ctx, av, w, h) { ctx.imageSmoothingEnabled = false; ctx.drawImage(sprite(av, "down", 0), OX, OY, 32, 26, 0, 0, w, h); },
    random: () => ({
      gender: Math.random() < 0.6 ? "f" : "m", hair: (Math.random() * 6) | 0, wand: 0, hairColor: (Math.random() * HAIR_COLORS.length) | 0,
      skin: (Math.random() * SKINS.length) | 0, outfit: [0, 2, 3, 4, 5, 6][(Math.random() * 6) | 0], eye: (Math.random() * EYES.length) | 0,
    }),
  };
})();
