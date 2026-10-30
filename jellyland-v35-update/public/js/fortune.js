/* 🔮 오늘의 운세 — 젤리게임월드
   생년월일 + 오늘 날짜로 섞어서 운세를 골라요 (같은 날 같은 생일이면 같은 운세, 날이 바뀌면 새 운세) */
(function () {
  const MSG = {
    ko: [
      "오늘은 무엇을 해도 리듬이 딱딱 맞는 날! 망설였던 일을 시작해 보세요.",
      "작은 친절이 큰 행운이 되어 돌아와요. 먼저 인사를 건네 보세요 ♪",
      "머릿속에 맴도는 멜로디가 있다면 꼭 적어 두세요. 좋은 아이디어가 숨어 있어요.",
      "조금 느린 템포로 가도 괜찮아요. 쉼표도 음악의 일부랍니다.",
      "오랜만에 연락 온 사람이 기분 좋은 소식을 가져올 거예요.",
      "달콤한 간식이 행운을 불러요. 젤리 한 봉지 어때요?",
      "오늘 들은 음악 한 곡이 하루 전체를 바꿔 줄 거예요.",
      "계획대로 안 돼도 즉흥 연주처럼 즐기면 더 멋진 결과가 나와요!",
      "주변 사람과 합주하듯 함께하면 두 배로 빛나는 날이에요.",
      "잃어버린 물건을 찾거나 뜻밖의 선물을 받을 수 있어요.",
      "새로운 장르에 도전해 보세요. 숨겨진 재능을 발견할지도!",
      "마음이 복잡하다면 산책하며 좋아하는 노래를 들어 보세요.",
      "오늘 한 연습은 평소의 두 배 효과! 꾸준함이 빛나는 날이에요.",
      "웃음이 끊이지 않는 하루. 당신의 미소가 누군가의 BGM이 돼요.",
      "작은 목표 하나를 이루면 기분 좋은 도미노가 시작돼요.",
      "행운의 여신이 박자를 맞춰 주고 있어요. 자신감을 가지세요!",
    ],
    en: [
      "Everything falls right on the beat today! Start what you've been putting off.",
      "A small kindness comes back as big luck. Say hello first ♪",
      "If a melody is stuck in your head, write it down — a great idea is hiding in it.",
      "A slower tempo is fine today. Rests are part of the music, too.",
      "Someone you haven't heard from in a while brings happy news.",
      "Something sweet brings luck. How about a bag of jellies?",
      "One song you hear today will change your whole day.",
      "If plans go off-script, treat it like an improv solo — it turns out even better!",
      "Team up like a band today and you'll shine twice as bright.",
      "You may find something you lost, or get an unexpected gift.",
      "Try a new genre — you might discover a hidden talent!",
      "Feeling tangled? Take a walk with your favorite song.",
      "Practice counts double today! Your steady effort shines.",
      "A day full of laughter. Your smile becomes someone's BGM.",
      "Reach one small goal and a happy domino effect begins.",
      "Lady Luck is keeping time for you. Be confident!",
    ],
    ja: [
      "今日は何をしてもリズムがぴったり！迷っていたことを始めてみて。",
      "小さな親切が大きな幸運になって戻ってくるよ。先にあいさつしてみて ♪",
      "頭の中に流れるメロディーはメモしておいて。いいアイデアが隠れてる！",
      "少しゆっくりのテンポでも大丈夫。休符も音楽の一部だよ。",
      "久しぶりに連絡をくれる人が、うれしい知らせを運んでくれそう。",
      "甘いおやつが幸運を呼ぶよ。ゼリーはいかが？",
      "今日聴く一曲が、一日をまるごと変えてくれるかも。",
      "予定どおりにいかなくても、アドリブを楽しめばもっと素敵な結果に！",
      "周りの人とセッションするように協力すると、二倍輝く日。",
      "なくした物が見つかったり、思わぬプレゼントがあるかも。",
      "新しいジャンルに挑戦してみて。隠れた才能が見つかるかも！",
      "モヤモヤするときは、好きな曲を聴きながらお散歩を。",
      "今日の練習は効果二倍！コツコツが光る日だよ。",
      "笑顔の絶えない一日。あなたの笑顔が誰かのBGMに。",
      "小さな目標をひとつ叶えると、うれしいドミノが始まるよ。",
      "幸運の女神がリズムを合わせてくれてる。自信をもって！",
    ],
  };
  const COLORS = [
    ["#ff7fae", { ko: "젤리 핑크", en: "Jelly Pink", ja: "ゼリーピンク" }],
    ["#a77ce0", { ko: "라벤더 퍼플", en: "Lavender Purple", ja: "ラベンダーパープル" }],
    ["#4fc3b0", { ko: "민트", en: "Mint", ja: "ミント" }],
    ["#ffd34d", { ko: "레몬 옐로", en: "Lemon Yellow", ja: "レモンイエロー" }],
    ["#6fb8ff", { ko: "스카이 블루", en: "Sky Blue", ja: "スカイブルー" }],
    ["#ff9f43", { ko: "오렌지", en: "Orange", ja: "オレンジ" }],
    ["#d8434e", { ko: "체리 레드", en: "Cherry Red", ja: "チェリーレッド" }],
    ["#ffffff", { ko: "피아노 화이트", en: "Piano White", ja: "ピアノホワイト" }],
    ["#2b2436", { ko: "피아노 블랙", en: "Piano Black", ja: "ピアノブラック" }],
    ["#8fe07a", { ko: "새싹 그린", en: "Sprout Green", ja: "わかばグリーン" }],
  ];
  const SONGS = ["Can't Stop! — Jo Jelly", "Autumn Leaves", "Fly Me to the Moon", "Clair de Lune — Debussy", "Nocturne Op.9 No.2 — Chopin",
    "Gymnopédie No.1 — Satie", "Take the A Train", "Moanin'", "Spain — Chick Corea", "Canon in D — Pachelbel", "Isn't She Lovely", "Maple Leaf Rag — Joplin"];
  const SIGNS = {
    ko: ["염소자리", "물병자리", "물고기자리", "양자리", "황소자리", "쌍둥이자리", "게자리", "사자자리", "처녀자리", "천칭자리", "전갈자리", "사수자리"],
    en: ["Capricorn", "Aquarius", "Pisces", "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius"],
    ja: ["やぎ座", "みずがめ座", "うお座", "おひつじ座", "おうし座", "ふたご座", "かに座", "しし座", "おとめ座", "てんびん座", "さそり座", "いて座"],
  };
  const SIGN_START = [20, 19, 21, 20, 21, 22, 23, 23, 23, 24, 23, 22]; // 각 달에서 다음 별자리가 시작되는 날
  const ANIMALS = {
    ko: ["원숭이", "닭", "개", "돼지", "쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양"],
    en: ["Monkey", "Rooster", "Dog", "Pig", "Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat"],
    ja: ["申（さる）", "酉（とり）", "戌（いぬ）", "亥（いのしし）", "子（ねずみ）", "丑（うし）", "寅（とら）", "卯（うさぎ）", "辰（たつ）", "巳（へび）", "午（うま）", "未（ひつじ）"],
  };
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296); }
  const kstDay = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

  function make(birth, lang) {
    const [y, m, d] = birth.split("-").map(Number);
    const r = rng(hash(birth + "|" + kstDay()));
    const pick = (a) => a[Math.floor(r() * a.length)];
    const stars = () => 1 + Math.floor(r() * 5);
    const signIdx = (m - 1 + (d >= SIGN_START[m - 1] ? 1 : 0)) % 12;
    const col = pick(COLORS);
    return {
      msg: pick(MSG[lang] || MSG.ko), total: 2 + Math.floor(r() * 4), love: stars(), money: stars(), health: stars(),
      color: col[0], colorName: col[1][lang] || col[1].ko, num: 1 + Math.floor(r() * 99), song: pick(SONGS),
      sign: (SIGNS[lang] || SIGNS.ko)[signIdx], animal: (ANIMALS[lang] || ANIMALS.ko)[((y % 12) + 12) % 12],
    };
  }
  window.Fortune = { make, today: kstDay };
})();
