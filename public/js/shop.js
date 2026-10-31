/* 젤리젤리샵 상품 목록 — netlify/functions/api.mjs 의 SHOP 과 같아야 함 (가격은 10코인 단위) */
window.JELLY_SHOP = [
  { id: "h_buns", kind: "hair", idx: 6, price: 100, name: { ko: "당고 머리", en: "Bun Hair", ja: "おだんごヘア" } },
  { id: "w_candy", kind: "wand", idx: 1, price: 200, name: { ko: "별사탕 요술봉", en: "Star Candy Wand", ja: "こんぺいとうステッキ" } },
  { id: "o_gingham", kind: "outfit", idx: 10, price: 300, name: { ko: "딸기 깅엄 원피스", en: "Strawberry Gingham", ja: "いちごギンガム" } },
  { id: "h_heart", kind: "hair", idx: 7, price: 500, name: { ko: "하트핀 롱헤어", en: "Heart-Pin Long Hair", ja: "ハートピンロング" } },
  { id: "w_note", kind: "wand", idx: 2, price: 800, name: { ko: "음표 지휘봉", en: "Music Note Baton", ja: "音符タクト" } },
  { id: "o_cherry", kind: "outfit", idx: 11, price: 1200, name: { ko: "체리 앞치마 드레스", en: "Cherry Apron Dress", ja: "チェリーエプロン" } },
  { id: "h_bigbow", kind: "hair", idx: 8, price: 1800, name: { ko: "왕리본 트윈테일", en: "Giant Bow Twintails", ja: "おおきなリボンツイン" } },
  { id: "o_moon", kind: "outfit", idx: 12, price: 2500, name: { ko: "달빛 마법사 망토", en: "Moonlight Mage Cape", ja: "月あかりの魔法マント" } },
  { id: "w_rainbow", kind: "wand", idx: 3, price: 3500, name: { ko: "무지개 오브 스태프", en: "Rainbow Orb Staff", ja: "にじいろオーブの杖" } },
  { id: "o_idol", kind: "outfit", idx: 13, price: 5000, name: { ko: "아이돌 스테이지 의상", en: "Idol Stage Outfit", ja: "アイドルステージ衣装" } },
  { id: "h_galaxy", kind: "hair", idx: 9, price: 7000, name: { ko: "은하수 롱헤어", en: "Galaxy Long Hair", ja: "銀河ロングヘア" } },
  { id: "o_fairy", kind: "outfit", idx: 14, price: 9000, name: { ko: "요정 날개 드레스", en: "Fairy Wing Dress", ja: "ようせいの羽ドレス" } },
  { id: "w_piano", kind: "wand", idx: 4, price: 12000, name: { ko: "그랜드 피아노 셉터", en: "Grand Piano Scepter", ja: "グランドピアノの笏" } },
  { id: "o_aurora", kind: "outfit", idx: 15, price: 15000, name: { ko: "오로라 프린세스 가운", en: "Aurora Princess Gown", ja: "オーロラプリンセス" } },
  // 16: 관리자(호스트 포함) 전용 — 판매하지 않음 (이름만 표시용)
  { id: "o_royal", kind: "outfit", idx: 16, price: 30000, staff: true, name: { ko: "젤리 퀸 로열 드레스", en: "Jelly Queen Royal Gown", ja: "ゼリークイーンドレス" } },
  // 17~24: 고급 의상 (3만~10만) — 오로라 불빛은 10만 코인 의상만
  { id: "o_tweed", kind: "outfit", idx: 17, price: 30000, name: { ko: "샴페인 트위드 셋업", en: "Champagne Tweed Set", ja: "シャンパンツイードセット" } },
  { id: "o_velvet", kind: "outfit", idx: 18, price: 40000, name: { ko: "블랙 벨벳 원피스", en: "Black Velvet Dress", ja: "ブラックベルベットワンピース" } },
  { id: "o_rose", kind: "outfit", idx: 19, price: 50000, name: { ko: "로즈 새틴 이브닝 드레스", en: "Rose Satin Evening Gown", ja: "ローズサテンイブニングドレス" } },
  { id: "o_midnight", kind: "outfit", idx: 20, price: 60000, name: { ko: "미드나잇 실크 드레스", en: "Midnight Silk Gown", ja: "ミッドナイトシルクドレス" } },
  { id: "o_emerald", kind: "outfit", idx: 21, price: 70000, name: { ko: "에메랄드 레이스 가운", en: "Emerald Lace Gown", ja: "エメラルドレースガウン" } },
  { id: "o_pearl", kind: "outfit", idx: 22, price: 80000, name: { ko: "화이트 펄 롱 드레스", en: "White Pearl Long Gown", ja: "ホワイトパールロングドレス" } },
  { id: "o_burgundy", kind: "outfit", idx: 23, price: 90000, name: { ko: "버건디 벨벳 망토 드레스", en: "Burgundy Velvet Cape Gown", ja: "バーガンディベルベットケープドレス" } },
  { id: "o_celestial", kind: "outfit", idx: 24, price: 100000, name: { ko: "오로라 셀레스티얼 가운", en: "Aurora Celestial Gown", ja: "オーロラセレスティアルガウン" } },
  // 💬 말풍선 (호스트·관리자 전용 말풍선은 판매하지 않음)
  { id: "b_yellow", kind: "bubble", idx: 1, price: 700, name: { ko: "노란 테두리 말풍선", en: "Yellow Frame Bubble", ja: "きいろフチの吹き出し" } },
  { id: "b_blue", kind: "bubble", idx: 2, price: 700, name: { ko: "파란 테두리 말풍선", en: "Blue Frame Bubble", ja: "あおフチの吹き出し" } },
  { id: "b_green", kind: "bubble", idx: 3, price: 700, name: { ko: "초록 테두리 말풍선", en: "Green Frame Bubble", ja: "みどりフチの吹き出し" } },
  { id: "b_dots", kind: "bubble", idx: 4, price: 1000, name: { ko: "딸기우유 물방울 말풍선", en: "Strawberry Milk Polka Bubble", ja: "いちごミルク水玉の吹き出し" } },
  { id: "b_rainbow", kind: "bubble", idx: 5, price: 1500, name: { ko: "무지개 테두리 말풍선", en: "Rainbow Frame Bubble", ja: "にじいろフチの吹き出し" } },
  { id: "b_star", kind: "bubble", idx: 6, price: 2000, name: { ko: "반짝 별밤 말풍선", en: "Twinkling Night Bubble", ja: "きらめく星夜の吹き出し" } },
  // 왕관이 들어간 아이템은 관리자(호스트 포함) 전용 — 판매하지 않음
  { id: "b_gold", kind: "bubble", idx: 7, price: 3000, staff: true, name: { ko: "골드 크라운 말풍선", en: "Gold Crown Bubble", ja: "ゴールドクラウンの吹き出し" } },
];
