// 시간대 경계 시험 (한국 시간 기준). 기기 시간대를 바꿔 돌려도 결과가 같아야 함:
//   TZ=America/New_York node tests/gfx-time.test.mjs
import fs from "node:fs"; import vm from "node:vm"; import assert from "node:assert";
const realNow = Date.now;
const window = {};
const ctx = vm.createContext({ window, location: { search: "" }, URLSearchParams, Date, Math, JSON, Map, Array, Uint8ClampedArray, performance });
vm.runInContext(fs.readFileSync(new URL("../public/js/gfx.js", import.meta.url), "utf8"), ctx);
const Gfx = window.Gfx;
const at = (hh, mm, ss = 0) => { Date.now = () => Date.UTC(2026, 10, 3, hh - 9, mm, ss); }; // 한국 시간 hh:mm:ss 인 순간

const CASES = [["05:59", "night"], ["06:00", "dusk"], ["07:59", "dusk"], ["08:00", "day"], ["15:59", "day"], ["16:00", "dusk"], ["19:59", "dusk"], ["20:00", "night"], ["00:00", "night"], ["12:00", "day"]];
for (const [hm, want] of CASES) { const [h, m] = hm.split(":").map(Number); at(h, m); assert.equal(Gfx.phaseName(), want, hm); }
at(5, 59, 59); assert.equal(Gfx.phaseName(), "night", "05:59:59");
at(15, 59, 59); assert.equal(Gfx.phaseName(), "day", "15:59:59");

// 화면 색: 경계 직전은 이전 색 그대로, 1분 뒤에는 새 색으로 완전히 바뀜 (새로고침 없이 매번 계산됨)
const top = () => [...Gfx.phase().top].map(Math.round).join();
const NIGHT = "72,80,160", DUSK = "255,218,178", DAY = "255,253,246";
for (const [hb, m0, before, after] of [[6, 0, NIGHT, DUSK], [8, 0, DUSK, DAY], [16, 0, DAY, DUSK], [20, 0, DUSK, NIGHT]]) {
  at(hb - 1, 59, 59); assert.equal(top(), before, `${hb}:00 직전`);
  at(hb, m0, 0); assert.equal(top(), before, `${hb}:00 시작`);
  at(hb, m0, 30); assert.notEqual(top(), before, `${hb}:00:30 바뀌는 중`); assert.notEqual(top(), after, `${hb}:00:30 바뀌는 중`);
  at(hb, 1, 0); assert.equal(top(), after, `${hb}:01`);
}
// 네온: 밤에만 켜짐 (저녁은 그대로)
at(18, 0); assert.equal(Gfx.phase().neon, 0); at(22, 0); assert.equal(Gfx.phase().neon, 1); at(12, 0); assert.equal(Gfx.phase().neon, 0);
// ?time= 고정 값이 시계보다 우선
at(12, 0); Gfx.hour = 22; assert.equal(Gfx.phaseName(), "night"); Gfx.hour = undefined;
Date.now = realNow;
console.log("ok", process.env.TZ || "(기기 시간대)", new Date().getTimezoneOffset());
